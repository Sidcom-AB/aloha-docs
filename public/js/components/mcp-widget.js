// Reusable MCP Configuration Widget - now using the new install guide component
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

  render() {
    // Load the mcp-install-guide web component script if not already loaded
    if (!customElements.get('mcp-install-guide')) {
      const script = document.createElement('script');
      script.src = '/js/mcp-install-guide.js?v=' + Date.now();
      script.type = 'module';
      document.head.appendChild(script);
    }

    if (this.compact) {
      // Compact mode - show button that opens modal with install guide
      this.container.innerHTML = `
        <div class="mcp-widget-compact">
          <button class="mcp-add-button" id="${this.container.id}-add">
            <i class="fas fa-robot"></i>
            <span>Add to AI Assistant</span>
          </button>
          <div class="mcp-config-modal" id="${this.container.id}-modal" style="display: none;">
            <div class="mcp-config-modal-backdrop"></div>
            <div class="mcp-config-modal-content">
              <div class="mcp-config-modal-header">
                <h3>
                  <i class="fas fa-robot"></i>
                  ${this.repositoryId ? `Add ${this.repositoryName} MCP` : 'Add Aloha Docs MCP'}
                </h3>
                <button class="mcp-config-modal-close" id="${this.container.id}-close">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="mcp-config-modal-body">
                <mcp-install-guide
                  framework-id="${this.repositoryId || 'aloha-docs'}"
                  framework-name="${this.repositoryName}"
                  server-url="${this.baseUrl}"
                  ${!this.repositoryId ? 'root-context' : ''}
                ></mcp-install-guide>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Full mode - show install guide inline
      this.container.innerHTML = `
        <mcp-install-guide
          framework-id="${this.repositoryId || 'aloha-docs'}"
          framework-name="${this.repositoryName}"
          server-url="${this.baseUrl}"
          ${!this.repositoryId ? 'root-context' : ''}
        ></mcp-install-guide>
      `;
    }

    // Add styles if not already added
    if (!document.getElementById('mcp-widget-styles')) {
      this.addStyles();
    }

    // Attach event listeners for compact mode
    if (this.compact) {
      this.attachEventListeners();
    }
  }

  addStyles() {
    const style = document.createElement('style');
    style.id = 'mcp-widget-styles';
    style.textContent = `
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

      /* Modal - FIXED positioning for better visibility */
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
        padding: 1rem;
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
        max-width: 700px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
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
        position: sticky;
        top: 0;
        background: rgba(30, 33, 57, 0.98);
        backdrop-filter: blur(10px);
        z-index: 1;
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
        flex-shrink: 0;
      }

      .mcp-config-modal-close:hover {
        color: var(--color-text-light);
      }

      .mcp-config-modal-body {
        padding: 1.5rem;
      }

      /* Scrollbar for modal */
      .mcp-config-modal-content::-webkit-scrollbar {
        width: 10px;
      }

      .mcp-config-modal-content::-webkit-scrollbar-track {
        background: rgba(10, 14, 39, 0.5);
        border-radius: 10px;
      }

      .mcp-config-modal-content::-webkit-scrollbar-thumb {
        background: rgba(255, 149, 0, 0.3);
        border-radius: 10px;
      }

      .mcp-config-modal-content::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 149, 0, 0.5);
      }

      /* Override install guide styles when in modal */
      .mcp-config-modal-body .install-guide {
        margin: 0;
        background: transparent;
        border: none;
        padding: 0;
      }
    `;
    document.head.appendChild(style);
  }

  attachEventListeners() {
    // Wait for DOM to be ready
    setTimeout(() => {
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
    }, 100);
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
