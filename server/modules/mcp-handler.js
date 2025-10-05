export class MCPHandler {
  constructor(searchEngine, docsLoader) {
    this.searchEngine = searchEngine;
    this.docsLoader = docsLoader;
    
    this.tools = {
      search_docs: this.searchDocs.bind(this),
      get_component: this.getComponent.bind(this),
      get_schema: this.getSchema.bind(this),
      get_token: this.getToken.bind(this),
      get_doc: this.getDoc.bind(this)
    };
  }
  
  async handle(request) {
    const { method, params, id } = request;
    
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
            description: 'Search documentation with semantic search',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                limit: { type: 'number', default: 5 }
              },
              required: ['query']
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
          },
          {
            name: 'get_doc',
            description: 'Get specific documentation page',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Doc path (e.g., components/button)' }
              },
              required: ['path']
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
  
  async searchDocs({ query, limit = 5 }) {
    const results = await this.searchEngine.search(query, limit);
    return {
      query,
      results: results.map(r => ({
        snippet: r.snippet,
        source: r.source,
        score: r.score,
        title: r.title
      }))
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
  
  async getDoc({ path }) {
    const doc = await this.docsLoader.getDoc(path);
    if (!doc) {
      throw new Error(`Document ${path} not found`);
    }
    return doc;
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