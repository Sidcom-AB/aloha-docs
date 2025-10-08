import https from 'https';
import { promisify } from 'util';

export class GitHubLoader {
  constructor(token = null) {
    this.token = token;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    if (this.token) {
      console.log(`[GitHubLoader] Using authenticated requests (token: ${this.token.substring(0, 10)}...)`);
    } else {
      console.log(`[GitHubLoader] WARNING: No token provided - using unauthenticated requests (60 req/hour limit)`);
    }
  }

  async getDefaultBranch(owner, repo) {
    const cacheKey = `branch:${owner}/${repo}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const options = {
      headers: {
        'User-Agent': 'Aloha-Framework-Docs',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (this.token) {
      options.headers['Authorization'] = `token ${this.token}`;
    }

    return new Promise((resolve, reject) => {
      https.get(apiUrl, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const branch = parsed.default_branch || 'main';
            this.cache.set(cacheKey, {
              data: branch,
              timestamp: Date.now()
            });
            resolve(branch);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  parseGitHubUrl(url) {
    // Remove trailing slashes
    url = url.replace(/\/+$/, '');

    // Format: https://github.com/owner/repo/tree/branch/path
    const treeRegex = /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)(?:\/(.*))?/;
    const treeMatch = url.match(treeRegex);

    if (treeMatch) {
      return {
        owner: treeMatch[1],
        repo: treeMatch[2],
        branch: treeMatch[3],
        path: treeMatch[4] || ''
      };
    }

    // Format: https://github.com/owner/repo
    const simpleRegex = /github\.com\/([^\/]+)\/([^\/]+)$/;
    const simpleMatch = url.match(simpleRegex);

    if (simpleMatch) {
      return {
        owner: simpleMatch[1],
        repo: simpleMatch[2],
        branch: 'main', // Default branch, will be detected later
        path: ''
      };
    }

    throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo or https://github.com/owner/repo/tree/branch/path');
  }

  async fetchFromGitHub(owner, repo, branch, path) {
    const cacheKey = `${owner}/${repo}/${branch}/${path}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    
    const options = {
      headers: {
        'User-Agent': 'Aloha-Framework-Docs',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    if (this.token) {
      options.headers['Authorization'] = `token ${this.token}`;
    }

    return new Promise((resolve, reject) => {
      https.get(apiUrl, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
            return;
          }

          try {
            const parsed = JSON.parse(data);
            this.cache.set(cacheKey, {
              data: parsed,
              timestamp: Date.now()
            });
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  async loadFile(owner, repo, branch, filePath) {
    const response = await this.fetchFromGitHub(owner, repo, branch, filePath);
    
    if (response.type !== 'file') {
      throw new Error(`Path ${filePath} is not a file`);
    }

    const content = Buffer.from(response.content, 'base64').toString('utf-8');
    return content;
  }

  async loadDirectory(owner, repo, branch, dirPath = '') {
    const response = await this.fetchFromGitHub(owner, repo, branch, dirPath);
    
    if (!Array.isArray(response)) {
      throw new Error(`Path ${dirPath} is not a directory`);
    }

    return response.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size
    }));
  }

  async loadTableOfContents(owner, repo, branch, basePath = '') {
    const tocPath = basePath ? `${basePath}/table_of_contents.json` : 'table_of_contents.json';
    
    try {
      const content = await this.loadFile(owner, repo, branch, tocPath);
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load table_of_contents.json: ${error.message}`);
    }
  }

  async validateRepository(owner, repo, branch, basePath = '') {
    try {
      const toc = await this.loadTableOfContents(owner, repo, branch, basePath);
      
      if (!toc.title || !toc.sections || !Array.isArray(toc.sections)) {
        return {
          valid: false,
          error: 'Invalid table_of_contents.json structure'
        };
      }

      const requiredFiles = [];
      
      for (const section of toc.sections) {
        if (section.items) {
          for (const item of section.items) {
            if (item.file) {
              requiredFiles.push(item.file);
            }
          }
        }
      }

      const validationResults = await Promise.allSettled(
        requiredFiles.map(file => 
          this.loadFile(owner, repo, branch, basePath ? `${basePath}/${file}` : file)
        )
      );

      const failedFiles = requiredFiles.filter((file, index) => 
        validationResults[index].status === 'rejected'
      );

      if (failedFiles.length > 0) {
        return {
          valid: false,
          error: `Missing files: ${failedFiles.join(', ')}`
        };
      }

      return {
        valid: true,
        tableOfContents: toc
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}