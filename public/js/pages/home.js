// Home Page Module
export default {
  render() {
    return `
      <div class="hero">
        <h1>Aloha Docs</h1>
        <p>Discover and explore documentation for modern web frameworks</p>
      </div>

      <div class="search-container">
        <div id="homeSearch"></div>
      </div>

      <div class="container" style="max-width: 800px;">
        <!-- MCP Quick Add Widget -->
        <div id="homeMcpWidget"></div>
      </div>
    `;
  },

  async init() {
    // Initialize search component
    const { DocSearch } = await import('/js/components/doc-search.js');
    this.docSearch = new DocSearch('homeSearch', {
      repositoryId: null, // Search all repositories
      placeholder: 'Search frameworks and documentation...',
      limit: 20,
      onResultClick: (result) => {
        // Navigate to the document
        window.location.href = `/${result.repositoryId}/${result.file.replace('.md', '')}`;
      }
    });

    // Initialize MCP widget
    const { MCPWidget } = await import('/js/components/mcp-widget.js');
    this.mcpWidget = new MCPWidget('homeMcpWidget', {
      repositoryId: null, // All repositories
      compact: false
    });
  },


  cleanup() {
    // Cleanup if needed
  }
};
