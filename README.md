# 🍍 Aloha Docs

**AI-first documentation marketplace with MCP (Model Context Protocol) integration**

A modern documentation platform that automatically discovers and indexes framework documentation from GitHub, with built-in MCP server for seamless Claude AI integration.

## ✨ Key Features

### 📚 Documentation Platform
- **Auto-Discovery** - Automatically scans GitHub repos and indexes `.md` files
- **Smart Categorization** - Folder structure becomes navigation
- **Beautiful UI** - Modern marketplace with pill-style navigation
- **Multi-Framework** - Host unlimited framework documentations
- **Private Repo Support** - Per-repository GitHub token support

### 🤖 MCP Integration (Model Context Protocol)
- **Context-Aware MCP** - Different tool sets per framework
- **SSE Transport** - Remote MCP access via Server-Sent Events
- **WebSocket Support** - Local MCP for Claude Desktop
- **Smart Search** - BM25 + semantic search with caching
- **Resource Streaming** - All docs available as MCP resources

### ⚡ Performance
- **Document Caching** - Persistent disk cache (2h TTL)
- **Search Index** - Pre-built indices with BM25 + embeddings
- **Lazy Loading** - Only loads what's needed
- **GitHub Rate Limiting** - Smart token rotation

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set GitHub token (optional, for higher rate limits)
export GITHUB_TOKEN=ghp_your_token_here

# Start server
npm start
```

Visit http://localhost:3000 to see the marketplace!

## 🤖 MCP Integration

### Claude Desktop (Local WebSocket)

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "aloha-docs": {
      "command": "node",
      "args": ["/path/to/aloha-docs/server/index.js"],
      "cwd": "/path/to/aloha-docs"
    }
  }
}
```

### Remote Access (SSE)

For remote Claude Code or other MCP clients:

**Root Context** - Access all frameworks:
```
http://localhost:3000/sse
```

**Framework Context** - Scoped to specific framework:
```
http://localhost:3000/andymcloid-webawesome-docs/sse
```

### Context-Aware MCP

The MCP server adapts based on the URL:

| Context | URL | Tools | Resources |
|---------|-----|-------|-----------|
| **Root** | `/sse` | All 6 tools | Only "Aloha Docs" framework |
| **Framework** | `/:frameworkId/sse` | 3 scoped tools | All docs from that framework |

**Root Tools:**
- `ping` - Test connection
- `list_frameworks` - List all available frameworks
- `search_frameworks` - Find frameworks by name
- `search_docs` - Search in specific framework (requires frameworkId)
- `search_all` - Search across all frameworks
- `get_doc` - Get full document content

**Framework Tools (Scoped):**
- `ping` - Test connection
- `search_docs` - Search this framework (frameworkId auto-injected)
- `get_doc` - Get full document content

## 📁 Project Structure

```
aloha-docs/
├── server/
│   ├── index.js                    # Main Express server
│   └── modules/
│       ├── mcp-handler.js          # MCP protocol handler
│       ├── mcp-sse-simple.js       # SSE transport with SDK
│       ├── mcp-context.js          # Context-aware filtering
│       ├── repository-manager.js   # Framework management
│       ├── search-engine.js        # BM25 + semantic search
│       ├── document-cache.js       # Persistent caching
│       ├── auto-discovery.js       # GitHub doc scanner
│       ├── github-loader.js        # GitHub API client
│       └── local-loader.js         # Local file loader
├── public/
│   ├── index.html                  # Marketplace UI
│   ├── framework.html              # Doc viewer
│   └── css/navbar-pill.css         # Beautiful navigation
├── config/
│   └── repositories.json           # Framework registry
└── .cache/
    └── documents/                  # Persistent doc cache
```

## 🔧 Core Modules

### Repository Manager
- Manages multiple documentation frameworks
- Handles GitHub and local repositories
- Validates and discovers documentation structure
- Caches documents for fast access

### Search Engine
- **BM25 Index** - Fast keyword search
- **Semantic Index** - Embedding-based search
- **Search Pipeline** - Automatic query routing (global vs scoped)
- **Result Fusion** - Combines BM25 + semantic results

### MCP Server
- **WebSocket** - For Claude Desktop (`ws://localhost:3000`)
- **SSE** - For remote clients (`/sse` endpoints)
- **Context-Aware** - Different tools per framework
- **Resource Streaming** - Exposes all docs as MCP resources

### Document Cache
- **Persistent Storage** - Survives server restarts
- **2-Hour TTL** - Auto-refresh stale docs
- **Per-Repository** - Granular cache management
- **Fast Startup** - No GitHub API calls needed

## 📚 Adding Documentation

### Via UI (Marketplace)

1. Click **"+ Add Framework"**
2. Enter GitHub repo URL (e.g., `https://github.com/user/repo/tree/main/docs`)
3. (Optional) Add GitHub token for private repos
4. Click **Auto-Discover**
5. Submit!

### Repository Structure

```
your-repo/
├── docs/                          # Documentation root
│   ├── getting-started/           → "Getting Started" category
│   │   ├── introduction.md
│   │   └── installation.md
│   ├── components/                → "Components" category
│   │   ├── button.md
│   │   └── card.md
│   └── aloha.json                # Optional metadata
```

### Optional: `aloha.json`

Customize framework metadata:

```json
{
  "title": "My Framework",
  "description": "The best framework ever",
  "logo": "assets/logo.png",
  "categories": {
    "getting-started": {
      "title": "🚀 Quick Start",
      "order": 1
    },
    "components": {
      "title": "🧩 Components",
      "order": 2
    }
  }
}
```

