import { GitHubLoader } from './github-loader.js';
import { LocalLoader } from './local-loader.js';
import { AutoDiscovery } from './auto-discovery.js';
import { TokenManager } from './token-manager.js';
import { SearchEngine } from './search-engine.js';
import { DocumentCache } from './document-cache.js';
import { promises as fs } from 'fs';
import path from 'path';

export class RepositoryManager {
  constructor(configPath = './config/repositories.json') {
    this.configPath = configPath;
    this.repositories = new Map();
    this.githubLoader = new GitHubLoader(process.env.GITHUB_TOKEN);
    this.localLoader = new LocalLoader();
    this.tokenManager = new TokenManager();
    this.searchEngine = new SearchEngine();
    this.documentCache = new DocumentCache();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await this.loadConfiguration();

      // Try to load cache from disk first
      const cacheLoaded = await this.documentCache.loadFromDisk();

      if (cacheLoaded.success) {
        console.log(`[RepositoryManager] Loaded ${cacheLoaded.documentCount} documents from persistent cache (${cacheLoaded.cacheAge}h old)`);

        // Still validate repositories to get structure
        await this.validateAllRepositories();

        // Build search index from cached documents (fast!)
        await this.buildSearchIndexFromCache();
      } else {
        console.log(`[RepositoryManager] Cache load failed (${cacheLoaded.reason}), building fresh...`);

        // Validate and download all documents
        await this.validateAllRepositories();

        // Build search index from newly downloaded docs
        await this.searchEngine.rebuildIndex(this);

        // Save to disk for next restart
        await this.documentCache.saveToDisk();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize RepositoryManager:', error);
      throw error;
    }
  }

  /**
   * Build search index from already cached documents (no downloading)
   */
  async buildSearchIndexFromCache() {
    console.log('[RepositoryManager] Building search index from cached documents...');

    const repos = Array.from(this.repositories.values());
    const indexPromises = [];

    for (const repo of repos) {
      if (repo.validated && repo.enabled && repo.structure) {
        const loadDocFn = async (file) => {
          const cached = this.documentCache.get(repo.id, file);
          if (!cached) {
            console.warn(`[RepositoryManager] Document ${file} not in cache for ${repo.id}`);
          }
          return cached || '';
        };

        indexPromises.push(
          this.searchEngine.indexRepository(repo.id, repo.structure, loadDocFn)
            .catch(error => {
              console.error(`[RepositoryManager] Failed to index ${repo.id}:`, error.message);
              return 0;
            })
        );
      }
    }

    await Promise.all(indexPromises);
    console.log('[RepositoryManager] Search index built from cache');
  }

  async loadConfiguration() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      if (!config.repositories || !Array.isArray(config.repositories)) {
        throw new Error('Invalid configuration: missing repositories array');
      }

