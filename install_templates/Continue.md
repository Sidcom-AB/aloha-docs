# {{name}} - Continue Installation

Add {{name}} MCP server to Continue (VS Code extension):

## Configuration

1. Open VS Code
2. Press `Cmd/Ctrl + Shift + P`
3. Search for "Continue: Open Config"
4. Add to your `config.json`:

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

1. Restart VS Code
2. {{name}} tools will appear in Continue
3. Start asking questions about {{name}}!
