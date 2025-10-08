# {{name}} - Claude Desktop Installation

Add {{name}} MCP server to Claude Desktop:

## Configuration

Open your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration:

```json
{
  "mcpServers": {
    "{{id}}": {
      "url": "{{url}}",
      "transport": "sse"
    }
  }
}
```

## What You Get

- Search {{name}} documentation
- Get full document content
- {{contextSpecific}}

## Next Steps

1. Restart Claude Desktop
2. {{name}} tools will appear in the 🔌 menu
3. Start asking questions about {{name}}!

## Verify Installation

Look for the 🔌 icon in Claude Desktop to see connected MCP servers.
