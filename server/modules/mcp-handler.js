export class MCPHandler {
  constructor(searchEngine, docsLoader) {
    this.searchEngine = searchEngine;
    this.docsLoader = docsLoader;

    this.tools = {
      search_docs: this.searchDocs.bind(this),
      search_frameworks: this.searchFrameworks.bind(this),
      search_detailed: this.searchDetailed.bind(this),
      get_doc: this.getDoc.bind(this),
      get_component: this.getComponent.bind(this),
      get_schema: this.getSchema.bind(this),
      get_token: this.getToken.bind(this)
    };
  }
  
  async handle(request, repositoryId = null) {
    const { method, params, id } = request;

    // Store scope for use in tool calls
    this.currentScope = repositoryId;

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
            name: 'search_docs',
            description: 'Hybrid search with automatic framework detection. Uses BM25 lexical + semantic ranking. Automatically detects framework intent and scopes search for precision, with global fallback.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query to find in documentation' },
                limit: { type: 'number', default: 10, description: 'Maximum number of results to return' }
              },
              required: ['query']
            }
          },
          {
            name: 'search_frameworks',
            description: 'Detect framework/repository candidates from a query. Returns framework probabilities and suggested scoping.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Query to analyze for framework detection' }
              },
              required: ['query']
            }
          },
          {
            name: 'search_detailed',
            description: 'Advanced search with full metadata including detection confidence, search strategy used, and ranking sources. Useful for debugging or understanding search behavior.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                limit: { type: 'number', default: 10, description: 'Maximum results' }
              },
              required: ['query']
            }
          },
          {
            name: 'get_doc',
            description: 'Get full content of a specific documentation page by path',
            inputSchema: {
              type: 'object',
              properties: {
                repositoryId: { type: 'string', description: 'Repository ID' },
                path: { type: 'string', description: 'Document path (e.g., getting-started.md)' }
              },
              required: ['repositoryId', 'path']
            }
          },
          {
            name: 'get_component',
            description: 'Get component details from custom elements manifest',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Component name (e.g., x-button)' }
              },
              required: ['name']
            }
          },
          {
            name: 'get_schema',
            description: 'Get JSON schema for a component',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Schema name' }
              },
              required: ['name']
            }
          },
          {
            name: 'get_token',
            description: 'Get design token details',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Token name' }
              },
              required: ['name']
            }
          }
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
  
  async searchDocs({ query, limit = 10 }) {
    // Use current scope if set, otherwise search all repos with auto-detection
    const repositoryId = this.currentScope || null;
    const results = await this.docsLoader.searchDocuments(query, repositoryId, limit);

    return {
      query,
      scope: repositoryId ? `repository: ${repositoryId}` : 'all repositories (auto-detect)',
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
    // Get framework detector from search engine
    const detector = this.searchEngine.pipeline.detector;
    const availableRepos = this.searchEngine.pipeline.getIndexedRepositories();

    const strategy = detector.getSearchStrategy(query, availableRepos);

    return {
      query,
      detected: strategy.primaryRepository !== null,
      recommendedStrategy: strategy.strategy,
      confidence: strategy.confidence,
      primaryFramework: strategy.primaryRepository,
      topic: strategy.topic,
      queryExpansions: strategy.queryExpansions,
      reasoning: strategy.reasoning
    };
  }

  async searchDetailed({ query, limit = 10 }) {
    // Get detailed search results with metadata
    const repositoryId = this.currentScope || null;
    const detailedResult = await this.searchEngine.searchDetailed(query, repositoryId, limit);

    return {
      query,
      strategy: detailedResult.strategy,
      primaryRepository: detailedResult.primaryRepository || null,
      results: detailedResult.results.map(r => ({
        title: r.title,
        repository: r.repositoryName,
        section: r.section,
        description: r.description,
        file: r.file,
        url: `/${r.repositoryId}/${r.file.replace('.md', '')}`,
        score: r.score,
        source: r.source
      })),
      metadata: detailedResult.metadata
    };
  }
  
  async getComponent({ name }) {
    const component = this.docsLoader.getComponent(name);
    
    if (!component) {
      throw new Error(`Component ${name} not found`);
    }
    
    return {
      tag: component.tagName,
      title: component.title,
      description: component.description,
      properties: component.properties || {},
      events: component.events || [],
      slots: component.slots || [],
      cssParts: component.cssParts || [],
      cssProperties: component.cssProperties || [],
      examples: component.examples || []
    };
  }
  
  async getSchema({ name }) {
    const schema = await this.docsLoader.getSchema(name);
    if (!schema) {
      throw new Error(`Schema ${name} not found`);
    }
    return schema;
  }
  
  async getToken({ name }) {
    const tokens = await this.docsLoader.getDesignTokens();
    const token = this.findToken(tokens, name);
    
    if (!token) {
      throw new Error(`Token ${name} not found`);
    }
    
    return token;
  }
  
  async getDoc({ repositoryId, path }) {
    const content = await this.docsLoader.loadDocument(repositoryId, path);
    if (!content) {
      throw new Error(`Document ${path} not found in ${repositoryId}`);
    }

    return {
      repositoryId,
      path,
      content,
      url: `/${repositoryId}/${path.replace('.md', '')}`
    };
  }
  
  findToken(tokens, name) {
    for (const [key, value] of Object.entries(tokens)) {
      if (key === name) {
        return { name: key, value };
      }
      if (typeof value === 'object' && value !== null) {
        const found = this.findToken(value, name);
        if (found) return found;
      }
    }
    return null;
  }
}