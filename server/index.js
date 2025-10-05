import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './modules/config.js';
import { MCPHandler } from './modules/mcp-handler.js';
import { SearchEngine } from './modules/search-engine.js';
import { apiRouter } from './modules/api-router.js';
import { RepositoryManager } from './modules/repository-manager.js';
import { MCPRouter } from './modules/mcp-router.js';
import { DocValidator } from './modules/doc-validator.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const searchEngine = new SearchEngine();
const repositoryManager = new RepositoryManager();
const mcpRouter = new MCPRouter();
const docValidator = new DocValidator();
const mcpHandler = new MCPHandler(searchEngine, repositoryManager);

// Track WebSocket clients for reload notifications
const wsClients = new Set();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API routes
app.use('/api', apiRouter(searchEngine, repositoryManager, mcpRouter));

// Manual reload endpoint for repositories
app.post('/api/reload', async (req, res) => {
  try {
    await repositoryManager.validateAllRepositories();
    res.json({ 
      success: true, 
      message: 'Repositories reloaded',
      repositories: repositoryManager.getRepositoryHierarchy()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// WebSocket handling for MCP
wss.on('connection', (ws) => {
  console.log('MCP client connected');
  wsClients.add(ws);
  
  ws.on('message', async (message) => {
    try {
      const request = JSON.parse(message.toString());
      const response = await mcpHandler.handle(request);
      ws.send(JSON.stringify(response));
    } catch (error) {
      ws.send(JSON.stringify({
        error: {
          code: -32603,
          message: error.message
        }
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('MCP client disconnected');
    wsClients.delete(ws);
  });
});

async function init() {
  console.log('Starting Aloha Framework Marketplace...');
  console.log('Loading repository configuration...');
  
  // Initialize multi-repository system
  await repositoryManager.initialize();
  await mcpRouter.initialize();
  
  server.listen(config.port, () => {
    console.log(`\n🚀 Aloha Framework Marketplace`);
    console.log(`✨ Server running at http://localhost:${config.port}`);
    console.log(`📡 MCP WebSocket at ws://localhost:${config.port}`);
    
    const repos = repositoryManager.getRepositoryHierarchy();
    console.log(`\n📦 Active frameworks: ${repos.length}`);
    repos.forEach(repo => {
      console.log(`  - ${repo.name}: ${repo.validated ? '✅' : '⏳'} ${repo.url}`);
    });
    
    console.log(`\nAPI Endpoints:`);
    console.log(`  GET  /                  - Framework marketplace`);
    console.log(`  GET  /api/repositories  - List all frameworks`);
    console.log(`  POST /api/repos         - Add new framework`);
    console.log(`  POST /api/discover      - Auto-discover docs in repo`);
    console.log(`  GET  /api/mcp/*         - MCP routing`);
    console.log(`  POST /api/search        - Search across frameworks`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

init().catch(console.error);