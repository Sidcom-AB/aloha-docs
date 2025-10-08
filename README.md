# 🍍 Aloha Docs

**A modern documentation marketplace for web frameworks with AI-first MCP integration**

Discover, explore, and share framework documentation in a beautiful marketplace. No more `table_of_contents.json` - just push your docs to GitHub and let Auto-Discovery handle the rest!

## ✨ Features

- 🚀 **Framework Marketplace** - Beautiful gallery of framework documentations
- 🔍 **Auto-Discovery** - Automatically finds and categorizes `.md` and `.schema.json` files
- 🤖 **MCP Server** - Claude Code integration for AI assistance
- 🌐 **GitHub Native** - Direct loading from GitHub repositories
- 🎨 **Modern UI** - Stunning pill-style navigation with smooth animations
- 🔐 **Private Repo Support** - Per-repository token authentication
- 📚 **Smart Categorization** - Folder structure becomes navigation

## 🚀 Quick Start

```bash
npm install
npm start
```

Visit http://localhost:3000 to see the marketplace!

## 📚 How It Works

### No More `table_of_contents.json`! 🎉

The system uses **Auto-Discovery** to automatically find and organize your documentation:

```
your-repo/
├── docs/
│   ├── getting-started/        → "Getting Started" section
│   │   ├── introduction.md
│   │   └── installation.md
│   ├── components/             → "Components" section
│   │   ├── button.schema.json
│   │   └── card.schema.json
│   ├── api/                    → "API" section
│   │   └── methods.md
│   └── aloha.json             → Optional metadata
```

### Optional: `aloha.json` for Customization

Add an `aloha.json` file for custom metadata and ordering:

```json
{
  "title": "My Amazing Framework",
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

## 🎯 Adding Your Framework

### Via the Marketplace UI

1. Click **"+ Add Framework"** button
2. Enter your GitHub repository URL
3. (Optional) Add GitHub token for private repos
4. Click **Auto-Discover** to validate
5. Submit!

### What Gets Auto-Discovered

- **Markdown Files** (`.md`) → Documentation pages
- **Schema Files** (`.schema.json`) → Component definitions
- **Folder Names** → Navigation categories
- **File Names** → Page titles (prettified)

## 🤖 MCP Integration

### Connect with Claude Code

```json
{
  "mcpServers": {
    "aloha": {
      "command": "node",
      "args": ["server/index.js"],
      "cwd": "/path/to/aloha-framework"
    }
  }
}
```

### MCP Routing Hierarchy

- `/` → Access all frameworks
- `/framework-id` → Specific framework
- `/framework-id/child` → Sub-framework

RAG search works hierarchically - searching downward in the tree only.

## 📁 Project Structure

```
aloha-framework/
├── server/
│   └── modules/
│       ├── auto-discovery.js      # Smart doc detection
│       ├── github-loader.js       # GitHub API client
│       ├── repository-manager.js  # Framework management
│       └── mcp-router.js          # Hierarchical routing
├── public/
│   ├── index.html                 # Marketplace
│   ├── framework.html             # Doc viewer
│   └── css/
│       └── navbar-pill.css        # Beautiful navigation
└── config/
    └── repositories.json          # Stored frameworks
```

## 🔧 Component Schema Format

For components, use the standard JSON Schema format:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Button Component",
  "description": "A versatile button component",
  "tagName": "x-button",
  
  "properties": {
    "variant": {
      "type": "string",
      "enum": ["primary", "secondary"],
      "description": "Button style variant"
    }
  },
  
  "events": [
    {
      "name": "click",
      "description": "Fired on click"
    }
  ],
  
  "examples": [
    {
      "title": "Basic Button",
      "code": "<x-button>Click me</x-button>"
    }
  ]
}
```

## 🌟 Best Practices

### DO's ✅
- Use descriptive folder names (they become categories)
- Keep related docs in the same folder
- Add `aloha.json` for custom branding
- Include examples in your schemas
- Use meaningful file names

### DON'Ts ❌
- Don't use `table_of_contents.json` (deprecated)
- Don't nest folders too deep (max 3 levels)
- Don't mix docs with source code
- Don't forget descriptions in schemas

## 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Marketplace homepage |
| `GET /api/repositories` | List all frameworks |
| `POST /api/repos` | Add new framework |
| `POST /api/discover` | Auto-discover docs |
| `GET /api/repos/:id` | Framework details |
| `GET /:framework-id` | View framework docs |

## 🛠️ Configuration

### Repository Storage

Frameworks are stored in `config/repositories.json`:

```json
{
  "repositories": [
    {
      "id": "my-framework",
      "name": "My Framework",
      "url": "https://github.com/user/repo/tree/main/docs",
      "encryptedToken": "...",  // For private repos
      "enabled": true
    }
  ]
}
```

### Environment Variables

```bash
# Optional - for higher GitHub API rate limits
GITHUB_TOKEN=ghp_your_token_here

# Server port
PORT=3000
```

## 🚢 Deployment

### Docker

```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel/Netlify

Deploy the `public` folder as static site and `server` as serverless functions.

## 🤝 Contributing

We love contributions! Feel free to:

1. Add your framework to the marketplace
2. Improve the UI/UX
3. Add new features
4. Report bugs

## 📄 License

MIT - Use freely in your projects!

---

Built with 🍍 by the Aloha team for the developer community