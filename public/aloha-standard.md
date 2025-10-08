# Aloha Documentation Standard

**Version:** 1.0
**Last Updated:** 2025-01-08

This document defines the Aloha documentation standard. Use this guide to convert your existing framework documentation to be compatible with Aloha Docs auto-discovery system.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Folder Structure](#folder-structure)
3. [Markdown Guidelines](#markdown-guidelines)
4. [Metadata Configuration](#metadata-configuration)
5. [Auto-Discovery Rules](#auto-discovery-rules)
6. [Component Documentation](#component-documentation)
7. [Quick Migration Guide](#quick-migration-guide)

---

## Overview

The Aloha documentation standard is designed for **zero-configuration** auto-discovery. Simply structure your files correctly, push to GitHub, and Aloha will automatically discover and organize your documentation.

**Key Principles:**
- 📁 Folder structure defines navigation hierarchy
- 📝 Markdown files are automatically discovered
- 🎯 File names become navigation labels
- 🔍 No build step or configuration required

---

## Folder Structure

### Recommended Structure

```
your-repo/
├── docs/                           # Default documentation folder
│   ├── getting-started/            # Section: "Getting Started"
│   │   ├── introduction.md
│   │   ├── installation.md
│   │   └── quick-start.md
│   ├── components/                 # Section: "Components"
│   │   ├── button.md
│   │   ├── card.md
│   │   ├── modal.md
│   │   └── tooltip.md
│   ├── api/                        # Section: "API Reference"
│   │   ├── methods.md
│   │   ├── events.md
│   │   └── types.md
│   └── guides/                     # Section: "Guides"
│       ├── theming.md
│       ├── customization.md
│       └── best-practices.md
└── README.md
```

### Alternative Folder Names

Aloha auto-discovers documentation in these common locations:
- `docs/`
- `documentation/`
- `doc/`
- `website/docs/`
- `packages/docs/`
- `src/docs/`
- `content/`
- `pages/`

**Recommendation:** Use `docs/` in the root of your repository.

---

## Markdown Guidelines

### Document Structure

Each markdown file should follow this template:

```markdown
# Component/Feature Name

Brief one-sentence description of what this is.

## Overview

More detailed explanation of the component/feature and when to use it.

## Installation

\`\`\`bash
npm install your-package
# or
yarn add your-package
\`\`\`

## Basic Usage

\`\`\`javascript
import { Component } from 'your-framework';

const instance = new Component({
  option: 'value'
});
\`\`\`

## Configuration

### Props / Options

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| name | string | - | Yes | The component name |
| enabled | boolean | true | No | Enable/disable component |
| options | object | {} | No | Configuration options |

## Examples

### Basic Example
\`\`\`javascript
const basic = new Component({ name: 'MyComponent' });
\`\`\`

### Advanced Example
\`\`\`javascript
const advanced = new Component({
  name: 'MyComponent',
  options: {
    theme: 'dark',
    animations: true
  }
});
\`\`\`

## API Reference

### Methods

#### \`initialize()\`
Initializes the component.

**Returns:** `void`

#### \`destroy()\`
Cleans up and destroys the component.

**Returns:** `void`

### Events

#### \`onReady\`
Fired when component is ready.

**Payload:** `{ timestamp: number }`

## Best Practices

- ✅ Always provide a name when initializing
- ✅ Call destroy() when unmounting
- ❌ Don't modify internal state directly
- ❌ Avoid nesting components more than 3 levels deep

## Troubleshooting

### Common Issues

**Problem:** Component not rendering
**Solution:** Check that you've called `initialize()` after creation

## Related

- [Button Component](./button.md)
- [Styling Guide](../guides/styling.md)
```

### Naming Conventions

**File Names:**
- Use lowercase with hyphens: `button-component.md` ✅
- Avoid spaces: `Button Component.md` ❌
- Avoid underscores: `button_component.md` ❌

**Headings:**
- Use `#` for title (H1) - one per file
- Use `##` for main sections (H2)
- Use `###` for subsections (H3)
- Maximum depth: H4 (`####`)

### Code Blocks

Always specify the language for syntax highlighting:

```markdown
\`\`\`javascript
const code = 'here';
\`\`\`

\`\`\`bash
npm install package
\`\`\`

\`\`\`json
{
  "key": "value"
}
\`\`\`
```

---

## Metadata Configuration

### Optional: aloha.json

**You probably don't need this!** Aloha auto-generates everything from your folder structure and markdown files.

Only add `aloha.json` to your `docs/` folder if you want to customize:

```json
{
  "title": "Custom Framework Title",
  "description": "Custom description",
  "categories": {
    "getting-started": {
      "title": "🚀 Get Started",
      "order": 1
    },
    "components": {
      "title": "Components",
      "order": 2
    }
  }
}
```

**Default behavior (without aloha.json):**
- ✅ Folder names auto-converted to titles: `getting-started` → "Getting Started"
- ✅ Smart ordering: getting-started, guides, components, api (then alphabetical)
- ✅ File names auto-converted: `quick-start.md` → "Quick Start"
- ✅ Zero configuration needed!

---

## Auto-Discovery Rules

### How Auto-Discovery Works

1. **Folder Scanning:** Aloha scans for common doc folders (`docs/`, etc.)
2. **Section Detection:** Each subfolder becomes a navigation section
3. **File Discovery:** All `.md` files are indexed
4. **Title Extraction:** First H1 (`#`) becomes the page title
5. **Ordering:** Alphabetical by default, or use `aloha.json` for custom order

### File Name to Title Conversion

| File Name | Display Title |
|-----------|---------------|
| `introduction.md` | Introduction |
| `quick-start.md` | Quick Start |
| `api-reference.md` | API Reference |
| `getting-started.md` | Getting Started |

---

## Component Documentation

### Standard Component Structure

For UI frameworks and component libraries, use this standardized markdown structure for maximum clarity:

```markdown
# ComponentName

Brief one-sentence description of what the component does.

## Overview

Detailed explanation of the component's purpose and when to use it.

## Usage

\`\`\`html
<component-tag property="value">
  Content
</component-tag>
\`\`\`

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| variant | string | "default" | Visual style variant |
| size | string | "medium" | Component size |
| disabled | boolean | false | Disable interaction |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| click | MouseEvent | Fired when clicked |
| change | CustomEvent | Fired when value changes |

## Methods

### \`methodName(param)\`
Description of what the method does.

**Parameters:**
- \`param\` (type) - Parameter description

**Returns:** \`ReturnType\` - What it returns

\`\`\`javascript
component.methodName('value');
\`\`\`

## Examples

### Basic Example
\`\`\`html
<component-tag>Basic usage</component-tag>
\`\`\`

### Advanced Example
\`\`\`html
<component-tag variant="primary" size="large">
  Advanced usage
</component-tag>
\`\`\`

## Accessibility

- Screen reader considerations
- Keyboard navigation
- ARIA attributes
- WCAG compliance notes

## Best Practices

1. When to use this component
2. Common pitfalls to avoid
3. Performance considerations
4. Mobile/responsive guidelines

## Related Components

- [OtherComponent](./other-component.md) - Related functionality
```

### Why This Structure?

- **AI-Friendly:** AI assistants can easily parse and understand the structure
- **Complete:** Covers all aspects developers need (props, events, methods, examples)
- **Consistent:** Same format across all components
- **Accessible:** Includes accessibility requirements
- **Practical:** Multiple examples show real-world usage

---

## Quick Migration Guide

### Step 1: Audit Current Documentation

```bash
# List all documentation files
find . -name "*.md" -not -path "*/node_modules/*"
```

### Step 2: Create docs/ Folder

```bash
mkdir -p docs/getting-started docs/components docs/api docs/guides
```

### Step 3: Move Files to Sections

Organize your existing markdown files into logical sections:
- **Getting Started:** Introduction, installation, quickstart
- **Components:** Individual component docs
- **API:** API reference, methods, types
- **Guides:** Tutorials, best practices, examples

### Step 4: Standardize Markdown Files

For each file, ensure:
- ✅ Has one H1 (`#`) title
- ✅ Uses proper heading hierarchy
- ✅ Code blocks have language specified
- ✅ Tables are properly formatted
- ✅ Links are relative or absolute

### Step 5: Test Locally

```bash
# Clone aloha-docs
git clone https://github.com/Sidcom-AB/aloha-docs
cd aloha-docs

# Add your repo for testing
# Use the web interface at http://localhost:3000
npm start
```

### Step 6: Push to GitHub

```bash
git add docs/
git commit -m "docs: migrate to Aloha standard"
git push
```

### Step 7: Add to Aloha Docs

Visit [Aloha Docs](http://localhost:3000) and add your repository using the "Add Framework" wizard.

---

## Examples

### Converting a README-heavy project

**Before:**
```
your-repo/
├── README.md          # 5000 lines of everything
└── src/
```

**After:**
```
your-repo/
├── README.md          # Short overview with link to docs
├── docs/
│   ├── getting-started/
│   │   ├── introduction.md
│   │   └── installation.md
│   ├── components/
│   │   ├── button.md
│   │   └── card.md
│   └── api/
│       └── reference.md
└── src/
```

### Converting a Docusaurus project

**Before:**
```
your-repo/
├── docs/              # Docusaurus-specific format
└── docusaurus.config.js
```

**After:**
```
your-repo/
└── docs/              # Same folder, just remove frontmatter
    ├── intro.md       # Remove: ---\nid: intro\n---
    └── ...
    # No aloha.json needed! Auto-discovery handles everything
```

---

## AI Prompt for Migration

Use this prompt with Claude or ChatGPT to migrate your docs:

```
I need to convert my framework documentation to the Aloha standard.

Current structure:
[paste your current file tree]

Requirements:
1. Move all .md files to docs/ folder
2. Organize into sections: getting-started, components, api, guides
3. Ensure each .md file has exactly one H1 title
4. Standardize code blocks with language tags
5. Create aloha.json with navigation metadata

Please provide the migration plan and new folder structure.
```

---

## Resources

- **Aloha Docs:** https://github.com/Sidcom-AB/aloha-docs
- **Markdown Guide:** https://www.markdownguide.org/
- **GitHub Flavored Markdown:** https://github.github.com/gfm/

---

## Support

Questions? Open an issue on [GitHub](https://github.com/Sidcom-AB/aloha-docs/issues)

---

**Happy documenting! 🍍**
