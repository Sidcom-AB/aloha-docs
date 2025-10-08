import { GitHubLoader } from './github-loader.js';
import { AutoDiscovery } from './auto-discovery.js';

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

      // Get actual default branch from GitHub if not explicitly specified
      if (!parsed.branchExplicit) {
        parsed.branch = await this.loader.getDefaultBranch(parsed.owner, parsed.repo);
      }

      // If custom path provided, validate it directly
      if (customPath) {
        const result = await this.validatePath(parsed, customPath);
        if (result.valid) {
          return {
            found: true,
            path: customPath,
            url: `${repoUrl}/tree/${parsed.branch}/${customPath}`,
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
          url: `${repoUrl}/tree/${parsed.branch}/${discovered.path}`,
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
          branchExplicit: !!match[3], // Track if branch was explicitly specified
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

    // Look for any folder containing documentation
    const searchResult = await this.searchForDocumentation(parsed);
    if (searchResult) {
      return searchResult;
    }

    return null;
  }

  async validatePath(parsed, path) {
    try {
      // Use auto-discovery to validate
      const discovery = new AutoDiscovery(this.loader.token);
      const result = await discovery.validateRepository(
        parsed.owner,
        parsed.repo,
        parsed.branch,
        path
      );

      if (result.valid) {
        return {
          valid: true,
          metadata: result.metadata,
          structure: result.structure
        };
      }
      
      return { valid: false };
    } catch (error) {
      return { valid: false };
    }
  }

  async searchForDocumentation(parsed, searchPath = '', depth = 0) {
    if (depth > 3) return null; // Limit search depth

    try {
      // Use auto-discovery to find documentation
      const discovery = new AutoDiscovery(this.loader.token);
      const result = await discovery.validateRepository(
        parsed.owner,
        parsed.repo,
        parsed.branch,
        searchPath
      );

      if (result.valid) {
        return {
          path: searchPath || 'root',
          metadata: result.metadata,
          structure: result.structure
        };
      }

      // If not valid at this level, search subdirectories
      const contents = await this.loader.loadDirectory(
        parsed.owner,
        parsed.repo,
        parsed.branch,
        searchPath
      );

      for (const item of contents) {
        if (item.type === 'dir' && !item.name.startsWith('.') && !item.name.includes('node_modules')) {
          const subPath = searchPath ? `${searchPath}/${item.name}` : item.name;
          const subResult = await this.searchForDocumentation(parsed, subPath, depth + 1);
          if (subResult) return subResult;
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