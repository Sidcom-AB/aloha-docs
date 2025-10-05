# 🍍 Aloha Framework Docs

**AI-first documentation system for component libraries**

Transform your component documentation into a searchable, AI-friendly knowledge base that works seamlessly with Claude, ChatGPT, and other AI assistants through MCP (Model Context Protocol).

## 📚 Documentation Structure Guide

This guide shows framework creators how to structure their documentation for optimal AI comprehension and human readability.

### Required Folder Structure

Your documentation must follow this exact structure:

```
your-project/
└── docs/                          # Single documentation folder
    ├── table_of_contents.json    # Navigation structure (REQUIRED)
    ├── schemas/                  # Component & token definitions
    │   ├── button.schema.json    # Component schemas
    │   ├── card.schema.json      
    │   └── tokens.schema.json    # Design tokens as schema
    └── content/                  # Markdown documentation
        ├── getting-started.md
        ├── contributing.md
        └── api-reference.md
```

### 1️⃣ Table of Contents (Required)

**File:** `docs/table_of_contents.json`

This is your documentation's entry point. It defines navigation and structure:

```json
{
  "title": "Your Framework Name",
  "description": "Brief description for AI context",
  "version": "1.0.0",
  "sections": [
    {
      "title": "Getting Started",
      "items": [
        {
          "title": "Installation",
          "file": "content/installation.md",
          "description": "How to install the framework"
        },
        {
          "title": "Quick Start",
          "file": "content/quick-start.md",
          "description": "5-minute tutorial"
        }
      ]
    },
    {
      "title": "Components",
      "type": "schemas",  // Auto-populates from schemas folder
      "description": "UI components documentation"
    }
  ]
}
```

**Key points:**
- `type: "schemas"` auto-generates navigation from your schemas folder
- `file` paths are relative to docs root
- `description` helps AI understand context

### 2️⃣ Component Schemas

**Location:** `docs/schemas/*.schema.json`

Each component needs a schema file that serves as the single source of truth:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Button Component",
  "description": "A versatile button with multiple variants",
  "tagName": "x-button",           // Custom element tag
  "className": "ButtonElement",    // Optional: JS class name
  
  "properties": {
    "variant": {
      "type": "string",
      "enum": ["primary", "secondary", "ghost"],
      "default": "primary",
      "description": "Visual style variant"
    },
    "disabled": {
      "type": "boolean",
      "default": false,
      "description": "Disable interactions"
    }
  },
  
  "events": [
    {
      "name": "click",
      "type": "MouseEvent",
      "description": "Fired on button click",
      "bubbles": true
    }
  ],
  
  "slots": [
    {
      "name": "",
      "description": "Default slot for button content"
    },
    {
      "name": "icon",
      "description": "Slot for icon element"
    }
  ],
  
  "cssParts": [
    {
      "name": "button",
      "description": "The button element"
    }
  ],
  
  "cssProperties": [
    {
      "name": "--button-bg",
      "description": "Background color",
      "default": "var(--primary)"
    }
  ],
  
  "examples": [
    {
      "title": "Primary Button",
      "code": "<x-button variant=\"primary\">Click me</x-button>"
    }
  ]
}
```

**Schema Benefits:**
- Single source of truth (no duplication)
- Auto-generates human-readable docs
- AI can parse structured data perfectly
- Type-safe and validatable

### 3️⃣ Design Tokens

**File:** `docs/schemas/tokens.schema.json`

Treat design tokens as a special schema:

```json
{
  "title": "Design Tokens",
  "description": "Design system tokens for theming",
  "tokens": {
    "colors": {
      "primary": "#2563eb",
      "secondary": "#10b981",
      "text": "#1f2937"
    },
    "spacing": {
      "sm": "0.5rem",
      "md": "1rem",
      "lg": "1.5rem"
    },
    "typography": {
      "fontFamily": {
        "sans": "system-ui, sans-serif",
        "mono": "monospace"
      }
    }
  }
}
```

### 4️⃣ Markdown Content

**Location:** `docs/content/*.md`

Keep all markdown files flat in the content folder:

```markdown
# Component Best Practices

Brief description for AI context.

tags: [guide, components, best-practices]

## Section Title

Content here...
```

**Markdown Tips:**
- Add `tags: [...]` for better search
- First `# Title` becomes the document title
- Keep files focused on single topics
- Use descriptive filenames (they become URLs)

### 5️⃣ MCP Integration

Once your docs follow this structure, AI assistants can:

1. **Search semantically**: Find relevant information across all docs
2. **Get component details**: Retrieve exact API specifications
3. **Access design tokens**: Get theming information
4. **Browse documentation**: Navigate through structured content

Connect with Claude Code:
```json
{
  "mcpServers": {
    "your-framework": {
      "command": "npx",
      "args": ["aloha-framework-docs", "--docs", "./docs"]
    }
  }
}
```

## 🚀 Quick Start

### For Framework Authors

1. **Structure your docs** following the guide above
2. **Install the server**: 
   ```bash
   npm install -g aloha-framework-docs
   ```
3. **Run locally**:
   ```bash
   aloha-docs --docs ./docs
   ```
4. **Access at** http://localhost:3000

### Environment Variables

```env
DOCS_PATH=./docs          # Path to your docs folder
PORT=3000                 # Server port
WATCH_FILES=true          # Auto-reload on changes
```

## 🎯 Why This Structure?

1. **No Duplication**: Each component defined once in schemas
2. **AI-Optimized**: Structured JSON for perfect AI parsing
3. **Human-Friendly**: Auto-generates beautiful documentation
4. **Maintainable**: Single source of truth for all component info
5. **Searchable**: Built-in RAG for semantic search

## 📝 Best Practices

### DO's ✅
- Keep schemas as single source of truth
- Use descriptive titles and descriptions
- Include code examples in schemas
- Tag markdown files for better search
- Keep file names URL-friendly

### DON'Ts ❌
- Don't duplicate component info in markdown
- Don't nest markdown files in deep folders
- Don't mix documentation with source code
- Don't forget descriptions (AI needs context)

## 🔧 Advanced Features

### Auto-reload
Changes to your docs are detected and reloaded automatically.

### Multiple Projects
```bash
DOCS_PATH=/path/to/project-a/docs aloha-docs  # Project A
DOCS_PATH=/path/to/project-b/docs aloha-docs  # Project B
```

### Custom Schemas
Extend schemas with custom fields - they'll be preserved and shown in docs.

## 📄 License

MIT

---

Built with 🍍 for the component library community