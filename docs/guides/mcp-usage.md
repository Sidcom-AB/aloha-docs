# MCP Usage Guide

Use Aloha Docs with Claude Desktop and other AI assistants via the Model Context Protocol.

## What is MCP?

The **Model Context Protocol (MCP)** is a standard for connecting AI assistants to external data sources. Aloha Docs runs an MCP server that gives AI assistants direct access to all framework documentation.

## Benefits of MCP Integration

- 🤖 **Direct Access**: AI reads docs in real-time (no copy-paste)
- 🔄 **Always Updated**: Pulls latest documentation automatically
- 🔍 **Smart Search**: AI can search across all frameworks
- 📚 **Multi-Framework**: Access multiple docs in one conversation

## Installation

### Prerequisites

- Aloha Docs running locally
- Claude Desktop (or MCP-compatible AI client)
- Node.js 18+

### Step 1: Install Aloha Docs

```bash
git clone https://github.com/Sidcom-AB/aloha-docs.git
cd aloha-docs
npm install
npm start
```

Verify it's running at `http://localhost:3000`

### Step 2: Configure Claude Desktop

Add to your Claude Desktop configuration file:

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

**Configuration:**

```json
{
  "mcpServers": {
    "aloha-docs": {
      "command": "node",
      "args": ["/absolute/path/to/aloha-docs/server/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here",
        "PORT": "3000"
      }
    }
  }
}
```

**Important:** Use the absolute path to your `server/index.js` file.

### Step 3: Restart Claude Desktop

Quit and reopen Claude Desktop. The MCP server will start automatically.

### Step 4: Verify Connection

In Claude Desktop, type:

```
Are you connected to the aloha-docs MCP server?
```

If connected, Claude will confirm and show available tools.

## Using MCP with Claude

### Reading Documentation

Ask Claude to read any framework's documentation:

```
Read the React documentation from aloha-docs and explain how hooks work.
```

```
What does the Vue.js documentation say about reactive data?
```

### Searching Across Frameworks

Claude can search all frameworks at once:

```
Search aloha-docs for information about state management across all frameworks.
```

### Converting Documentation

Use MCP to help convert your docs:

```
Read the Aloha documentation standard from aloha-docs, then help me
convert my project's README into the Aloha format.
```

### Comparing Frameworks

```
Compare how React and Vue handle component props according to their
documentation in aloha-docs.
```

## MCP Server Capabilities

The Aloha MCP server provides these tools to AI assistants:

### `read_documentation`
Read a specific documentation file.

**Parameters:**
- `repository`: Repository ID (e.g., "react")
- `path`: File path (e.g., "getting-started/introduction.md")

### `search_documentation`
Search across all documentation.

**Parameters:**
- `query`: Search query string
- `limit`: Max results (default: 5)

### `list_repositories`
Get all available frameworks.

### `list_files`
List all documentation files for a repository.

**Parameters:**
- `repository`: Repository ID

## Advanced Usage

### Custom MCP Routes

Access specific framework docs via MCP routing:

```javascript
// In your MCP client
const result = await mcpServer.get('/api/mcp/react/getting-started');
```

### Programmatic Access

Use the MCP protocol programmatically:

```javascript
import { Client } from '@modelcontextprotocol/sdk';

const client = new Client({
  name: 'my-app',
  version: '1.0.0'
});

await client.connect('ws://localhost:3000');

const docs = await client.callTool('read_documentation', {
  repository: 'react',
  path: 'getting-started/introduction.md'
});

console.log(docs);
```

## Troubleshooting

### MCP Server Not Connecting

**Check if Aloha is running:**
```bash
curl http://localhost:3000/api/repositories
```

**Check Claude Desktop logs:**

**macOS:**
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Windows:**
```bash
type %APPDATA%\Claude\Logs\mcp*.log
```

### Port Conflicts

Change the port in your MCP config:

```json
{
  "mcpServers": {
    "aloha-docs": {
      "env": {
        "PORT": "8080"
      }
    }
  }
}
```

Also update in Aloha's `.env`:
```bash
PORT=8080
```

### Authentication Errors

For private repositories, ensure your `GITHUB_TOKEN` is valid:

```bash
curl -H "Authorization: token ghp_your_token" \
  https://api.github.com/user
```

## Other AI Assistants

### ChatGPT (GPT-4 with Plugins)

ChatGPT doesn't natively support MCP, but you can use the REST API:

```
Custom instructions:
When I ask about framework documentation, use the Aloha Docs API:
http://localhost:3000/api/repos/{repo-id}/docs/{file-path}
```

### Cursor / VS Code with Cline

Add MCP configuration to your editor's settings for code-aware documentation access.

### Custom Integrations

Build your own integration using the [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk):

```bash
npm install @modelcontextprotocol/sdk
```

## Workflow Example

Here's a complete workflow using MCP:

### 1. Add Your Framework

```bash
# Visit Aloha Docs
http://localhost:3000/#add

# Add: https://github.com/your-username/your-framework
```

### 2. Verify in MCP

Ask Claude:
```
List all available frameworks in aloha-docs
```

### 3. Generate Examples

```
Read my framework's API documentation and generate 5 usage examples.
```

### 4. Create Migration Guide

```
Compare my framework's docs to React's and create a migration guide
for developers switching from React.
```

## Best Practices

- ✅ Keep Aloha Docs running while using MCP
- ✅ Use specific queries ("read X" vs "tell me about X")
- ✅ Reference framework names explicitly
- ✅ Ask AI to search when unsure of file locations
- ❌ Don't assume AI has docs in training data (use MCP instead)

## Next Steps

- [Documentation Guide](./documentation-guide.md) - Improve your docs
- [API Reference](../api/endpoints.md) - Direct API access
- [Migration Guide](./migration.md) - Convert existing docs
