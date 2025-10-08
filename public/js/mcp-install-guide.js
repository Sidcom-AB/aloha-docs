/**
 * MCP Installation Guide Web Component
 *
 * Usage:
 * <mcp-install-guide
 *   framework-id="webawesome-docs"
 *   framework-name="Webawesome"
 * ></mcp-install-guide>
 *
 * Or for root MCP context:
 * <mcp-install-guide
 *   framework-name="Aloha Docs"
 *   root-context
 * ></mcp-install-guide>
 *
 * Optional server-url attribute (defaults to window.location.origin):
 * server-url="https://your-server.com"
 */
class MCPInstallGuide extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.templates = [];
    this.selectedTemplate = null;
  }

  async connectedCallback() {
    await Promise.all([
      this.loadConfig(),
      this.loadTemplates()
    ]);
    this.render();
  }

  async loadConfig() {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      this.serverHost = data.host;
    } catch (error) {
      console.error('Failed to load config:', error);
      // Fallback to window.location.origin
      this.serverHost = window.location.origin;
    }
  }

  async loadTemplates() {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      this.templates = data.templates || [];

      // Auto-select first template
      if (this.templates.length > 0) {
        this.selectedTemplate = this.templates[0].id;
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      this.templates = [];
    }
  }

  async loadTemplateContent(templateId) {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Failed to load template:', error);
      return null;
    }
  }

  replaceVariables(content) {
    const frameworkId = this.getAttribute('framework-id') || 'aloha-docs';
    const frameworkName = this.getAttribute('framework-name') || 'Aloha Docs';
    const serverUrl = this.getAttribute('server-url') || this.serverHost || window.location.origin;
    const isRootContext = this.hasAttribute('root-context');

    // Determine URL and context-specific features
    const url = isRootContext
      ? `${serverUrl}/sse`
      : `${serverUrl}/${frameworkId}/sse`;

    const contextSpecific = isRootContext
      ? 'Search across all available documentation frameworks'
      : `Scoped to ${frameworkName} documentation only`;

    return content
      .replace(/\{\{url\}\}/g, url)
      .replace(/\{\{name\}\}/g, frameworkName)
      .replace(/\{\{id\}\}/g, frameworkId)
      .replace(/\{\{contextSpecific\}\}/g, contextSpecific);
  }

  async renderTemplateContent() {
    if (!this.selectedTemplate) {
      return '<p>No template selected</p>';
    }

    const content = await this.loadTemplateContent(this.selectedTemplate);
    if (!content) {
      return '<p>Failed to load template</p>';
    }

    const replacedContent = this.replaceVariables(content);

    // Convert markdown to HTML (simple conversion)
    return this.markdownToHtml(replacedContent);
  }

  markdownToHtml(markdown) {
    // Simple markdown to HTML conversion
    let html = markdown;

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Lists
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up
    html = html.replace(/<p><h/g, '<h');
    html = html.replace(/<\/h(\d)><\/p>/g, '</h$1>');
    html = html.replace(/<p><pre>/g, '<pre>');
    html = html.replace(/<\/pre><\/p>/g, '</pre>');
    html = html.replace(/<p><ul>/g, '<ul>');
    html = html.replace(/<\/ul><\/p>/g, '</ul>');
    html = html.replace(/<p><\/p>/g, '');

    return html;
  }

  async render() {
    const frameworkName = this.getAttribute('framework-name') || 'Aloha Docs';
    const isRootContext = this.hasAttribute('root-context');
    const contextLabel = isRootContext ? 'All Frameworks' : frameworkName;

    const templateContent = await this.renderTemplateContent();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .install-guide {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 149, 0, 0.2);
          border-radius: 12px;
          padding: 2rem;
          margin: 1rem 0;
        }

        .guide-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 149, 0, 0.2);
        }

        .guide-header h2 {
          margin: 0 0 0.5rem 0;
          color: #FF9500;
          font-size: 1.5rem;
        }

        .context-badge {
          display: inline-block;
          background: rgba(255, 149, 0, 0.2);
          color: #FF9500;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .template-selector {
          margin-bottom: 1.5rem;
        }

        .template-selector label {
          display: block;
          color: #ddd;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        select {
          width: 100%;
          max-width: 400px;
          padding: 0.75rem;
          background: rgba(10, 10, 10, 0.5);
          border: 1px solid rgba(255, 149, 0, 0.3);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        select:hover {
          border-color: rgba(255, 149, 0, 0.5);
          background: rgba(10, 10, 10, 0.7);
        }

        select:focus {
          outline: none;
          border-color: #FF9500;
          box-shadow: 0 0 0 2px rgba(255, 149, 0, 0.2);
        }

        .template-content {
          color: #ddd;
          line-height: 1.6;
        }

        .template-content h1 {
          color: #FF9500;
          font-size: 1.75rem;
          margin: 1.5rem 0 1rem 0;
        }

        .template-content h2 {
          color: #FFA500;
          font-size: 1.35rem;
          margin: 1.25rem 0 0.75rem 0;
        }

        .template-content h3 {
          color: #FFB020;
          font-size: 1.1rem;
          margin: 1rem 0 0.5rem 0;
        }

        .template-content pre {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 149, 0, 0.2);
          border-radius: 8px;
          padding: 1rem;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .template-content code {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9rem;
          color: #FFA500;
        }

        .template-content pre code {
          color: #ddd;
        }

        .template-content ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .template-content li {
          margin: 0.5rem 0;
        }

        .template-content a {
          color: #FF9500;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }

        .template-content a:hover {
          border-bottom-color: #FF9500;
        }

        .template-content strong {
          color: #fff;
          font-weight: 600;
        }

        .template-content p {
          margin: 0.75rem 0;
        }

        .copy-button {
          background: rgba(255, 149, 0, 0.2);
          border: 1px solid rgba(255, 149, 0, 0.3);
          color: #FF9500;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }

        .copy-button:hover {
          background: rgba(255, 149, 0, 0.3);
          border-color: #FF9500;
        }
      </style>

      <div class="install-guide">
        <div class="guide-header">
          <h2>🔌 MCP Installation Guide</h2>
        </div>

        <div class="template-selector">
          <label for="template-select">Select AI Application:</label>
          <select id="template-select">
            ${this.templates.map(t => `
              <option value="${t.id}" ${t.id === this.selectedTemplate ? 'selected' : ''}>
                ${t.name}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="template-content" id="template-content">
          ${templateContent}
        </div>
      </div>
    `;

    // Add event listener for template selection
    const select = this.shadowRoot.getElementById('template-select');
    if (select) {
      select.addEventListener('change', async (e) => {
        this.selectedTemplate = e.target.value;
        const contentDiv = this.shadowRoot.getElementById('template-content');
        if (contentDiv) {
          contentDiv.innerHTML = await this.renderTemplateContent();
        }
      });
    }
  }
}

customElements.define('mcp-install-guide', MCPInstallGuide);
