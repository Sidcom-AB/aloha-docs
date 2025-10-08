# Quick Start

Add your first framework to Aloha Docs in 5 minutes.

## Step 1: Prepare Your Documentation

Ensure your repository has a `docs/` folder with markdown files:

```
your-repo/
├── docs/
│   ├── introduction.md
│   ├── installation.md
│   └── api-reference.md
└── README.md
```

Don't have docs yet? See the [Documentation Guide](../guides/documentation-guide.md).

## Step 2: Open Aloha Docs

Navigate to `http://localhost:3000` in your browser.

## Step 3: Add Your Framework

Click the **"Add Framework"** button or go to the Add page.

### Enter Repository URL

```
https://github.com/your-username/your-repo
```

The wizard will automatically check if the repository is accessible.

### Provide Token (if private)

If your repository is private, you'll be prompted to provide a GitHub token. The wizard automatically detects when authentication is needed.

### Configure Settings

- **Documentation Path**: Leave empty for auto-discovery, or specify (e.g., `docs/`)
- **Auto-Discovery**: Keep enabled (recommended)

### Test Discovery

Click "Test Auto-Discovery" to preview how Aloha will index your docs.

### Review & Submit

Review the configuration and click "Submit".

## Step 4: Verify

Your framework should now appear in:
- ✅ Home page marketplace grid
- ✅ Browse page (searchable table)
- ✅ MCP server routes

## Step 5: Use with AI

### Add MCP Server to Claude Desktop

Add to your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "aloha-docs": {
      "command": "node",
      "args": ["/path/to/aloha-docs/server/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_token_here"
      }
    }
  }
}
```

Restart Claude Desktop.

### Ask Claude About Your Docs

```
Claude, read the documentation for [your-framework] and explain how to get started.
```

Claude will use the MCP server to fetch your documentation and provide answers!

## Example: Adding a Public Repository

Let's add a real example - the React documentation:

1. Click **Add Framework**
2. Enter URL: `https://github.com/facebook/react`
3. Leave path empty (auto-discover)
4. Click **Test Auto-Discovery**
5. Review and **Submit**

Aloha will discover React's documentation and make it available!

## Updating Documentation

Aloha automatically detects changes when:
- You push updates to your repository
- The cache expires (5 minutes)
- You manually trigger a re-validation

To manually refresh:
```bash
curl -X POST http://localhost:3000/api/repos/your-repo-id/validate
```

## Next Steps

- [Documentation Guide](../guides/documentation-guide.md) - Learn best practices
- [MCP Usage Guide](../guides/mcp-usage.md) - Deep dive into MCP integration
- [API Reference](../api/endpoints.md) - Explore the REST API
