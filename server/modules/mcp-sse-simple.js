import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { MCPContext } from './mcp-context.js';

/**
 * MCP SSE Server using official SDK SSEServerTransport
 * This uses the MCP SDK's built-in SSE transport instead of rolling our own
 */
export class MCPSSESimple {
  constructor(mcpHandler) {
    this.mcpHandler = mcpHandler;
    this.transports = new Map();
  }

  /**
   * Convert JSON Schema to Zod schema
   */
  jsonSchemaToZod(jsonSchema) {
    if (!jsonSchema || !jsonSchema.properties) {
      return {}; // Empty schema for tools with no parameters
    }

    const zodShape = {};
    const required = jsonSchema.required || [];

    for (const [key, prop] of Object.entries(jsonSchema.properties)) {
      let zodType;

      // Convert JSON Schema type to Zod type
      switch (prop.type) {
        case 'string':
          zodType = z.string();
          break;
        case 'number':
          zodType = z.number();
          break;
        case 'boolean':
          zodType = z.boolean();
          break;
        case 'array':
          zodType = z.array(z.any());
          break;
        case 'object':
          zodType = z.object({});
          break;
        default:
          zodType = z.any();
      }

      // Add description if available
      if (prop.description) {
        zodType = zodType.describe(prop.description);
      }

      // Add default if available
      if (prop.default !== undefined) {
        zodType = zodType.default(prop.default);
      }

      // Make optional if not required
      if (!required.includes(key)) {
        zodType = zodType.optional();
      }

      zodShape[key] = zodType;
    }

    return zodShape;
  }

  /**
   * Create new MCP Server instance with tools from mcpHandler
   * @param {string} context - 'root' for all frameworks, or frameworkId for specific framework
   */
  async createServer(context = 'root') {
    const server = new McpServer(
      {
        name: 'aloha-docs',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {}
        },
      }
    );

    // Get context-aware tools
    const tools = MCPContext.getToolsForContext(context);
    console.log(`[MCP SSE SDK] Registering ${tools.length} tools for context: ${context}`);

    // Register each tool with the SDK
    for (const tool of tools) {
      // Convert JSON Schema to Zod schema
      const zodSchema = this.jsonSchemaToZod(tool.inputSchema);

      server.tool(
        tool.name,
        tool.description,
        zodSchema,
        async (params) => {
          // Adapt tool call for context (inject frameworkId if needed)
          const adaptedParams = MCPContext.adaptToolCall(tool.name, params, context);

          // Call our handler's tool implementation
          const response = await this.mcpHandler.callTool({ name: tool.name, arguments: adaptedParams });

          // SDK expects { content: [{ type: 'text', text: '...' }] } format
          // Our handler returns the JSON-RPC response with result.content already formatted
          if (response.result && response.result.content) {
            return response.result; // Already has correct format
          }

          // Fallback: wrap raw result
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(response.result || response, null, 2)
            }]
          };
        }
      );
    }

    // Get documents directly from repository manager based on context
    const resourceFilter = MCPContext.getResourceFilter(context);
    const allDocs = this.mcpHandler.docsLoader.getAllDocuments(resourceFilter);

    console.log(`[MCP SSE SDK] Registering ${allDocs.length} resources for context: ${context}...`);

    // Convert documents to resources
    const resources = allDocs.map(doc => ({
      uri: `doc://${doc.repositoryId}/${doc.file}`,
      name: doc.title,
      description: doc.description || `${doc.title} documentation`,
      mimeType: 'text/markdown'
    }));

    for (const resource of resources) {
      server.resource(
        resource.name,
        resource.uri,
        {
          description: resource.description,
          mimeType: resource.mimeType
        },
        async (uriObj) => {
          // SDK passes URI as an object with 'uri' property
          const uri = typeof uriObj === 'string' ? uriObj : (uriObj?.uri || resource.uri);

          console.log('[Resource callback] uriObj:', JSON.stringify(uriObj), 'uri:', uri);

          if (!uri) {
            throw new Error('URI is required but was undefined');
          }

          // Parse URI: doc://frameworkId/path/to/file.md
          const uriPath = uri.replace('doc://', '');
          const firstSlash = uriPath.indexOf('/');
          const frameworkId = uriPath.substring(0, firstSlash);
          const path = uriPath.substring(firstSlash + 1);

          const content = await this.mcpHandler.docsLoader.loadDocument(frameworkId, path);
          if (!content) {
            throw new Error(`Document not found: ${uri}`);
          }

          // SDK expects { contents: [{ uri, text }] }
          return {
            contents: [{
              uri,
              text: content
            }]
          };
        }
      );
    }

    console.log(`[MCP SSE SDK] Successfully registered ${resources.length} resources`);

    return server;
  }

  /**
   * Handle SSE connection (GET /sse or GET /:frameworkId/sse)
   */
  async handleSSE(req, res) {
    console.log('[MCP SSE SDK] Client connecting...');

    try {
      // Extract context from URL path
      // Path can be /sse (root) or /:frameworkId/sse (framework)
      const pathParts = req.path.split('/').filter(p => p);
      const context = pathParts.length === 1 ? 'root' : pathParts[0];

      console.log(`[MCP SSE SDK] Context: ${context}`);

      // Create SSE transport with /mcp/message as the POST endpoint
      const transport = new SSEServerTransport('/mcp/message', res);
      const sessionId = transport.sessionId;

      // Store transport
      this.transports.set(sessionId, transport);

      // Set up cleanup on close
      transport.onclose = () => {
        console.log(`[MCP SSE SDK] Session ${sessionId} closed`);
        this.transports.delete(sessionId);
      };

      // Create new server instance with context and connect transport
      const server = await this.createServer(context);
      await server.connect(transport);

      console.log(`[MCP SSE SDK] Session ${sessionId} connected successfully!`);
    } catch (error) {
      console.error('[MCP SSE SDK] Connection error:', error);
      if (!res.headersSent) {
        res.status(500).send('Error establishing SSE stream');
      }
    }
  }

  /**
   * Handle POST messages (POST /mcp/message)
   */
  async handleMessage(req, res) {
    const sessionId = req.query.sessionId;

    if (!sessionId) {
      console.error('[MCP SSE SDK] No session ID in POST request');
      res.status(400).send('Missing sessionId parameter');
      return;
    }

    const transport = this.transports.get(sessionId);
    if (!transport) {
      console.error(`[MCP SSE SDK] No transport for session ${sessionId}`);
      res.status(404).send('Session not found');
      return;
    }

    try {
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error('[MCP SSE SDK] Error handling POST message:', error);
      if (!res.headersSent) {
        res.status(500).send('Error handling request');
      }
    }
  }

  /**
   * Close all transports
   */
  async closeAll() {
    for (const [sessionId, transport] of this.transports) {
      try {
        console.log(`[MCP SSE SDK] Closing session ${sessionId}`);
        await transport.close();
      } catch (error) {
        console.error(`[MCP SSE SDK] Error closing session ${sessionId}:`, error);
      }
    }
    this.transports.clear();
  }
}
