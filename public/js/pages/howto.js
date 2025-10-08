// How To Page Module - Redirects to Aloha Docs own documentation
export default {
  render() {
    return `
      <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1>📘 Aloha Docs - Documentation</h1>
          <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">
            Learn how to structure your documentation for auto-discovery and MCP integration
          </p>

          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button class="hero-cta" id="downloadAlohaStandard">
              <i class="fas fa-download"></i>
              Download Aloha Standard
            </button>
            <button class="hero-cta" onclick="window.open('https://github.com/Sidcom-AB/aloha-docs', '_blank')" style="background: transparent; border: 2px solid var(--color-accent);">
              <i class="fab fa-github"></i>
              View on GitHub
            </button>
          </div>

          <div style="margin-top: 1.5rem; padding: 1.5rem; background: rgba(255, 149, 0, 0.1); border-left: 4px solid var(--color-accent); border-radius: 8px; max-width: 800px; margin-left: auto; margin-right: auto;">
            <strong style="color: var(--color-accent); font-size: 1.1rem;">🤖 AI-Powered Workflow</strong>
            <ol style="margin: 0.75rem 0 0 1.5rem; text-align: left; color: var(--color-text-light); line-height: 1.8;">
              <li><strong>Download</strong> <code>aloha-standard.md</code> above</li>
              <li><strong>Configure</strong> Aloha MCP server in Claude Desktop</li>
              <li><strong>Ask Claude:</strong> "Read aloha-standard.md and convert my docs to Aloha format"</li>
              <li><strong>Push</strong> your restructured docs to GitHub</li>
              <li><strong>Add</strong> your repo here via the Add Framework page</li>
              <li><strong>Done!</strong> Your docs are now accessible via MCP 🎉</li>
            </ol>
          </div>
        </div>

        <!-- Info Box -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-dark); border-radius: 12px; padding: 2rem; text-align: center; margin-top: 2rem;">
          <h2 style="color: var(--color-accent); margin-bottom: 1rem;">
            <i class="fas fa-info-circle"></i> View Full Documentation
          </h2>
          <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">
            To read the complete Aloha Docs documentation with navigation, <br>
            add this repository to the marketplace and view it in the framework viewer.
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button class="hero-cta" onclick="window.navigateTo('add')">
              <i class="fas fa-plus-circle"></i>
              Add Aloha Docs Repository
            </button>
            <button class="hero-cta" onclick="window.open('/aloha-docs', '_blank')" style="background: transparent; border: 2px solid var(--color-accent);">
              <i class="fas fa-external-link-alt"></i>
              Open Docs (if already added)
            </button>
          </div>
          <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--color-text-muted);">
            URL: <code>https://github.com/Sidcom-AB/aloha-docs</code>
          </p>
        </div>

        <!-- Quick Links Grid -->
        <div style="margin-top: 3rem;">
          <h2 style="text-align: center; margin-bottom: 2rem; color: var(--color-text-light);">
            Quick Links
          </h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
            <div style="background: var(--bg-card); border: 1px solid var(--border-dark); border-radius: 12px; padding: 1.5rem;">
              <h3 style="color: var(--color-accent); margin-bottom: 0.5rem;">
                <i class="fas fa-rocket"></i> Quick Start
              </h3>
              <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                Get started in 5 minutes
              </p>
              <p style="color: var(--color-text-light); font-size: 0.85rem;">
                Install, configure, and add your first framework
              </p>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border-dark); border-radius: 12px; padding: 1.5rem;">
              <h3 style="color: var(--color-accent); margin-bottom: 0.5rem;">
                <i class="fas fa-book"></i> Documentation Guide
              </h3>
              <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                Learn the Aloha standard
              </p>
              <p style="color: var(--color-text-light); font-size: 0.85rem;">
                Folder structure, markdown best practices, and conventions
              </p>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border-dark); border-radius: 12px; padding: 1.5rem;">
              <h3 style="color: var(--color-accent); margin-bottom: 0.5rem;">
                <i class="fas fa-robot"></i> MCP Setup
              </h3>
              <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                Connect AI assistants
              </p>
              <p style="color: var(--color-text-light); font-size: 0.85rem;">
                Configure Claude Desktop and use MCP with your docs
              </p>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border-dark); border-radius: 12px; padding: 1.5rem;">
              <h3 style="color: var(--color-accent); margin-bottom: 0.5rem;">
                <i class="fas fa-exchange-alt"></i> Migration Guide
              </h3>
              <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                Convert existing docs
              </p>
              <p style="color: var(--color-text-light); font-size: 0.85rem;">
                Use AI to migrate from README, Docusaurus, or other formats
              </p>
            </div>
          </div>
        </div>

        <!-- MCP Code Example -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-dark); border-radius: 12px; padding: 2rem; margin-top: 3rem;">
          <h2 style="color: var(--color-accent); margin-bottom: 1rem;">
            <i class="fas fa-terminal"></i> MCP Configuration
          </h2>
          <p style="color: var(--color-text-muted); margin-bottom: 1rem;">
            Add to your Claude Desktop config to access all frameworks via MCP:
          </p>
          <pre style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; overflow-x: auto; border: 1px solid var(--border-dark);"><code style="color: var(--color-text-light); font-family: var(--font-mono); font-size: 0.85rem;">{
  "mcpServers": {
    "aloha-docs": {
      "command": "node",
      "args": ["/absolute/path/to/aloha-docs/server/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here",
        "PORT": "3000"
      }
    }
  }
}</code></pre>
          <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--color-text-muted);">
            <strong>Config location:</strong><br>
            macOS: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code><br>
            Windows: <code>%APPDATA%\\Claude\\claude_desktop_config.json</code>
          </p>
        </div>
      </div>
    `;
  },

  async init() {
    const downloadBtn = document.getElementById('downloadAlohaStandard');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadAlohaStandard());
    }
  },

  async downloadAlohaStandard() {
    try {
      const response = await fetch('/aloha-standard.md');
      const content = await response.text();

      const blob = new Blob([content], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aloha-standard.md';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to download file. Please try again.');
    }
  },

  cleanup() {
    // No cleanup needed
  }
};
