/**
 * Context-aware MCP tool and resource filtering
 * Provides different tools and resources based on whether we're in root or framework context
 */

export class MCPContext {
  /**
   * Get tools for a specific context
   * @param {string} context - 'root' for all frameworks, or frameworkId for specific framework
   * @returns {Array} Array of tool definitions
   */
  static getToolsForContext(context = 'root') {
    const isRoot = context === 'root';
    const tools = [];

    // ping - always available
    tools.push({
      name: 'ping',
      description: `Test MCP connection${isRoot ? ' and see available frameworks' : ''}. Returns server status${isRoot ? ', version, and list of all connected documentation frameworks' : ''}.`,
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    });

    // Root context only: list_frameworks, search_frameworks, search_all
    if (isRoot) {
      tools.push({
        name: 'list_frameworks',
        description: 'List ALL available documentation frameworks/repositories with details. Use this to discover what documentation is available in this MCP server. Returns framework ID, name, description, document count, and repository info for each framework.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      });

      tools.push({
        name: 'search_frameworks',
        description: 'Find which frameworks are available by searching their names/descriptions. Use when user mentions a framework name you need to find (e.g., "find react framework", "search for webawesome"). Returns matching frameworks with their IDs for use in search_docs.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Framework name or keyword to search for (e.g., "react", "webawesome", "vue")' }
          },
          required: ['query']
        }
      });

      tools.push({
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
      });

      tools.push({
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
      });
    } else {
      // Framework context: simplified search_docs (no frameworkId needed)
      tools.push({
        name: 'search_docs',
        description: `Search documentation for this framework. Returns relevant doc pages with docUri for retrieval.`,
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'What to search for in the documentation (e.g., "authentication", "API reference")' },
            limit: { type: 'number', default: 10, description: 'Maximum number of results to return' }
          },
          required: ['query']
        }
      });
    }

    // get_doc - always available
    tools.push({
      name: 'get_doc',
      description: 'Retrieve the FULL markdown content of a specific documentation page. Always use this after searching to get complete details. Takes the docUri from search results (format: doc://frameworkId/path/to/file.md). Returns complete markdown content ready to answer user questions.',
      inputSchema: {
        type: 'object',
        properties: {
          docUri: { type: 'string', description: 'Document URI from search results (e.g., "doc://aloha-docs/getting-started.md")' }
        },
        required: ['docUri']
      }
    });

    return tools;
  }

  /**
   * Get resource filter for a specific context
   * @param {string} context - 'root' for 'aloha-docs' only, or frameworkId for that framework
   * @returns {string|null} Framework ID to filter by, or null for all
   */
  static getResourceFilter(context = 'root') {
    return context === 'root' ? 'aloha-docs' : context;
  }

  /**
   * Adapt tool calls for framework context
   * Automatically inject frameworkId for search_docs calls
   */
  static adaptToolCall(toolName, params, context) {
    if (context !== 'root' && toolName === 'search_docs') {
      // Inject frameworkId for framework context
      return {
        ...params,
        frameworkId: context
      };
    }
    return params;
  }
}
