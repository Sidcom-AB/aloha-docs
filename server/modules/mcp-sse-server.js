import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP SSE Server using official SDK
 * Handles SSE connections for remote MCP access
 */
export class MCPSSEServer {
  constructor(mcpHandler) {
    this.mcpHandler = mcpHandler;
    this.activeSessions = new Map();
  }

  /**
   * Get or create MCP server instance (singleton)
   */
  getMCPServer() {
    if (!this.mcpServer) {
      // Create MCP Server instance
      this.mcpServer = new Server(
        {
          name: 'aloha-docs',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
            resources: {},
          },
        }
      );

      // Debug: Check if schemas are loaded
      console.log('[MCP SSE] ListToolsRequestSchema:', ListToolsRequestSchema);
      console.log('[MCP SSE] Has shape?', !!ListToolsRequestSchema?.shape);

      // Register tool handlers using SDK schemas
      this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
        const response = await this.mcpHandler.listTools();
        return response.result; // SDK expects just the result, not full JSON-RPC wrapper
      });

      this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
        const response = await this.mcpHandler.callTool(request.params);
        return response.result; // SDK expects just the result
      });

      // Register resource handlers if available
      if (this.mcpHandler.listResources) {
        this.mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
          const response = await this.mcpHandler.listResources();
          return response.result;
        });

        this.mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
          const response = await this.mcpHandler.readResource(request.params);
          return response.result;
        });
      }
    }

    return this.mcpServer;
  }

  /**
   * Handle SSE connection (GET /sse)
   */
  async handleSSE(req, res) {
    console.log('[MCP SSE] Client connecting...');

    try {
      const mcpServer = this.getMCPServer();

      // Create SSE transport using official SDK
      // The SDK handles sending the endpoint event and all protocol details
      const transport = new SSEServerTransport('/mcp/message', res);

      // Store session BEFORE connecting
      const sessionId = transport.sessionId || `session-${Date.now()}`;
      this.activeSessions.set(sessionId, { mcpServer, transport });

      // Connect server to transport
      await mcpServer.connect(transport);

      console.log(`[MCP SSE] Client connected successfully (session: ${sessionId})`);

      // Handle disconnect
      req.on('close', () => {
        console.log(`[MCP SSE] Client disconnected (session: ${sessionId})`);
        this.activeSessions.delete(sessionId);
      });
    } catch (error) {
      console.error('[MCP SSE] Connection error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  }

  /**
   * Handle POST messages (POST /mcp/message)
   * Routes to the correct transport based on session ID
   */
  async handleMessage(req, res) {
    try {
      // Get sessionId from query parameter (sent by client)
      const sessionId = req.query.sessionId;

      if (!sessionId) {
        return res.status(400).json({ error: 'Missing sessionId query parameter' });
      }

      const session = this.activeSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // CRITICAL: Pass req.body as third parameter
      await session.transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error('[MCP SSE] Message handling error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  }

  getActiveSessionCount() {
    return this.activeSessions.size;
  }
}
