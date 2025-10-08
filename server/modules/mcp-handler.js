export class MCPHandler {
  constructor(searchEngine, docsLoader) {
    this.searchEngine = searchEngine;
    this.docsLoader = docsLoader;

    this.tools = {
      ping: this.ping.bind(this),
      list_frameworks: this.listFrameworks.bind(this),
      search_frameworks: this.searchFrameworks.bind(this),
      search_docs: this.searchDocs.bind(this),
      search_all: this.searchAll.bind(this),
      get_doc: this.getDoc.bind(this)
    };
  }
  
  async handle(request, repositoryId = null) {
    const { method, params, id } = request;

    // Store scope for use in tool calls
    this.currentScope = repositoryId;

    // Handle initialize request (required by MCP protocol)
    if (method === 'initialize') {
      // Accept client's protocol version if provided, otherwise use our default
      const protocolVersion = params?.protocolVersion || '2024-11-05';

      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: protocolVersion,
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
            logging: {}
          },
          serverInfo: {
            name: 'aloha-docs',
            version: '1.0.0'
          }
        }
      };
    }

    // Handle notifications/initialized (sent after initialize response)
    if (method === 'notifications/initialized') {
      // No response needed for notifications
      return null;
    }

    if (method === 'tools/list') {
      return this.listTools(id);
    }

    if (method === 'tools/call') {
      return this.callTool(params, id);
    }

    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: 'Method not found'
      }
    };
  }
  
  listTools(id) {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'ping',
            description: 'Simple test tool that returns server version and status. Use this to verify MCP connection is working.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'list_frameworks',
            description: 'List all available documentation frameworks/repositories. Returns name, description, document count, and repository info.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'search_docs',
            description: 'Search documentation within a specific framework. Use this when you know which framework to search in (get frameworkId from search_frameworks tool first). Returns relevant documentation pages with titles, descriptions, and URLs.',
            inputSchema: {
              type: 'object',
              properties: {
                frameworkId: { type: 'string', description: 'Framework ID to search in (get this from search_frameworks or list_frameworks)' },
                query: { type: 'string', description: 'Search query to find in documentation' },
                limit: { type: 'number', default: 10, description: 'Maximum number of results to return' }
              },
              required: ['frameworkId', 'query']
            }
          },
          {
            name: 'search_frameworks',
            description: 'Search for frameworks by name or description. Use this to find available frameworks when user searches for "react", "sample", etc.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search term to match against framework names and descriptions' }
              },
              required: ['query']
            }
          },
          {
            name: 'search_all',
            description: 'Search across ALL documentation frameworks at once. Use this when you don\'t know which framework contains the answer, or when searching for general topics across all available documentation. For targeted searches, use search_docs with a specific frameworkId instead.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query to find across all documentation' },
                limit: { type: 'number', default: 10, description: 'Maximum number of results to return' }
              },
              required: ['query']
            }
          },
          {
            name: 'get_doc',
            description: 'Get full content of a specific documentation page. Use the file path from search results to retrieve the complete markdown content.',
            inputSchema: {
              type: 'object',
              properties: {
                frameworkId: { type: 'string', description: 'Framework ID (get from search results)' },
                path: { type: 'string', description: 'Document path (e.g., getting-started.md) - get this from search results' }
              },
              required: ['frameworkId', 'path']
            }
          },
        ]
      }
    };
  }
  
  async callTool(params, id) {
    const { name, arguments: args } = params;
    
    if (!this.tools[name]) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32602,
          message: `Unknown tool: ${name}`
        }
      };
    }
    
    try {
      const result = await this.tools[name](args);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error.message
        }
      };
    }
  }
  
  async ping() {
    const repos = this.docsLoader.getRepositoryHierarchy();
    return {
      status: 'ok',
      version: '1.0.0',
      server: 'Aloha Docs MCP Server',
      timestamp: new Date().toISOString(),
      frameworks: repos.length,
      frameworks_list: repos.map(r => r.name)
    };
  }

  async listFrameworks() {
    const repos = this.docsLoader.getRepositoryHierarchy();
    return {
      total: repos.length,
      frameworks: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        description: repo.description || 'No description available',
        url: repo.url,
        documentCount: repo.documents?.length || 0,
        validated: repo.validated,
        type: repo.type
      }))
    };
  }

  async searchDocs({ frameworkId, query, limit = 10 }) {
    const results = await this.docsLoader.searchDocuments(query, frameworkId, limit);

    return {
      query,
      frameworkId,
      totalResults: results.length,
      results: results.map(r => ({
        title: r.title,
        repository: r.repositoryName,
        section: r.section,
        description: r.description,
        file: r.file,
        url: `/${r.repositoryId}/${r.file.replace('.md', '')}`,
        relevanceScore: r.score
      }))
    };
  }

  async searchAll({ query, limit = 10 }) {
    // Search across all frameworks
    const results = await this.docsLoader.searchDocuments(query, null, limit);

    return {
      query,
      scope: 'all frameworks',
      totalResults: results.length,
      results: results.map(r => ({
        title: r.title,
        repository: r.repositoryName,
        section: r.section,
        description: r.description,
        file: r.file,
        url: `/${r.repositoryId}/${r.file.replace('.md', '')}`,
        relevanceScore: r.score
      }))
    };
  }

  async searchFrameworks({ query }) {
    const repos = this.docsLoader.getRepositoryHierarchy();
    const searchTerm = query.toLowerCase();

    // Filter frameworks that match the search term in name or description
    const matches = repos.filter(repo => {
      const name = (repo.name || '').toLowerCase();
      const description = (repo.description || '').toLowerCase();
      return name.includes(searchTerm) || description.includes(searchTerm);
    });

    return {
      query,
      total: matches.length,
      frameworks: matches.map(repo => ({
        id: repo.id,
        name: repo.name,
        description: repo.description || 'No description available',
        url: repo.url,
        documentCount: repo.documents?.length || 0,
        validated: repo.validated,
        type: repo.type
      }))
    };
  }

  async getDoc({ frameworkId, path }) {
    const content = await this.docsLoader.loadDocument(frameworkId, path);
    if (!content) {
      throw new Error(`Document ${path} not found in framework ${frameworkId}`);
    }

    return {
      frameworkId,
      path,
      content,
      url: `/${frameworkId}/${path.replace('.md', '')}`
    };
  }
}