## 🔌 API Endpoints

### Documentation API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Marketplace homepage |
| `/:frameworkId` | GET | Framework viewer |
| `/api/repositories` | GET | List all frameworks |
| `/api/repos` | POST | Add new framework |
| `/api/discover` | POST | Auto-discover repository |
| `/api/search` | POST | Search documentation |

### MCP Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sse` | GET | Root MCP context (all frameworks) |
| `/:frameworkId/sse` | GET | Framework MCP context (scoped) |
| `/mcp/message` | POST | MCP message handler |

### WebSocket
```
ws://localhost:3000
```

## 🎯 MCP Tools Reference

### Root Context Tools

**`ping`**
```json
{
  "name": "ping",
  "description": "Test MCP connection and see available frameworks"
}
```

**`list_frameworks`**
```json
{
  "name": "list_frameworks",
  "description": "List all available frameworks with details"
}
```

**`search_frameworks`**
```json
{
  "name": "search_frameworks",
  "description": "Find frameworks by name or description",
  "inputSchema": {
    "query": "string"
  }
}
```

**`search_docs`**
```json
{
  "name": "search_docs",
  "description": "Search documentation within ONE specific framework",
  "inputSchema": {
    "frameworkId": "string",
    "query": "string",
    "limit": "number (default: 10)"
  }
}
```

**`search_all`**
```json
{
  "name": "search_all",
  "description": "Search across ALL frameworks simultaneously",
  "inputSchema": {
    "query": "string",
    "limit": "number (default: 10)"
  }
}
```

**`get_doc`**
```json
{
  "name": "get_doc",
  "description": "Retrieve full markdown content of a document",
  "inputSchema": {
    "docUri": "string (e.g., 'doc://framework-id/path/to/doc.md')"
  }
}
```

### Framework Context Tools

**`search_docs`** (Simplified - no frameworkId needed)
```json
{
  "name": "search_docs",
  "description": "Search documentation for this framework",
  "inputSchema": {
    "query": "string",
    "limit": "number (default: 10)"
  }
}
```

## 🛠️ Configuration

### Environment Variables

```bash
# GitHub token (optional, for higher API rate limits)
GITHUB_TOKEN=ghp_your_token_here

# Server port (default: 3000)
PORT=3000
```

### Repository Config

Stored in `config/repositories.json`:

```json
{
  "repositories": [
    {
      "id": "my-framework",
      "name": "My Framework",
      "description": "Framework description",
      "url": "https://github.com/user/repo/tree/main/docs",
      "github": {
        "owner": "user",
        "repo": "repo",
        "branch": "main",
        "path": "docs"
      },
      "enabled": true,
      "validated": true
    }
  ]
}
```

## 🧪 Development

### Run in watch mode
```bash
npm run dev
```

### Cache Management
```bash
# Clear all caches
rm -rf .cache/documents/*

# Clear specific framework cache
rm .cache/documents/framework-id.json
```

### Debug MCP
```bash
# Test SSE endpoint
curl -N http://localhost:3000/sse

# List resources via MCP
curl -X POST http://localhost:3000/mcp/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"resources/list","params":{}}'
```

## 📊 Architecture

### Search Pipeline

```
User Query
    ↓
[Query Analysis]
    ↓
Global or Scoped? ──→ Global: Search all frameworks
    ↓                 Scoped: Search specific framework
[BM25 Search] ← Fast keyword matching
    +
[Semantic Search] ← Embedding similarity
    ↓
[Result Fusion] ← Combine & rank
    ↓
Top N Results
```

### Document Caching

```
Server Start
    ↓
Load cache from disk ──→ Cache hit: Use cached docs
    ↓                    Cache miss: Fetch from GitHub
Validate repos
    ↓
Build search index ──→ Index from cached docs
    ↓
Ready to serve
```

### MCP Context Flow

```
Client connects to /sse or /:frameworkId/sse
    ↓
Extract context from URL path
    ↓
Filter tools based on context
    ↓
Filter resources based on context
    ↓
Create MCP server instance
    ↓
Register context-aware tools & resources
    ↓
Stream to client via SSE
```

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t aloha-docs .
docker run -p 3000:3000 -e GITHUB_TOKEN=$GITHUB_TOKEN aloha-docs
```

### Systemd Service

```ini
[Unit]
Description=Aloha Docs MCP Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/aloha-docs
Environment="GITHUB_TOKEN=ghp_your_token"
ExecStart=/usr/bin/node server/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

## 🤝 Contributing

Contributions welcome! Areas to explore:

- Additional search algorithms
- UI/UX improvements
- More MCP capabilities
- Performance optimizations
- Documentation

## 📄 License

MIT - Built with 🍍 for the AI-first developer community

---

## 🔥 What We Built

This project showcases:

✅ **MCP Server Implementation** - Full MCP protocol with tools & resources
✅ **SSE Transport** - Remote MCP access with official SDK
✅ **Context-Aware Architecture** - Different capabilities per context
✅ **Smart Search** - BM25 + semantic hybrid search
✅ **Document Caching** - Persistent cache with auto-refresh
✅ **Auto-Discovery** - No manual config needed
✅ **GitHub Integration** - Direct repo access with token support
✅ **Beautiful UI** - Modern marketplace interface

**Perfect starting point for building AI-first documentation tools!** 🚀
