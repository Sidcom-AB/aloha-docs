# What is Aloha Docs?

Aloha Docs is a documentation platform that makes framework documentation accessible to AI assistants through the Model Context Protocol (MCP).

## Overview

Aloha Docs bridges the gap between documentation and AI by providing a standardized way to publish, discover, and access technical documentation. It enables developers to make their framework's documentation available to AI assistants like Claude, enhancing the development experience.

## Key Features

### 🔍 Auto-Discovery
Point Aloha to your GitHub repository, and it automatically discovers and indexes your documentation structure - no configuration needed.

### 🤖 MCP Server
Built-in MCP server that gives AI assistants direct access to documentation through:
- Search across all frameworks
- Read specific documentation files
- List available resources
- Context-aware scoping (global or framework-specific)

### 📚 Multi-Framework Support
Host and access documentation for multiple frameworks in one place:
- Each framework maintains its own namespace
- Cross-framework search capabilities
- Hierarchical organization with parent-child relationships

### ⚡ Fast Search
- In-memory search engine with BM25 ranking
- Document caching with smart invalidation
- Sub-100ms search response times

### 🎯 Zero Configuration
Just follow a simple folder structure:
```
your-repo/
└── docs/
    ├── getting-started/
    │   ├── introduction.md
    │   └── installation.md
    ├── guides/
    └── api/
```

## How It Works

### 1. Documentation Structure
Framework owners write documentation in markdown following the [Aloha standard](./documentation-guide.md).

### 2. GitHub Discovery
Aloha discovers documentation by:
- Reading the `docs/` folder structure
- Auto-generating navigation from folder names
- Caching documentation files for fast access
- Supporting both public and private repositories

### 3. MCP Integration
AI assistants connect via MCP to:
- Search documentation across all frameworks
- Read specific pages and sections
- Access the latest documentation automatically

### 4. Developer Experience
Developers get:
- Real-time documentation access in their AI assistant
- No need to copy-paste docs
- Multi-framework context in one conversation
- Always up-to-date information (5-minute cache)

## Use Cases

### For Framework Authors
**Publish Your Docs**
- Add your GitHub repository to Aloha
- Documentation becomes instantly available via MCP
- AI assistants can now reference your docs accurately

### For Developers
**AI-Powered Development**
- Ask AI about any framework's documentation
- Get accurate, current information
- Compare frameworks side-by-side
- Generate examples based on official docs

### For Teams
**Centralized Documentation**
- Host all your internal framework docs
- Private repository support
- Consistent documentation standards
- AI-accessible knowledge base

## Architecture

### Components

**Frontend (SPA)**
- Search interface
- Repository browser
- Documentation viewer
- Add repository wizard

**Backend (Node.js + Express)**
- GitHub integration
- Search engine (in-memory BM25)
- Document caching
- MCP server (SSE transport)

**Storage**
- File-based configuration
- GitHub as source of truth
- In-memory caches with TTL

## MCP Server Capabilities

Aloha runs an MCP server that provides these tools to AI assistants:

### Tools
- `search_docs` - Search across all documentation
- `read_document` - Read specific documentation files
- `list_repositories` - Get available frameworks
- `get_resource` - Access framework resources

### Resources
Each documentation file is exposed as an MCP resource:
- URI format: `aloha://framework-id/path/to/doc.md`
- Context-aware (global or framework-specific)
- Real-time updates

### Transport
- **SSE (Server-Sent Events)** - Remote connection support
- Supports both root context (all frameworks) and scoped context (single framework)

## Getting Started

### Install Aloha Docs
```bash
git clone https://github.com/Sidcom-AB/aloha-docs.git
cd aloha-docs
npm install
npm start
```

### Add Your Framework
1. Visit `%%ALOHA_HOST%%`
2. Click "Add Repository"
3. Enter your GitHub repository URL
4. Aloha auto-discovers and validates your docs

### Connect AI Assistant
See [MCP Usage Guide](./mcp-usage.md) for detailed setup instructions.

## Documentation Standards

Aloha works best when documentation follows these principles:

### Folder Structure
- One `docs/` folder at repository root
- Subfolders become navigation sections
- Markdown files become pages

### File Naming
- Lowercase with hyphens: `quick-start.md`
- One H1 title per file
- Descriptive names that convert well to titles

### Content Quality
- Code examples with language tags
- Tables for properties/options
- Logical heading hierarchy (H1 → H2 → H3)
- Working internal links

Full details in the [Documentation Guide](./documentation-guide.md).

## Benefits

### For AI Assistants
- ✅ Access latest documentation in real-time
- ✅ Search across multiple frameworks
- ✅ No training data staleness
- ✅ Structured, reliable information

### For Developers
- ✅ Ask AI questions, get accurate answers
- ✅ No manual doc copy-pasting
- ✅ Framework comparison in one conversation
- ✅ Learn faster with AI guidance

### For Framework Authors
- ✅ Wider adoption through AI accessibility
- ✅ No extra work - just write good markdown
- ✅ Validation tools ensure quality
- ✅ Analytics on documentation usage

## Example Workflow

**Step 1: Framework author publishes docs**
```bash
# Create structured markdown docs
my-framework/docs/
  getting-started/introduction.md
  api/reference.md

# Push to GitHub
git push
```

**Step 2: Add to Aloha**
- Visit Aloha Docs
- Add repository URL
- Auto-discovery validates and indexes

**Step 3: Developer uses AI**
```
Developer: "How do I initialize MyFramework according to the official docs?"

Claude: *reads from Aloha MCP server*
"According to MyFramework's documentation, you initialize it like this..."
```

## Next Steps

- [Documentation Guide](./documentation-guide.md) - Learn how to write Aloha-compatible docs
- [MCP Usage Guide](./mcp-usage.md) - Connect your AI assistant

## Technical Details

### Performance
- Sub-100ms search queries
- 5-minute document cache TTL
- In-memory BM25 search index
- GitHub API rate limit handling

### Security
- GitHub token support for private repos
- No data persistence (stateless)
- Read-only GitHub access
- CORS and rate limiting

### Scalability
- Designed for 10-100 frameworks
- In-memory architecture (fast, limited scale)
- Future: Distributed caching, database backing
