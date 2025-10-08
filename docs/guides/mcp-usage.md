# Using Aloha Docs with Your AI Assistant

Get your AI assistant to read framework documentation directly - no more copy-pasting!

## What is MCP?

**Model Context Protocol (MCP)** is a way for AI assistants (like Claude) to connect to external data sources. Think of it like giving your AI a direct line to documentation instead of relying on its training data.

## What Does Aloha Do?

Aloha Docs is a platform where framework authors publish their documentation. Once published, any AI assistant connected via MCP can read that documentation in real-time.

**The benefit:** Your AI gives you accurate, up-to-date answers based on the actual documentation - not outdated training data.

## Example: Adding a Framework

Let's say you're the author of "MyFramework". Here's how you publish your docs:

1. Visit `%%ALOHA_HOST%%`
2. Click **"Add Repository"**
3. Enter your GitHub repo: `https://github.com/you/my-framework`
4. Aloha automatically discovers your `docs/` folder and indexes it

That's it! Your documentation is now available via MCP.

## Connecting Your AI Assistant

Once frameworks are published to Aloha, you can connect your AI assistant to access them:

**Visit the [How To page](%%ALOHA_HOST%%/#howto)** and select your AI assistant from the dropdown:

- **Claude Code** - Command-line AI assistant
- **Claude Desktop** - Desktop application
- **Cursor** - AI-powered code editor
- **Windsurf** - Development IDE
- **Cline** - VS Code extension
- **Continue** - Editor integration
- **Roo Code** - Development assistant

Each guide shows the exact configuration needed.

## Using It

Once connected, just ask your AI:

```
Read the React documentation from aloha-docs and explain how useState works.
```

```
What does the Vue.js docs say about component composition?
```

```
Compare authentication approaches across all frameworks in aloha-docs.
```

Your AI will search and read the documentation automatically to give you accurate answers.

## Why This Matters

**Without MCP:** AI relies on training data that might be months or years old.

**With MCP + Aloha:** AI reads the latest documentation directly from the source.

This means:
- ✅ Always accurate information
- ✅ Latest features and APIs
- ✅ Official examples and best practices
- ✅ Multiple frameworks in one conversation

## Next Steps

- [What is Aloha Docs](./what-is-aloha.md) - Learn more about the platform
- [Documentation Guide](./documentation-guide.md) - Write documentation for your framework
