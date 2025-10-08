// SSE Transport for MCP Protocol
// Enables remote MCP access without local server installation

export class MCPSSETransport {
  constructor(mcpHandler) {
    this.mcpHandler = mcpHandler;
    this.clients = new Map();
  }

  async handleConnection(req, res, repositoryId = null) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });

    const clientId = Date.now() + Math.random();
    const scope = repositoryId ? `repository: ${repositoryId}` : 'all repositories';
    console.log(`MCP SSE client connected: ${clientId} (${scope})`);

    // Store client with scope
    this.clients.set(clientId, { res, repositoryId });

    // Send initial connection message
    const message = repositoryId
      ? `Connected to ${repositoryId} MCP Server`
      : 'Connected to Aloha Docs MCP Server';

    this.sendEvent(res, 'connected', {
      message,
      clientId,
      scope: repositoryId
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log(`MCP SSE client disconnected: ${clientId}`);
      this.clients.delete(clientId);
    });

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      if (res.destroyed) {
        clearInterval(heartbeat);
        this.clients.delete(clientId);
        return;
      }
      this.sendEvent(res, 'heartbeat', { timestamp: Date.now() });
    }, 30000); // Every 30 seconds

    // Cleanup on error
    res.on('error', (error) => {
      console.error(`SSE client error: ${error.message}`);
      clearInterval(heartbeat);
      this.clients.delete(clientId);
    });
  }

  async handleMessage(req, res, repositoryId = null) {
    try {
      const message = req.body;

      if (!message || typeof message !== 'object') {
        return res.status(400).json({
          error: {
            code: -32600,
            message: 'Invalid Request'
          }
        });
      }

      // Process MCP request with scope
      const response = await this.mcpHandler.handle(message, repositoryId);

      // Send response
      res.json(response);
    } catch (error) {
      console.error('MCP message error:', error);
      res.status(500).json({
        error: {
          code: -32603,
          message: error.message
        }
      });
    }
  }

  sendEvent(res, event, data) {
    if (res.destroyed) return;

    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending SSE event:', error);
    }
  }

  broadcast(event, data) {
    for (const [clientId, res] of this.clients) {
      this.sendEvent(res, event, data);
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}
