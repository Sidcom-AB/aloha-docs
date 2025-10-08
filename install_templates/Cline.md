# {{name}} - Cline Installation

Add {{name}} MCP server to Cline (VS Code extension):

## Configuration

1. Open VS Code Settings
2. Search for "Cline: MCP Settings"
3. Click "Edit in settings.json"

Add this configuration:

```json
{
  "cline.mcpServers": {
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

1. Restart VS Code
2. Open Cline extension
3. {{name}} tools will appear automatically
4. Start asking questions about {{name}}!
