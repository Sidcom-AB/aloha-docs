# Documentation Guide

Learn how to structure your documentation for Aloha Docs auto-discovery.

## Overview

The Aloha documentation standard is designed for **zero-configuration**. Just structure your markdown files correctly, and we handle the rest.

## Folder Structure

### Basic Structure

```
your-repo/
├── docs/                    # Main documentation folder
│   ├── getting-started/     # Section folders
│   ├── components/
│   ├── api/
│   └── guides/
└── README.md
```

### Section Folders

Each subfolder in `docs/` becomes a navigation section:

- `getting-started/` → "Getting Started"
- `api-reference/` → "API Reference"
- `guides/` → "Guides"

**Naming Convention:**
- Use lowercase
- Use hyphens for spaces
- Be descriptive

### Markdown Files

Each `.md` file becomes a documentation page:

- `introduction.md` → "Introduction"
- `quick-start.md` → "Quick Start"
- `api-methods.md` → "API Methods"

## Markdown Best Practices

### Document Template

```markdown
# Page Title

Brief one-sentence description.

## Overview

Detailed explanation of the topic.

## Installation

\`\`\`bash
npm install your-package
\`\`\`

## Usage

\`\`\`javascript
import { Component } from 'your-package';
const instance = new Component();
\`\`\`

## Configuration

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| name | string | - | Component name |
| enabled | boolean | true | Enable feature |

## Examples

### Basic Example

\`\`\`javascript
const basic = new Component({ name: 'Example' });
\`\`\`

## API Reference

### Methods

#### \`initialize()\`
Initializes the component.

**Returns:** \`void\`

## Related

- [Other Page](./other-page.md)
```

### Heading Hierarchy

- **H1 (`#`)**: Page title (one per file)
- **H2 (`##`)**: Main sections
- **H3 (`###`)**: Subsections
- **H4 (`####`)**: Details (max depth)

### Code Blocks

Always specify language:

```markdown
\`\`\`javascript
const code = 'here';
\`\`\`

\`\`\`bash
npm install
\`\`\`

\`\`\`json
{ "key": "value" }
\`\`\`
```

### Tables

Use for structured data:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data     | Data     | Data     |
```

### Links

**Internal (relative):**
```markdown
[Getting Started](./getting-started.md)
[API Reference](../api/methods.md)
```

**External:**
```markdown
[GitHub](https://github.com)
```

## Component Documentation

For UI frameworks and component libraries, follow this standardized structure for maximum clarity and AI-friendliness.

### Component Template

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

### Component Sections Explained

**Properties Table:**
- Always include Type, Default, Description columns
- Use standard types (string, number, boolean, object, array)
- For enums, list valid values in description

**Events Table:**
- Include event name, payload type, and when it fires
- Use standard event types when applicable (MouseEvent, KeyboardEvent)

**Methods:**
- Document public methods only
- Include parameters, return types, and examples
- Use JSDoc-style type annotations

**Examples:**
- Start with simplest use case
- Build up to more complex scenarios
- Include realistic, copy-pasteable code
- Show different variants and states

**Accessibility:**
- WCAG compliance requirements
- Keyboard navigation patterns
- Screen reader behavior
- Required ARIA attributes

**Best Practices:**
- Usage guidelines
- Common mistakes to avoid
- Performance tips
- Related patterns

## Dos and Don'ts

### ✅ Do

- Start each file with H1 title
- Use descriptive file names
- Include code examples
- Add tables for options/props
- Link related documentation
- Keep files focused and concise

### ❌ Don't

- Use multiple H1 headings per file
- Leave code blocks without language tags
- Create deeply nested folder structures (max 2-3 levels)
- Use spaces or special characters in file names
- Duplicate content across files

## Optional: aloha.json

**Note:** Most projects don't need this! Aloha auto-generates everything from your folder structure.

Only add `aloha.json` if you want to customize:

```json
{
  "title": "Custom Framework Title",
  "description": "Custom description",
  "categories": {
    "getting-started": {
      "title": "🚀 Get Started",
      "order": 1
    },
    "advanced": {
      "title": "Advanced Topics",
      "order": 2
    }
  }
}
```

**Default behavior without aloha.json:**
- Categories auto-generated from folder names
- Titles auto-formatted: `getting-started` → "Getting Started"
- Smart default ordering: getting-started, guides, components, api

**Location:** Place in your `docs/` folder if needed.

## Validation

Aloha validates your documentation for:

- ✅ Required files present
- ✅ Valid markdown syntax
- ✅ Proper heading hierarchy
- ✅ Working internal links
- ✅ Code blocks have language specified

## Migration from Other Formats

### From Plain README

Split your large README into focused files:

```bash
docs/
├── getting-started/
│   ├── introduction.md    # Intro section from README
│   └── installation.md    # Install section from README
└── guides/
    └── usage.md           # Usage section from README
```

### From Docusaurus

Remove frontmatter and keep content:

**Before:**
```markdown
---
id: intro
title: Introduction
sidebar_position: 1
---

# Introduction

Content here...
```

**After:**
```markdown
# Introduction

Content here...
```

### From GitBook

Similar structure, just ensure:
- Remove SUMMARY.md (use folders for navigation)
- Rename files to lowercase-with-hyphens
- Update internal links to be relative

## Testing Your Documentation

### Local Preview

Add your repo to Aloha locally:

```bash
# Start Aloha Docs
cd aloha-docs
npm start

# Add your repo via web interface
http://localhost:3000/#add
```

### Validation Endpoint

Check documentation quality:

```bash
curl -X POST http://localhost:3000/api/discover \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/your-username/your-repo"}'
```

## Using AI to Convert Documentation

### Step 1: Download the Standard

Visit the How To page and download `aloha-standard.md`.

### Step 2: Ask AI to Convert

```
Read the aloha-standard.md file and convert my existing documentation
to follow the Aloha format. My current docs are in [describe structure].
```

### Step 3: Review and Commit

Review AI-generated structure and commit:

```bash
git add docs/
git commit -m "docs: migrate to Aloha standard"
git push
```

## Examples

See Aloha Docs' own documentation for a complete example:
- 📁 [docs/](https://github.com/Sidcom-AB/aloha-docs/tree/master/docs)

## Next Steps

- [MCP Usage Guide](./mcp-usage.md) - Use with AI assistants
- [Migration Guide](./migration.md) - Convert existing docs
