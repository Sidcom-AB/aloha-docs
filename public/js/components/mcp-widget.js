// Reusable MCP Configuration Widget
export class MCPWidget {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.repositoryId = options.repositoryId || null;
    this.repositoryName = options.repositoryName || 'Aloha Docs';
    this.baseUrl = options.baseUrl || window.location.origin;
    this.compact = options.compact || false;

    if (!this.container) {
      console.error('MCPWidget: Container not found');
      return;
    }

    this.render();
  }

  getSseUrl() {
    if (this.repositoryId) {
      return `${this.baseUrl}/${this.repositoryId}/sse`;
    }
    return `${this.baseUrl}/sse`;
  }

  getServerName() {
    if (this.repositoryId) {
      return `aloha-docs-${this.repositoryId}`;
    }
    return 'aloha-docs';
  }

  getDescription() {
    if (this.repositoryId) {
      return `MCP server for ${this.repositoryName} documentation`;
    }
    return 'MCP server for all Aloha documentation frameworks';
  }

  getConfig() {
    return {
      "mcpServers": {
        [this.getServerName()]: {
          "command": "npx",
          "args": ["-y", "mcp-remote", this.getSseUrl()]
        }
      }
    };
  }

  render() {
    const config = this.getConfig();
    const configJson = JSON.stringify(config, null, 2);

    if (this.compact) {
      this.container.innerHTML = `
        <div class="mcp-widget-compact">
          <button class="mcp-add-button" id="${this.container.id}-add">
            <i class="fas fa-robot"></i>
            <span>Add to Claude Desktop</span>
          </button>
          <div class="mcp-config-modal" id="${this.container.id}-modal" style="display: none;">
            <div class="mcp-config-modal-backdrop"></div>
            <div class="mcp-config-modal-content">
              <div class="mcp-config-modal-header">
                <h3>
                  <i class="fas fa-robot"></i>
                  ${this.repositoryId ? `Add ${this.repositoryName} to Claude` : 'Add to Claude Desktop'}
                </h3>
                <button class="mcp-config-modal-close" id="${this.container.id}-close">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="mcp-config-modal-body">
                <p style="margin-bottom: 1rem; color: var(--color-text-muted); font-size: 0.9rem;">
                  ${this.getDescription()}. Add this configuration to your <code>claude_desktop_config.json</code>:
                </p>
                <div class="mcp-config-code">
                  <button class="mcp-copy-button" id="${this.container.id}-copy">
                    <i class="fas fa-copy"></i> Copy
                  </button>
                  <pre><code>${this.escapeHtml(configJson)}</code></pre>
                </div>
                <p style="margin-top: 1rem; font-size: 0.85rem; color: var(--color-text-muted); text-align: center;">
                  <a href="#howto" style="color: var(--color-accent);">Full setup guide</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      this.container.innerHTML = `
        <div class="mcp-widget">
          <div class="mcp-widget-header">
            <div class="mcp-widget-icon">🤖</div>
            <div class="mcp-widget-title">
              <strong>${this.repositoryId ? `Connect ${this.repositoryName} with AI` : 'Connect with AI Assistants via MCP'}</strong>
              <p>${this.repositoryId ? 'Add this documentation to Claude Desktop' : 'Add to Claude Desktop in one line - no API keys needed!'}</p>
            </div>
          </div>
          <div class="mcp-config-code">
            <button class="mcp-copy-button" id="${this.container.id}-copy">
              <i class="fas fa-copy"></i> Copy
            </button>
            <pre><code>${this.escapeHtml(configJson)}</code></pre>
          </div>
          <p class="mcp-widget-footer">
            Add to <code>claude_desktop_config.json</code> •
            <a href="#howto">Full setup guide</a>
          </p>
        </div>
      `;
    }

    // Add styles if not already added
    if (!document.getElementById('mcp-widget-styles')) {
      this.addStyles();
    }

    // Attach event listeners
    this.attachEventListeners();
  }

  addStyles() {
    const style = document.createElement('style');
    style.id = 'mcp-widget-styles';
    style.textContent = `
      /* Full Widget */
      .mcp-widget {
        margin: 2rem auto;
        padding: 1.5rem;
        background: rgba(255, 149, 0, 0.1);
        border: 2px solid var(--color-accent);
        border-radius: 12px;
      }

      .mcp-widget-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .mcp-widget-icon {
        font-size: 2rem;
        line-height: 1;
      }

      .mcp-widget-title {
        flex: 1;
      }

      .mcp-widget-title strong {
        color: var(--color-accent);
        font-size: 1.1rem;
        display: block;
      }

      .mcp-widget-title p {
        margin: 0.25rem 0 0 0;
        font-size: 0.9rem;
        color: var(--color-text-muted);
      }

      .mcp-config-code {
        background: var(--bg-secondary);
        padding: 1rem;
        border-radius: 8px;
        font-family: var(--font-mono);
        font-size: 0.85rem;
        position: relative;
        border: 1px solid var(--border-dark);
      }

      .mcp-config-code pre {
        margin: 0;
        overflow-x: auto;
        padding-right: 5rem;
      }

      .mcp-config-code code {
        color: var(--color-text-light);
        display: block;
        white-space: pre;
        text-align: left;
      }

      .mcp-copy-button {
        position: absolute;
        right: 0.5rem;
        top: 0.5rem;
        background: var(--color-accent);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .mcp-copy-button:hover {
        background: var(--color-accent-hover);
        transform: translateY(-1px);
      }

      .mcp-copy-button:active {
        transform: translateY(0);
      }

      .mcp-widget-footer {
        margin-top: 0.75rem;
        font-size: 0.85rem;
        color: var(--color-text-muted);
        text-align: center;
      }

      .mcp-widget-footer a {
        color: var(--color-accent);
        text-decoration: none;
      }

      .mcp-widget-footer a:hover {
        text-decoration: underline;
      }

      /* Compact Widget */
      .mcp-widget-compact {
        position: relative;
      }

      .mcp-add-button {
        background: var(--color-accent);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 500;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .mcp-add-button:hover {
        background: var(--color-accent-hover);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
      }

      .mcp-add-button:active {
        transform: translateY(0);
      }

      .mcp-add-button i {
        font-size: 1.1rem;
      }

      /* Modal */
      .mcp-config-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
      }

      .mcp-config-modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
      }

      .mcp-config-modal-content {
        position: relative;
        background: rgba(30, 33, 57, 0.98);
        backdrop-filter: blur(10px);
        border: 1px solid var(--border-dark);
        border-radius: 12px;
        max-width: 600px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: modalSlideIn 0.3s ease-out;
      }

      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .mcp-config-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-dark);
      }

      .mcp-config-modal-header h3 {
        margin: 0;
        color: var(--color-text-light);
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .mcp-config-modal-header i {
        color: var(--color-accent);
      }

      .mcp-config-modal-close {
        background: transparent;
        border: none;
        color: var(--color-text-muted);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        line-height: 1;
        transition: color 0.2s;
      }

      .mcp-config-modal-close:hover {
        color: var(--color-text-light);
      }

      .mcp-config-modal-body {
        padding: 1.5rem;
      }

      /* Scrollbar for modal code */
      .mcp-config-modal .mcp-config-code pre {
        max-height: 300px;
        overflow-y: auto;
      }

      .mcp-config-modal .mcp-config-code pre::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .mcp-config-modal .mcp-config-code pre::-webkit-scrollbar-track {
        background: rgba(10, 14, 39, 0.5);
        border-radius: 4px;
      }

      .mcp-config-modal .mcp-config-code pre::-webkit-scrollbar-thumb {
        background: rgba(255, 149, 0, 0.3);
        border-radius: 4px;
      }

      .mcp-config-modal .mcp-config-code pre::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 149, 0, 0.5);
      }
    `;
    document.head.appendChild(style);
  }

  attachEventListeners() {
    // Copy button
    const copyButton = document.getElementById(`${this.container.id}-copy`);
    if (copyButton) {
      copyButton.addEventListener('click', () => {
        const config = JSON.stringify(this.getConfig(), null, 2);
        navigator.clipboard.writeText(config).then(() => {
          copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
          setTimeout(() => {
            copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy';
          }, 2000);
        });
      });
    }

    // Modal controls (for compact mode)
    if (this.compact) {
      const addButton = document.getElementById(`${this.container.id}-add`);
      const modal = document.getElementById(`${this.container.id}-modal`);
      const closeButton = document.getElementById(`${this.container.id}-close`);

      if (addButton && modal) {
        addButton.addEventListener('click', () => {
          modal.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        });
      }

      const closeModal = () => {
        if (modal) {
          modal.style.display = 'none';
          document.body.style.overflow = '';
        }
      };

      if (closeButton) {
        closeButton.addEventListener('click', closeModal);
      }

      if (modal) {
        // Close on backdrop click
        modal.querySelector('.mcp-config-modal-backdrop')?.addEventListener('click', closeModal);

        // Close on escape key
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
          }
        });
      }
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
