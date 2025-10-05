import { GitHubLoader } from './github-loader.js';

export class GitHubDiscovery {
  constructor(githubToken = null) {
    this.loader = new GitHubLoader(githubToken);
    this.commonDocPaths = [
      'docs',
      'documentation',
      'doc',
      'website/docs',
      'packages/docs',
      'src/docs',
      'content',
      'pages'
    ];
  }

  async discoverRepository(repoUrl, customPath = null) {
    try {
      const parsed = this.parseRepoUrl(repoUrl);
      
      // If custom path provided, validate it directly
      if (customPath) {
        const result = await this.validatePath(parsed, customPath);
        if (result.valid) {
          return {
            found: true,
            path: customPath,
            url: `${repoUrl}/tree/${parsed.branch || 'main'}/${customPath}`,
            metadata: result.metadata,
            tableOfContents: result.tableOfContents
          };
        }
      }

      // Auto-discover documentation
      const discovered = await this.autoDiscover(parsed);
      if (discovered) {
        return {
          found: true,
          path: discovered.path,
          url: `${repoUrl}/tree/${parsed.branch || 'main'}/${discovered.path}`,
          metadata: discovered.metadata,
          tableOfContents: discovered.tableOfContents
        };
      }

      return {
        found: false,
        error: 'No documentation found. Please specify the path manually.'
      };
    } catch (error) {
      return {
        found: false,
        error: error.message
      };
    }
  }

  parseRepoUrl(url) {
    // Handle different GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?(?:\/(.*))?/,
      /github\.com\/([^\/]+)\/([^\/]+)\.git/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace('.git', ''),
          branch: match[3] || 'main',
          path: match[4] || ''
        };
      }
    }

    throw new Error('Invalid GitHub URL format');
  }

  async autoDiscover(parsed) {
    // First, try to find README in root to extract metadata
    const metadata = await this.extractMetadata(parsed);

    // Try common documentation paths
    for (const docPath of this.commonDocPaths) {
      const result = await this.validatePath(parsed, docPath);
      if (result.valid) {
        return {
          path: docPath,
          metadata: { ...metadata, ...result.metadata },
          tableOfContents: result.tableOfContents
        };
      }
    }

    // Look for any folder containing table_of_contents.json
    const searchResult = await this.searchForTableOfContents(parsed);
    if (searchResult) {
      return searchResult;
    }

    return null;
  }

  async validatePath(parsed, path) {
    try {
      // Check for table_of_contents.json
      const tocPath = path ? `${path}/table_of_contents.json` : 'table_of_contents.json';
      const toc = await this.loader.loadFile(
        parsed.owner, 
        parsed.repo, 
        parsed.branch, 
        tocPath
      );

      const tableOfContents = JSON.parse(toc);
      
      // Extract metadata from TOC
      const metadata = {
        title: tableOfContents.title,
        description: tableOfContents.description,
        version: tableOfContents.version
      };

      return {
        valid: true,
        metadata,
        tableOfContents
      };
    } catch (error) {
      return { valid: false };
    }
  }

  async searchForTableOfContents(parsed, searchPath = '', depth = 0) {
    if (depth > 3) return null; // Limit search depth

    try {
      const contents = await this.loader.loadDirectory(
        parsed.owner,
        parsed.repo,
        parsed.branch,
        searchPath
      );

      // Check current directory for table_of_contents.json
      const hasToc = contents.some(item => item.name === 'table_of_contents.json');
      if (hasToc) {
        const result = await this.validatePath(parsed, searchPath);
        if (result.valid) {
          return {
            path: searchPath || 'root',
            metadata: result.metadata,
            tableOfContents: result.tableOfContents
          };
        }
      }

      // Search subdirectories
      for (const item of contents) {
        if (item.type === 'dir' && !item.name.startsWith('.') && !item.name.includes('node_modules')) {
          const subPath = searchPath ? `${searchPath}/${item.name}` : item.name;
          const result = await this.searchForTableOfContents(parsed, subPath, depth + 1);
          if (result) return result;
        }
      }
    } catch (error) {
      // Directory doesn't exist or isn't accessible
    }

    return null;
  }

  async extractMetadata(parsed) {
    const metadata = {};

    try {
      // Try to get README
      const readmePaths = ['README.md', 'readme.md', 'Readme.md'];
      
      for (const readmePath of readmePaths) {
        try {
          const readme = await this.loader.loadFile(
            parsed.owner,
            parsed.repo,
            parsed.branch,
            readmePath
          );

          // Extract title from first H1
          const titleMatch = readme.match(/^#\s+(.+)$/m);
          if (titleMatch) {
            metadata.title = titleMatch[1].trim();
          }

          // Extract description from first paragraph
          const lines = readme.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('#') && !line.startsWith('!') && !line.startsWith('[')) {
              metadata.description = line;
              break;
            }
          }

          break;
        } catch (e) {
          // Try next README variant
        }
      }

      // Try package.json for Node projects
      try {
        const packageJson = await this.loader.loadFile(
          parsed.owner,
          parsed.repo,
          parsed.branch,
          'package.json'
        );
        const pkg = JSON.parse(packageJson);
        
        if (!metadata.title && pkg.name) {
          metadata.title = pkg.name;
        }
        if (!metadata.description && pkg.description) {
          metadata.description = pkg.description;
        }
        if (pkg.version) {
          metadata.version = pkg.version;
        }
      } catch (e) {
        // Not a Node project or no package.json
      }

    } catch (error) {
      // Metadata extraction failed, but not critical
    }

    // Fallback to repo name
    if (!metadata.title) {
      metadata.title = parsed.repo.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return metadata;
  }

  async extractArtwork(parsed) {
    // Look for common logo/artwork locations
    const artworkPaths = [
      'logo.png',
      'logo.svg',
      'icon.png',
      'icon.svg',
      'assets/logo.png',
      'assets/logo.svg',
      'public/logo.png',
      'public/logo.svg',
      'docs/assets/logo.png',
      'docs/assets/logo.svg',
      '.github/logo.png',
      '.github/logo.svg'
    ];

    for (const path of artworkPaths) {
      try {
        await this.loader.loadFile(
          parsed.owner,
          parsed.repo,
          parsed.branch,
          path
        );
        
        // Return GitHub raw content URL
        return `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${parsed.branch}/${path}`;
      } catch (e) {
        // Try next path
      }
    }

    return null;
  }
}