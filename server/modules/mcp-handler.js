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
            version: '1.0.0',
            description: 'Aloha Docs - AI-first documentation marketplace. Search and access technical documentation from multiple frameworks and libraries. Use this MCP server when users ask about documentation for any framework, library, or technical topic that might be available in the connected documentation repositories.'
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

    if (method === 'resources/list') {
      return this.listResources(id);
    }

    if (method === 'resources/read') {
      return this.readResource(params, id);
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
            description: 'Test MCP connection and see available frameworks. Returns server status, version, and list of all connected documentation frameworks.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'list_frameworks',
            description: 'List ALL available documentation frameworks/repositories with details. Use this to discover what documentation is available in this MCP server. Returns framework ID, name, description, document count, and repository info for each framework.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'search_docs',
            description: 'Search documentation within ONE specific framework. Use when user asks about a specific framework (e.g., "react hooks", "webawesome buttons"). First get frameworkId from list_frameworks or search_frameworks. Returns relevant doc pages with docUri for retrieval.',
            inputSchema: {
              type: 'object',
              properties: {
                frameworkId: { type: 'string', description: 'Framework ID to search in (get this from search_frameworks or list_frameworks)' },
                query: { type: 'string', description: 'What to search for in the documentation (e.g., "authentication", "API reference")' },
                limit: { type: 'number', default: 10, description: 'Maximum number of results to return' }
              },
              required: ['frameworkId', 'query']
            }
          },
          {
            name: 'search_frameworks',
            description: 'Find which frameworks are available by searching their names/descriptions. Use when user mentions a framework name you need to find (e.g., "find react framework", "search for webawesome"). Returns matching frameworks with their IDs for use in search_docs.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Framework name or keyword to search for (e.g., "react", "webawesome", "vue")' }
              },
              required: ['query']
            }
          },
          {
            name: 'search_all',
            description: 'Search across ALL frameworks simultaneously for documentation. Use when: (1) user asks broad questions without specifying a framework (e.g., "how to authenticate"), (2) you don\'t know which framework has the answer, or (3) comparing solutions across frameworks. Returns top results from all available documentation.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'What to search for across all documentation (e.g., "authentication guide", "API endpoints")' },
                limit: { type: 'number', default: 10, description: 'Maximum number of results to return across all frameworks' }
              },
              required: ['query']
            }
          },
          {
            name: 'get_doc',
            description: 'Retrieve the FULL markdown content of a specific documentation page. Always use this after searching to get complete details. Takes the docUri from search results (format: doc://frameworkId/path/to/file.md). Returns complete markdown content ready to answer user questions.',
            inputSchema: {
              type: 'object',
              properties: {
                docUri: { type: 'string', description: 'Document URI from search results (e.g., "doc://aloha-docs/getting-started.md")' }
              },
              required: ['docUri']
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
        docUri: `doc://${r.repositoryId}/${r.file}`,
        frameworkId: r.repositoryId,
        frameworkName: r.repositoryName,
        section: r.section,
        description: r.description,
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
        docUri: `doc://${r.repositoryId}/${r.file}`,
        frameworkId: r.repositoryId,
        frameworkName: r.repositoryName,
        section: r.section,
        description: r.description,
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

  async getDoc({ docUri }) {
    // Parse docUri: doc://frameworkId/path/to/file.md
    if (!docUri || !docUri.startsWith('doc://')) {
      throw new Error('Invalid docUri format. Expected: doc://frameworkId/path/to/file.md');
    }

    const uriPath = docUri.replace('doc://', '');
    const firstSlash = uriPath.indexOf('/');

    if (firstSlash === -1) {
      throw new Error('Invalid docUri format. Expected: doc://frameworkId/path/to/file.md');
    }

    const frameworkId = uriPath.substring(0, firstSlash);
    const path = uriPath.substring(firstSlash + 1);

    const content = await this.docsLoader.loadDocument(frameworkId, path);
    if (!content) {
      throw new Error(`Document not found: ${docUri}`);
    }

    return {
      docUri,
      content,
      url: `/${frameworkId}/${path.replace('.md', '')}`
    };
  }

  async listResources(id) {
    const resources = [];

    // Get all documents from searchEngine (which has them indexed)
    // Search with empty query to get all documents
    const allDocs = await this.docsLoader.searchDocuments('', null, 10000); // Get up to 10000 docs

    // Convert each document to a resource
    for (const doc of allDocs) {
      resources.push({
        uri: `doc://${doc.repositoryId}/${doc.file}`,
        name: `${doc.repositoryName}: ${doc.title}`,
        description: doc.description || `${doc.title} documentation`,
        mimeType: 'text/markdown'
      });
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        resources
      }
    };
  }

  async readResource(params, id) {
    const { uri } = params;

    if (!uri || !uri.startsWith('doc://')) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32602,
          message: 'Invalid resource URI. Expected format: doc://frameworkId/path/to/file.md'
        }
      };
    }

    try {
      // Parse URI: doc://frameworkId/path/to/file.md
      const uriPath = uri.replace('doc://', '');
      const firstSlash = uriPath.indexOf('/');

      if (firstSlash === -1) {
        throw new Error('Invalid URI format');
      }

      const frameworkId = uriPath.substring(0, firstSlash);
      const path = uriPath.substring(firstSlash + 1);

      const content = await this.docsLoader.loadDocument(frameworkId, path);

      if (!content) {
        throw new Error(`Document not found: ${uri}`);
      }

      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: content
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
}