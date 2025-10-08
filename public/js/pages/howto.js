// How To Page Module
export default {
  render() {
    return `
      <div class="howto-page">
        <div class="howto-header">
          <h1>📘 Documentation Guide</h1>
          <p>Learn how to document your framework for optimal discovery and presentation</p>
        </div>

        <!-- Getting Started -->
        <div class="guide-section">
          <h2><i class="fas fa-rocket"></i> Getting Started</h2>
          <p>
            Aloha Docs uses <strong>Auto-Discovery</strong> to automatically find and organize your documentation.
            Simply structure your files correctly, and we'll take care of the rest!
          </p>

          <div class="highlight-box">
            <strong>✨ No Configuration Required!</strong> Just push your markdown files to GitHub,
            and our system will automatically discover and categorize them based on your folder structure.
          </div>

          <h3>Recommended Folder Structure</h3>
          <div class="folder-structure">
<span class="folder">your-repo/</span><br>
├── <span class="folder">docs/</span><br>
│   ├── <span class="folder">getting-started/</span>        <span class="comment">→ Becomes "Getting Started" section</span><br>
│   │   ├── <span class="file">introduction.md</span><br>
│   │   ├── <span class="file">installation.md</span><br>
│   │   └── <span class="file">quick-start.md</span><br>
│   ├── <span class="folder">components/</span>             <span class="comment">→ Becomes "Components" section</span><br>
│   │   ├── <span class="file">button.md</span><br>
│   │   ├── <span class="file">card.md</span><br>
│   │   └── <span class="file">modal.schema.json</span><br>
│   ├── <span class="folder">api/</span>                    <span class="comment">→ Becomes "API" section</span><br>
│   │   ├── <span class="file">methods.md</span><br>
│   │   └── <span class="file">events.md</span><br>
│   └── <span class="file">aloha.json</span>              <span class="comment">→ Optional metadata file</span>
          </div>
        </div>

        <!-- Markdown Best Practices -->
        <div class="guide-section">
          <h2><i class="fas fa-file-alt"></i> Markdown Best Practices</h2>

          <h3>Document Structure</h3>
          <p>Each markdown file should follow this structure for best results:</p>

          <div class="code-example">
            <div class="code-header">
              <span class="code-title">example-component.md</span>
              <span class="code-lang">markdown</span>
            </div>
            <pre><code># Component Name

Brief description of what this component does.

## Installation

\`\`\`bash
npm install your-component
\`\`\`

## Usage

\`\`\`javascript
import { Component } from 'your-framework';

const app = new Component({
  option: 'value'
});
\`\`\`

## Props / Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | string | - | Component name |
| enabled | boolean | true | Enable/disable |

## Examples

### Basic Example
\`\`\`javascript
// Your example code here
\`\`\`

## API Reference

### Methods
- \`method()\` - Description of method

### Events
- \`onEvent\` - When event fires</code></pre>
          </div>

          <h3>Dos and Don'ts</h3>
          <div class="dos-donts">
            <div class="do-card">
              <h4><i class="fas fa-check-circle"></i> Do</h4>
              <ul>
                <li>Use clear, descriptive headings</li>
                <li>Include code examples</li>
                <li>Add tables for options/props</li>
                <li>Use consistent formatting</li>
                <li>Keep files focused on one topic</li>
                <li>Use relative links between docs</li>
              </ul>
            </div>
            <div class="dont-card">
              <h4><i class="fas fa-times-circle"></i> Don't</h4>
              <ul>
                <li>Create deeply nested folders (3+ levels)</li>
                <li>Use special characters in filenames</li>
                <li>Mix multiple topics in one file</li>
                <li>Use absolute URLs for internal links</li>
                <li>Forget to include code examples</li>
                <li>Use inconsistent heading levels</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Schema Files -->
        <div class="guide-section">
          <h2><i class="fas fa-code"></i> Schema Files (.schema.json)</h2>
          <p>
            Schema files provide structured, machine-readable documentation for components and APIs.
            They enable autocomplete, validation, and automated documentation generation.
          </p>

          <h3>Complete Schema Example</h3>
          <p>Here's a comprehensive example showing all available fields:</p>

          <div class="code-example">
            <div class="code-header">
              <span class="code-title">toggle.schema.json</span>
              <span class="code-lang">json</span>
            </div>
            <pre><code>{
  "name": "Toggle",
  "description": "A simple toggle switch component with label support",
  "category": "Form Controls",
  "version": "1.0.0",
  "tags": ["form", "input", "switch", "boolean"],

  "props": {
    "checked": {
      "type": "boolean",
      "default": false,
      "required": false,
      "description": "Whether the toggle is checked"
    },
    "label": {
      "type": "string",
      "default": "",
      "required": false,
      "description": "Label text to display next to toggle"
    },
    "disabled": {
      "type": "boolean",
      "default": false,
      "description": "Disables user interaction"
    },
    "size": {
      "type": "string",
      "enum": ["sm", "md", "lg"],
      "default": "md",
      "description": "Visual size of the toggle"
    }
  },

  "methods": [
    {
      "name": "toggle",
      "description": "Toggles the checked state programmatically",
      "parameters": [],
      "returns": {
        "type": "boolean",
        "description": "The new checked state"
      },
      "example": "toggleInstance.toggle();"
    },
    {
      "name": "setValue",
      "description": "Sets the toggle to a specific state",
      "parameters": [
        {
          "name": "value",
          "type": "boolean",
          "required": true,
          "description": "The state to set"
        }
      ],
      "returns": {
        "type": "void"
      },
      "example": "toggleInstance.setValue(true);"
    }
  ],

  "events": [
    {
      "name": "onChange",
      "description": "Fired when the toggle state changes",
      "parameters": [
        {
          "name": "checked",
          "type": "boolean",
          "description": "The new checked state"
        },
        {
          "name": "event",
          "type": "Event",
          "description": "The DOM event object"
        }
      ],
      "example": "toggle.on('change', (checked, event) => { ... });"
    }
  ],

  "examples": [
    {
      "title": "Basic Toggle",
      "description": "Simple toggle with label",
      "code": "&lt;Toggle label=\\"Enable notifications\\" /&gt;"
    },
    {
      "title": "Controlled Toggle",
      "description": "Toggle with controlled state",
      "code": "&lt;Toggle checked={true} onChange={handleChange} /&gt;"
    },
    {
      "title": "Disabled State",
      "code": "&lt;Toggle disabled={true} label=\\"Unavailable\\" /&gt;"
    }
  ],

  "styling": {
    "cssVariables": [
      {
        "name": "--toggle-bg",
        "default": "#ccc",
        "description": "Background color when unchecked"
      },
      {
        "name": "--toggle-bg-checked",
        "default": "#4CAF50",
        "description": "Background color when checked"
      }
    ],
    "cssClasses": [
      {
        "name": "toggle-container",
        "description": "Main container element"
      },
      {
        "name": "toggle-input",
        "description": "Hidden checkbox input"
      },
      {
        "name": "toggle-slider",
        "description": "Visual slider element"
      }
    ]
  },

  "accessibility": {
    "roles": ["switch"],
    "keyboardSupport": [
      "Space - Toggle state",
      "Enter - Toggle state"
    ],
    "ariaAttributes": [
      "aria-checked",
      "aria-label",
      "aria-disabled"
    ]
  }
}</code></pre>
          </div>

          <h3>Schema Field Reference</h3>
          <div class="dos-donts">
            <div class="do-card">
              <h4><i class="fas fa-info-circle"></i> Core Fields</h4>
              <ul>
                <li><code>name</code> - Component name (required)</li>
                <li><code>description</code> - Brief description</li>
                <li><code>category</code> - Component category</li>
                <li><code>version</code> - Version number</li>
                <li><code>tags</code> - Array of searchable tags</li>
              </ul>
            </div>
            <div class="do-card">
              <h4><i class="fas fa-cogs"></i> Props Object</h4>
              <ul>
                <li><code>type</code> - Data type (string, boolean, number, object, array)</li>
                <li><code>default</code> - Default value</li>
                <li><code>required</code> - Is prop required?</li>
                <li><code>enum</code> - Allowed values</li>
                <li><code>description</code> - Prop description</li>
              </ul>
            </div>
          </div>

          <div class="dos-donts">
            <div class="do-card">
              <h4><i class="fas fa-terminal"></i> Methods Array</h4>
              <ul>
                <li><code>name</code> - Method name</li>
                <li><code>description</code> - What it does</li>
                <li><code>parameters</code> - Array of params</li>
                <li><code>returns</code> - Return type & description</li>
                <li><code>example</code> - Usage example</li>
              </ul>
            </div>
            <div class="do-card">
              <h4><i class="fas fa-bolt"></i> Events Array</h4>
              <ul>
                <li><code>name</code> - Event name</li>
                <li><code>description</code> - When it fires</li>
                <li><code>parameters</code> - Event data passed</li>
                <li><code>example</code> - How to listen</li>
              </ul>
            </div>
          </div>

          <div class="highlight-box">
            <strong>💡 Pro Tip:</strong> Include <code>styling</code> and <code>accessibility</code>
            sections to provide a complete reference for developers using your component!
          </div>
        </div>

        <!-- Optional Configuration -->
        <div class="guide-section">
          <h2><i class="fas fa-cog"></i> Optional: aloha.json Configuration</h2>
          <p>
            Add an <code>aloha.json</code> file to your docs folder to customize how your documentation appears.
          </p>

          <div class="code-example">
            <div class="code-header">
              <span class="code-title">docs/aloha.json</span>
              <span class="code-lang">json</span>
            </div>
            <pre><code>{
  "title": "My Framework",
  "description": "A modern web framework",
  "version": "1.0.0",
  "repository": "https://github.com/owner/repo",
  "sections": [
    {
      "title": "Getting Started",
      "order": 1,
      "items": [
        { "title": "Introduction", "file": "getting-started/introduction.md" },
        { "title": "Installation", "file": "getting-started/installation.md" }
      ]
    },
    {
      "title": "Components",
      "order": 2,
      "items": [
        { "title": "Button", "file": "components/button.md" },
        { "title": "Card", "file": "components/card.md" }
      ]
    }
  ],
  "theme": {
    "primaryColor": "#ff9500",
    "logo": "assets/logo.png"
  }
}</code></pre>
          </div>

          <div class="highlight-box">
            <strong>💡 Pro Tip:</strong> The aloha.json file is optional. If you don't provide it,
            we'll automatically generate navigation based on your folder structure!
          </div>
        </div>

        <!-- File Naming -->
        <div class="guide-section">
          <h2><i class="fas fa-tags"></i> File Naming Conventions</h2>

          <h3>Good File Names</h3>
          <ul>
            <li><code>introduction.md</code> → Displays as "Introduction"</li>
            <li><code>getting-started.md</code> → Displays as "Getting Started"</li>
            <li><code>api-reference.md</code> → Displays as "API Reference"</li>
            <li><code>button-component.md</code> → Displays as "Button Component"</li>
          </ul>

          <h3>Avoid These</h3>
          <ul>
            <li><code>doc1.md</code> ❌ Not descriptive</li>
            <li><code>My Component (NEW!).md</code> ❌ Special characters</li>
            <li><code>component_with_underscores.md</code> ❌ Use hyphens instead</li>
            <li><code>ALLCAPS.md</code> ❌ Use lowercase</li>
          </ul>
        </div>

        <!-- Tips & Tricks -->
        <div class="guide-section">
          <h2><i class="fas fa-lightbulb"></i> Tips & Tricks</h2>

          <div class="dos-donts">
            <div class="do-card">
              <h4><i class="fas fa-star"></i> Best Practices</h4>
              <ul>
                <li>Start with a clear README.md in your docs folder</li>
                <li>Use descriptive folder names that reflect content</li>
                <li>Include a getting-started guide</li>
                <li>Add real-world examples</li>
                <li>Keep documentation up to date with code</li>
                <li>Use screenshots and diagrams where helpful</li>
                <li>Link related documentation together</li>
              </ul>
            </div>
            <div class="do-card">
              <h4><i class="fas fa-bolt"></i> Advanced Features</h4>
              <ul>
                <li>Use frontmatter in markdown for metadata</li>
                <li>Leverage schema files for type documentation</li>
                <li>Create a custom aloha.json for fine control</li>
                <li>Add badges and status indicators</li>
                <li>Include changelog or version history</li>
                <li>Use mermaid diagrams for visualizations</li>
              </ul>
            </div>
          </div>

          <div class="highlight-box">
            <strong>🚀 Quick Start:</strong> Don't overthink it! Start with a simple <code>docs/</code>
            folder containing markdown files. You can always refine and organize later.
          </div>
        </div>

        <!-- Example Repository -->
        <div class="guide-section">
          <h2><i class="fas fa-code-branch"></i> Example Repository</h2>
          <p>
            Want to see a complete example? Check out our sample documentation repository that follows
            all these best practices.
          </p>

          <div style="text-align: center; margin-top: 2rem;">
            <a href="https://github.com/Sidcom-AB/aloha-docs-example"
               target="_blank"
               class="hero-cta">
              <i class="fab fa-github"></i>
              <span>View Example Repository</span>
            </a>
          </div>
        </div>
      </div>
    `;
  },

  async init() {
    // No special initialization needed
  },

  cleanup() {
    // No cleanup needed
  }
};
