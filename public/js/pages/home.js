// Home Page Module
export default {
  render() {
    return `
      <div class="hero">
        <h1>Aloha Docs</h1>
        <p>Discover and explore documentation for modern web frameworks</p>
      </div>

      <div class="search-container">
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="Search frameworks and documentation...">
          <i class="fas fa-search search-icon" id="searchIcon"></i>
        </div>
      </div>

      <div class="container">
        <div class="section-header">
          <h2>Featured Frameworks</h2>
        </div>

        <div class="frameworks-grid" id="frameworksGrid">
          <div class="loading"></div>
        </div>
      </div>
    `;
  },

  async init() {
    // Clear search input when coming back to home
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
    }

    // Setup event listeners
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.performSearch();
    });

    document.getElementById('searchIcon')?.addEventListener('click', () => {
      this.performSearch();
    });

    // Load frameworks
    await this.loadFrameworks();
  },

  async loadFrameworks() {
    try {
      const response = await fetch('/api/repositories');
      const frameworks = await response.json();
      this.renderFrameworks(frameworks);
    } catch (error) {
      console.error('Failed to load frameworks:', error);
      document.getElementById('frameworksGrid').innerHTML =
        '<div class="empty-state"><h3>No frameworks yet</h3><p>Be the first to add a framework!</p></div>';
    }
  },

  renderFrameworks(frameworks) {
    const grid = document.getElementById('frameworksGrid');

    if (frameworks.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No frameworks yet</h3>
          <p>Be the first to add a framework to the marketplace!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = frameworks.map(framework => `
      <div class="framework-card" onclick="window.openFramework('${framework.id}')">
        ${framework.validated ? '<div class="status-badge validated">Verified</div>' :
          '<div class="status-badge pending">Pending</div>'}

        <div class="framework-header">
          <div class="framework-icon">📚</div>
          <div class="framework-info">
            <div class="framework-name">${framework.name}</div>
            <div class="framework-url">${this.extractRepoName(framework.url)}</div>
          </div>
        </div>

        <div class="framework-description">
          ${framework.description || 'Framework documentation and component library'}
        </div>

        <div class="framework-stats">
          <div class="stat">
            <span class="stat-icon">📄</span>
            <span>Docs</span>
          </div>
          <div class="stat">
            <span class="stat-icon">🧩</span>
            <span>Components</span>
          </div>
          ${framework.children && framework.children.length > 0 ?
            `<div class="stat">
              <span class="stat-icon">🔗</span>
              <span>${framework.children.length} Sub-frameworks</span>
            </div>` : ''}
        </div>
      </div>
    `).join('');
  },

  extractRepoName(url) {
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : url;
  },

  performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    // Navigate to browse page with search query
    window.navigateTo('browse', { search: query });
  },

  cleanup() {
    // Cleanup if needed
  }
};
