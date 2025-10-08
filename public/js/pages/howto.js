// How To Page Module
export default {
  render() {
    return `
      <div class="howto-page">
        <div class="howto-header">
          <h1>🚀 Get Started</h1>
          <p>Connect your AI assistant to Aloha Docs</p>
        </div>

        <!-- MCP Installation Widget -->
        <div class="container" style="max-width: 900px; margin: 0 auto;">
          <div id="howtoMcpWidget"></div>
        </div>

        <!-- Want to publish section -->
        <div class="guide-section" style="max-width: 900px; margin: 3rem auto;">
          <h2>
            <i class="fas fa-upload"></i>
            Want to publish your own documentation?
          </h2>
          <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">
            Aloha Docs makes it easy to publish your framework's documentation and make it accessible via MCP.
            Learn about the required structure, markdown best practices, and how to get your docs indexed.
          </p>
          <a href="/aloha-docs" class="hero-cta" style="display: inline-flex;">
            <i class="fas fa-book-open"></i>
            <span>Learn More</span>
          </a>
        </div>
      </div>
    `;
  },

  async init() {
    // Initialize MCP widget
    const { MCPWidget } = await import('/js/components/mcp-widget.js?v=' + Date.now());
    this.mcpWidget = new MCPWidget('howtoMcpWidget', {
      repositoryId: null, // All repositories
      compact: false
    });
  },

  cleanup() {
    // Cleanup if needed
  }
};
