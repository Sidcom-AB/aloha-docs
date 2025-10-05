import { GitHubLoader } from './github-loader.js';
import { TokenManager } from './token-manager.js';
import { promises as fs } from 'fs';
import path from 'path';

export class RepositoryManager {
  constructor(configPath = './config/repositories.json') {
    this.configPath = configPath;
    this.repositories = new Map();
    this.githubLoader = new GitHubLoader(process.env.GITHUB_TOKEN);
    this.tokenManager = new TokenManager();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      await this.loadConfiguration();
      await this.validateAllRepositories();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize RepositoryManager:', error);
      throw error;
    }
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

    const parsed = this.githubLoader.parseGitHubUrl(config.url);
    
    const repository = {
      id: config.id,
      name: config.name || config.id,
      description: config.description || '',
      url: config.url,
      github: parsed,
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
    const { owner, repo: repoName, branch, path: basePath } = repo.github;
    
    // Create a loader with the repo's specific token if it has one
    const loader = repo.token ? new GitHubLoader(repo.token) : this.githubLoader;
    
    const validation = await loader.validateRepository(
      owner, 
      repoName, 
      branch, 
      basePath
    );

    if (validation.valid) {
      repo.tableOfContents = validation.tableOfContents;
      repo.validated = true;
    } else {
      repo.validated = false;
      repo.validationError = validation.error;
    }

    return validation;
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

    const { owner, repo: repoName, branch, path: basePath } = repo.github;
    const fullPath = basePath ? `${basePath}/${documentPath}` : documentPath;
    
    // Use repo-specific token if available
    const loader = repo.token ? new GitHubLoader(repo.token) : this.githubLoader;
    return await loader.loadFile(owner, repoName, branch, fullPath);
  }

  async searchDocuments(query, repositoryId = null) {
    const repositories = repositoryId 
      ? [this.getRepository(repositoryId)]
      : Array.from(this.repositories.values());

    const results = [];
    
    for (const repo of repositories) {
      if (repo && repo.validated && repo.enabled) {
        const repoResults = await this.searchInRepository(repo, query);
        results.push(...repoResults);
        
        if (repo.children.size > 0) {
          const childResults = await this.searchInChildren(repo.children, query);
          results.push(...childResults);
        }
      }
    }

    return results;
  }

  async searchInChildren(children, query) {
    const results = [];
    
    for (const [_, child] of children) {
      if (child.validated && child.enabled) {
        const childResults = await this.searchInRepository(child, query);
        results.push(...childResults);
        
        if (child.children.size > 0) {
          const grandchildResults = await this.searchInChildren(child.children, query);
          results.push(...grandchildResults);
        }
      }
    }

    return results;
  }

  async searchInRepository(repo, query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    if (!repo.tableOfContents) return results;

    for (const section of repo.tableOfContents.sections) {
      if (section.items) {
        for (const item of section.items) {
          if (item.title.toLowerCase().includes(queryLower) ||
              (item.description && item.description.toLowerCase().includes(queryLower))) {
            results.push({
              repositoryId: repo.id,
              repositoryName: repo.name,
              section: section.title,
              title: item.title,
              description: item.description,
              file: item.file,
              score: this.calculateSearchScore(item, queryLower)
            });
          }
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  calculateSearchScore(item, query) {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    
    if (titleLower === query) score += 10;
    else if (titleLower.startsWith(query)) score += 5;
    else if (titleLower.includes(query)) score += 2;
    
    if (item.description) {
      const descLower = item.description.toLowerCase();
      if (descLower.includes(query)) score += 1;
    }
    
    return score;
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