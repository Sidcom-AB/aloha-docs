import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LocalLoader {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
  }

  async loadDirectory(localPath) {
    const fullPath = path.join(this.projectRoot, localPath);

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      return entries.map(entry => ({
        name: entry.name,
        path: path.join(localPath, entry.name),
        type: entry.isDirectory() ? 'dir' : 'file',
        size: 0
      }));
    } catch (error) {
      throw new Error(`Failed to load directory ${localPath}: ${error.message}`);
    }
  }

  async loadFile(localPath) {
    const fullPath = path.join(this.projectRoot, localPath);

    try {
      const [content, stats] = await Promise.all([
        fs.readFile(fullPath, 'utf-8'),
        fs.stat(fullPath)
      ]);

      return {
        content,
        mtime: stats.mtimeMs
      };
    } catch (error) {
      throw new Error(`Failed to load file ${localPath}: ${error.message}`);
    }
  }

  async validateRepository(basePath) {
    try {
      // Check if directory exists
      const fullPath = path.join(this.projectRoot, basePath);
      await fs.access(fullPath);

      // Look for aloha.json
      const metadata = await this.loadMetadata(basePath);

      // Look for markdown or schema files
      const files = await this.findDocumentationFiles(basePath);

      if (files.length === 0) {
        return {
          valid: false,
          error: 'No documentation files found (.md)'
        };
      }

      return {
        valid: true,
        files: files,
        metadata: metadata,
        structure: await this.buildStructure(basePath, metadata)
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async loadMetadata(basePath) {
    try {
      const alohaPath = path.join(this.projectRoot, basePath, 'aloha.json');
      const content = await fs.readFile(alohaPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // No aloha.json, return defaults
      const folderName = basePath.split('/').pop();
      return {
        title: this.formatTitle(folderName),
        description: `Documentation for ${folderName}`,
        categories: {}
      };
    }
  }

  async findDocumentationFiles(basePath, currentPath = '') {
    const searchPath = path.join(this.projectRoot, basePath, currentPath);
    const files = [];

    try {
      const entries = await fs.readdir(searchPath, { withFileTypes: true });

      for (const entry of entries) {
        const relativePath = path.join(currentPath, entry.name);

        // Skip hidden files and node_modules
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        if (entry.isDirectory()) {
          // Recursively search subdirectories
          const subFiles = await this.findDocumentationFiles(basePath, relativePath);
          files.push(...subFiles);
        } else if (entry.name.endsWith('.md')) {
          files.push(relativePath);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${searchPath}:`, error.message);
    }

    return files;
  }

  async buildStructure(basePath, metadata) {
    const structure = {
      title: metadata.title,
      description: metadata.description,
      categories: []
    };

    const fullPath = path.join(this.projectRoot, basePath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    const categoriesMap = new Map();

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const categoryFiles = await this.findDocumentationFiles(basePath, entry.name);

        if (categoryFiles.length > 0) {
          const categoryId = entry.name.toLowerCase().replace(/_/g, '-');
          const categoryTitle = metadata.categories && metadata.categories[categoryId]
            ? metadata.categories[categoryId].title || this.formatTitle(entry.name)
            : this.formatTitle(entry.name);

          const items = categoryFiles.map(file => {
            const fileName = file.split('/').pop();

            return {
              title: this.formatTitle(fileName.replace('.md', '')),
              file: file,
              type: 'document'
            };
          });

          categoriesMap.set(categoryId, {
            id: categoryId,
            title: categoryTitle,
            items: items,
            order: this.getCategoryOrder(categoryId, metadata)
          });
        }
      }
    }

    // Convert map to sorted array
    structure.categories = Array.from(categoriesMap.values())
      .sort((a, b) => a.order - b.order);

    return structure;
  }

  getCategoryOrder(categoryId, metadata) {
    if (metadata.categories && metadata.categories[categoryId] && metadata.categories[categoryId].order) {
      return metadata.categories[categoryId].order;
    }

    // Default ordering
    const defaultOrder = {
      'getting-started': 1,
      'guides': 2,
      'components': 3,
      'api': 4
    };

    return defaultOrder[categoryId] || 99;
  }

  formatTitle(folderName) {
    return folderName
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  parseLocalUrl(url) {
    // Expected format: local://docs or local://sample_docs
    const match = url.match(/^local:\/\/(.+)$/);
    if (!match) {
      throw new Error('Invalid local URL format. Expected: local://path');
    }

    return {
      path: match[1],
      isLocal: true
    };
  }
}
