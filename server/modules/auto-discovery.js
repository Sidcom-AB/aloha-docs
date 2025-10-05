import { GitHubLoader } from './github-loader.js';

export class AutoDiscovery {
  constructor(githubToken = null) {
    this.loader = new GitHubLoader(githubToken);
    this.supportedExtensions = ['.md', '.schema.json'];
    this.ignoreFolders = ['node_modules', '.git', '.github', 'dist', 'build'];
  }

  async discoverDocs(owner, repo, branch, basePath = '') {
    try {
      // First, check for aloha.json
      const metadata = await this.loadMetadata(owner, repo, branch, basePath);
      
      // Scan directory structure
      const structure = await this.scanDirectory(owner, repo, branch, basePath);
      
      // Build documentation structure
      const docs = this.buildDocStructure(structure, metadata);
      
      return {
        valid: this.isValidAlohaRepo(docs),
        metadata,
        structure: docs
      };
    } catch (error) {
      throw new Error(`Discovery failed: ${error.message}`);
    }
  }

  async loadMetadata(owner, repo, branch, basePath) {
    try {
      const path = basePath ? `${basePath}/aloha.json` : 'aloha.json';
      const content = await this.loader.loadFile(owner, repo, branch, path);
      return JSON.parse(content);
    } catch (error) {
      // No aloha.json, use defaults
      return {
        title: repo.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Documentation for ${repo}`,
        categories: {}
      };
    }
  }

  async scanDirectory(owner, repo, branch, path = '', depth = 0) {
    if (depth > 3) return []; // Limit depth to prevent too deep scanning
    
    const items = [];
    
    try {
      const contents = await this.loader.loadDirectory(owner, repo, branch, path);
      
      for (const item of contents) {
        // Skip ignored folders
        if (this.ignoreFolders.includes(item.name)) continue;
        
        if (item.type === 'file') {
          // Check if supported file type
          if (this.supportedExtensions.some(ext => item.name.endsWith(ext))) {
            items.push({
              type: 'file',
              name: item.name,
              path: item.path,
              category: this.getCategoryFromPath(item.path),
              fileType: this.getFileType(item.name)
            });
          }
        } else if (item.type === 'dir') {
          // Recursively scan subdirectories
          const subItems = await this.scanDirectory(
            owner, repo, branch, item.path, depth + 1
          );
          items.push(...subItems);
        }
      }
    } catch (error) {
      console.error(`Failed to scan ${path}:`, error);
    }
    
    return items;
  }

  getCategoryFromPath(path) {
    const parts = path.split('/');
    
    // If file is in root of docs folder
    if (parts.length <= 2) {
      return 'general';
    }
    
    // Use first subfolder as category
    const category = parts[parts.length - 2];
    
    // Normalize category name
    return category.toLowerCase().replace(/_/g, '-');
  }

  getFileType(filename) {
    if (filename.endsWith('.schema.json')) return 'component';
    if (filename.endsWith('.md')) return 'document';
    return 'unknown';
  }

  buildDocStructure(items, metadata) {
    const structure = {
      title: metadata.title,
      description: metadata.description,
      categories: new Map()
    };

    // Group items by category
    for (const item of items) {
      if (!structure.categories.has(item.category)) {
        structure.categories.set(item.category, {
          title: this.formatCategoryTitle(item.category, metadata),
          items: []
        });
      }
      
      structure.categories.get(item.category).items.push({
        title: this.formatItemTitle(item.name),
        file: item.path,
        type: item.fileType
      });
    }

    // Convert to array and sort
    const categoriesArray = [];
    for (const [key, value] of structure.categories) {
      categoriesArray.push({
        id: key,
        title: value.title,
        items: this.sortItems(value.items),
        order: this.getCategoryOrder(key, metadata)
      });
    }

    // Sort categories by order
    categoriesArray.sort((a, b) => a.order - b.order);
    
    return {
      ...structure,
      categories: categoriesArray
    };
  }

  formatCategoryTitle(category, metadata) {
    // Check if custom title in metadata
    if (metadata.categories && metadata.categories[category]) {
      return metadata.categories[category].title;
    }
    
    // Default formatting
    return category
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  formatItemTitle(filename) {
    return filename
      .replace(/\.(md|schema\.json)$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  getCategoryOrder(category, metadata) {
    // Check if custom order in metadata
    if (metadata.categories && metadata.categories[category]) {
      return metadata.categories[category].order || 999;
    }
    
    // Default ordering
    const defaultOrder = {
      'getting-started': 1,
      'introduction': 1,
      'quickstart': 2,
      'installation': 2,
      'components': 10,
      'api': 20,
      'guides': 30,
      'reference': 40,
      'advanced': 50,
      'general': 100
    };
    
    return defaultOrder[category] || 99;
  }

  sortItems(items) {
    return items.sort((a, b) => {
      // Components (schemas) come after documents
      if (a.type !== b.type) {
        return a.type === 'document' ? -1 : 1;
      }
      
      // Alphabetical within same type
      return a.title.localeCompare(b.title);
    });
  }

  isValidAlohaRepo(docs) {
    // Valid if has at least one document or component
    return docs.categories.length > 0 && 
           docs.categories.some(cat => cat.items.length > 0);
  }

  async validateRepository(owner, repo, branch, basePath = '') {
    try {
      const result = await this.discoverDocs(owner, repo, branch, basePath);
      
      if (!result.valid) {
        return {
          valid: false,
          error: 'No documentation files found (.md or .schema.json)'
        };
      }

      const fileCount = result.structure.categories.reduce(
        (sum, cat) => sum + cat.items.length, 0
      );

      return {
        valid: true,
        metadata: result.metadata,
        structure: result.structure,
        stats: {
          categories: result.structure.categories.length,
          files: fileCount,
          hasMetadata: !!result.metadata.categories
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}