      for (const repo of config.repositories) {
        // Decrypt token if it exists
        if (repo.encryptedToken) {
          repo.token = this.tokenManager.decrypt(repo.encryptedToken);
          delete repo.encryptedToken;
        }
        await this.addRepository(repo);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No configuration file found, creating default...');
        await this.createDefaultConfiguration();
      } else {
        throw error;
      }
    }
  }

  async createDefaultConfiguration() {
    const defaultConfig = {
      version: "1.0.0",
      repositories: []
    };

    const configDir = path.dirname(this.configPath);
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2));
  }

  async addRepository(config) {
    if (!config.id || !config.url) {
      throw new Error('Repository config must have id and url');
    }

    // Check if it's a local repository
    const isLocal = config.url.startsWith('local://');
    let parsed;

    if (isLocal) {
      parsed = this.localLoader.parseLocalUrl(config.url);
    } else {
      parsed = this.githubLoader.parseGitHubUrl(config.url);

      // Fetch actual default branch if we defaulted to 'main'
      if (parsed.branch === 'main' && !config.url.includes('/tree/')) {
        try {
          const actualBranch = await this.githubLoader.getDefaultBranch(parsed.owner, parsed.repo);
          parsed.branch = actualBranch;
          console.log(`[RepositoryManager] Detected default branch: ${actualBranch} for ${parsed.owner}/${parsed.repo}`);
        } catch (error) {
          console.warn(`[RepositoryManager] Could not fetch default branch, using 'main':`, error.message);
        }
      }
    }

    const repository = {
      id: config.id,
      name: config.name || config.id,
      description: config.description || '',
      url: config.url,
      isLocal: isLocal,
      github: isLocal ? null : parsed,
      localPath: isLocal ? parsed.path : null,
      token: config.token || null,
      enabled: config.enabled !== false,
      children: new Map()
    };

    if (config.parent) {
      const parent = this.repositories.get(config.parent);
      if (!parent) {
        throw new Error(`Parent repository ${config.parent} not found`);
      }
      parent.children.set(config.id, repository);
    } else {
      this.repositories.set(config.id, repository);
    }

    return repository;
  }

  async validateAllRepositories() {
    const validationPromises = [];
    
    for (const [id, repo] of this.repositories) {
      if (repo.enabled) {
        validationPromises.push(
          this.validateRepository(repo)
            .then(result => ({ id, ...result }))
        );
      }
    }

    const results = await Promise.allSettled(validationPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && !result.value.valid) {
        console.warn(`Repository ${result.value.id} validation failed:`, result.value.error);
      }
    }
  }

  async validateRepository(repo) {
    // Handle local repositories
    if (repo.isLocal) {
      const validation = await this.localLoader.validateRepository(repo.localPath);

      if (validation.valid) {
        repo.structure = validation.structure;
        repo.validated = true;

        // Load and cache all documents, then index for search
        if (this.initialized) {
          await this.cacheRepositoryDocuments(repo);
        }
      } else {
        repo.validated = false;
      }

      return validation;
    }

    // Handle GitHub repositories
    const { owner, repo: repoName, branch, path: basePath } = repo.github;

    // Use auto-discovery instead of looking for table_of_contents
    const discovery = new AutoDiscovery(repo.token || process.env.GITHUB_TOKEN);

    const validation = await discovery.validateRepository(
      owner,
      repoName,
      branch,
      basePath
    );

    if (validation.valid) {
      repo.structure = validation.structure;
      repo.metadata = validation.metadata;
      repo.validated = true;

      // Load and cache all documents, then index for search
      if (this.initialized) {
        await this.cacheRepositoryDocuments(repo);
      }
    } else {
      repo.validated = false;
      repo.validationError = validation.error;
    }

    return validation;
  }

  /**
   * Load and cache all documents for a repository
   * This downloads everything once and stores in memory
   */
  async cacheRepositoryDocuments(repo) {
    console.log(`[RepositoryManager] Caching all documents for ${repo.id}...`);

    const categories = repo.structure.categories || [];
    const files = [];

    // Collect all file paths
    for (const category of categories) {
      if (category.items) {
        for (const item of category.items) {
          files.push(item.file);
        }
      }
    }

    // Load all documents in parallel
    const loadPromises = files.map(async (file) => {
      try {
        let content;

        if (repo.isLocal) {
          const fullPath = `${repo.localPath}/${file}`;
          content = await this.localLoader.loadFile(fullPath);
        } else {
          const { owner, repo: repoName, branch, path: basePath } = repo.github;
          const fullPath = basePath ? `${basePath}/${file}` : file;
          const loader = repo.token ? new GitHubLoader(repo.token) : this.githubLoader;
          content = await loader.loadFile(owner, repoName, branch, fullPath);
        }

        return { file, content };
      } catch (error) {
        console.error(`[RepositoryManager] Failed to load ${file}:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(loadPromises);
    const documents = {};

    for (const result of results) {
      if (result) {
        documents[result.file] = result.content;
      }
    }

    // Store in document cache
    this.documentCache.batchSet(repo.id, documents);

    // Index for search using cached documents
    const loadDocFn = async (file) => {
      return this.documentCache.get(repo.id, file);
    };

    await this.searchEngine.indexRepository(repo.id, repo.structure, loadDocFn);

    console.log(`[RepositoryManager] Cached ${Object.keys(documents).length} documents for ${repo.id}`);

    // Save only this repository to disk (faster than full save)
    await this.documentCache.saveRepository(repo.id);
  }

  getRepository(id) {
    return this.repositories.get(id) || this.findChildRepository(id);
  }

  findChildRepository(id) {
    for (const [_, parent] of this.repositories) {
      if (parent.children.has(id)) {
        return parent.children.get(id);
      }
      
      const child = this.findInChildren(parent.children, id);
      if (child) return child;
    }
    return null;
  }

  findInChildren(children, id) {
    for (const [_, child] of children) {
      if (child.id === id) return child;
      if (child.children.size > 0) {
        const found = this.findInChildren(child.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  getRepositoryHierarchy(id = null) {
    if (!id) {
      const hierarchy = [];
      for (const [repoId, repo] of this.repositories) {
        hierarchy.push(this.buildHierarchyNode(repo));
      }
      return hierarchy;
    }

    const repo = this.getRepository(id);
    if (!repo) return null;

    return this.buildHierarchyNode(repo);
  }

  buildHierarchyNode(repo) {
    const node = {
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.url,
      validated: repo.validated || false,
      enabled: repo.enabled
    };

    if (repo.children.size > 0) {
      node.children = [];
      for (const [_, child] of repo.children) {
        node.children.push(this.buildHierarchyNode(child));
      }
    }

    return node;
  }

  async loadDocument(repositoryId, documentPath) {
    const repo = this.getRepository(repositoryId);
    if (!repo) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    if (!repo.validated) {
      throw new Error(`Repository ${repositoryId} is not validated`);
    }

    // Try to get from cache first
    const cached = this.documentCache.get(repositoryId, documentPath);
    if (cached) {
      return cached;
    }

    // If not in cache (shouldn't happen after initialization), load and cache it
    console.warn(`[RepositoryManager] Document ${documentPath} not in cache for ${repositoryId}, loading...`);

    let content;
    if (repo.isLocal) {
      const fullPath = `${repo.localPath}/${documentPath}`;
      content = await this.localLoader.loadFile(fullPath);
    } else {
      const { owner, repo: repoName, branch, path: basePath } = repo.github;
      const fullPath = basePath ? `${basePath}/${documentPath}` : documentPath;
      const loader = repo.token ? new GitHubLoader(repo.token) : this.githubLoader;
      content = await loader.loadFile(owner, repoName, branch, fullPath);
    }

    // Cache it for next time
    this.documentCache.set(repositoryId, documentPath, content);
    return content;
  }

  async searchDocuments(query, repositoryId = null, limit = 50) {
    // Use the SearchEngine for fast cached search
    return this.searchEngine.search(query, repositoryId, limit);
  }

  /**
   * Refresh a repository - reload and re-cache all documents
   * Use this to update docs from GitHub or local changes
   */
  async refreshRepository(repositoryId) {
    const repo = this.getRepository(repositoryId);
    if (!repo) {
      throw new Error(`Repository ${repositoryId} not found`);
    }

    console.log(`[RepositoryManager] Refreshing repository: ${repositoryId}`);

    // Clear old cache and search index
    this.documentCache.clearRepository(repositoryId);
    this.searchEngine.removeRepository(repositoryId);

    // Re-validate (which will re-cache and re-index)
    const validation = await this.validateRepository(repo);

    if (validation.valid) {
      // Save only this repository to disk (faster than full save)
      await this.documentCache.saveRepository(repositoryId);

      console.log(`[RepositoryManager] Successfully refreshed ${repositoryId}`);
      return {
        success: true,
        repositoryId,
        documentCount: this.documentCache.getStats().repositories.find(r => r.id === repositoryId)?.documentCount || 0
      };
    } else {
      throw new Error(`Failed to refresh ${repositoryId}: ${validation.error}`);
    }
  }

  /**
   * Refresh all repositories
   */
  async refreshAll() {
    console.log('[RepositoryManager] Refreshing all repositories...');

    const repoIds = Array.from(this.repositories.keys());
    const results = [];

    for (const repoId of repoIds) {
      try {
        const result = await this.refreshRepository(repoId);
        results.push(result);
      } catch (error) {
        console.error(`[RepositoryManager] Failed to refresh ${repoId}:`, error.message);
        results.push({
          success: false,
          repositoryId: repoId,
          error: error.message
        });
      }
    }

    console.log(`[RepositoryManager] Refreshed ${results.filter(r => r.success).length}/${results.length} repositories`);
    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      documentCache: this.documentCache.getStats(),
      searchEngine: this.searchEngine.getStats()
    };
  }

  async saveConfiguration() {
    const config = {
      version: "1.0.0",
      repositories: this.exportRepositories()
    };

    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }

  exportRepositories() {
    const repos = [];
    
    for (const [id, repo] of this.repositories) {
      repos.push(this.exportRepository(repo));
      
      if (repo.children.size > 0) {
        repos.push(...this.exportChildren(repo.children, id));
      }
    }

    return repos;
  }

  exportChildren(children, parentId) {
    const repos = [];
    
    for (const [_, child] of children) {
      repos.push(this.exportRepository(child, parentId));
      
      if (child.children.size > 0) {
        repos.push(...this.exportChildren(child.children, child.id));
      }
    }

    return repos;
  }

  exportRepository(repo, parentId = null) {
    const exported = {
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.url,
      enabled: repo.enabled
    };

    if (parentId) {
      exported.parent = parentId;
    }

    // Encrypt token before saving
    if (repo.token) {
      exported.encryptedToken = this.tokenManager.encrypt(repo.token);
    }

    return exported;
  }
}