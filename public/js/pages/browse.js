// Browse Page Module
export default {
  frameworks: [],
  filteredFrameworks: [],
  currentPage: 1,
  itemsPerPage: 10,

  render() {
    return `
      <div class="browse-page">
        <div class="browse-header">
          <h1>Browse Frameworks</h1>
          <p>Explore all available framework documentation</p>
        </div>

        <div class="browse-search">
          <div class="search-box">
            <input type="text" id="browseSearch" placeholder="Search all frameworks...">
            <i class="fas fa-search search-icon" id="browseSearchIcon"></i>
          </div>
        </div>

        <div id="frameworksTable"></div>
        <div id="pagination"></div>
      </div>
    `;
  },

  async init(params = {}) {
    // Set search query if provided
    const searchInput = document.getElementById('browseSearch');
    if (params.search && searchInput) {
      searchInput.value = params.search;
    }

    // Setup search
    document.getElementById('browseSearch')?.addEventListener('input', (e) => {
      this.filterFrameworks(e.target.value);
    });

    document.getElementById('browseSearchIcon')?.addEventListener('click', () => {
      const query = document.getElementById('browseSearch').value;
      this.filterFrameworks(query);
    });

    // Load and display frameworks
    await this.loadFrameworks();

    // Apply search filter if query was provided
    if (params.search) {
      this.filterFrameworks(params.search);
    }
  },

  async loadFrameworks() {
    try {
      const response = await fetch('/api/repositories');
      this.frameworks = await response.json();
      this.filteredFrameworks = [...this.frameworks];
      this.currentPage = 1;
      this.renderTable();
    } catch (error) {
      console.error('Failed to load frameworks:', error);
      document.getElementById('frameworksTable').innerHTML =
        '<div class="empty-state"><h3>Failed to load frameworks</h3></div>';
    }
  },

  filterFrameworks(query) {
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
      this.filteredFrameworks = [...this.frameworks];
    } else {
      this.filteredFrameworks = this.frameworks.filter(f =>
        f.name.toLowerCase().includes(searchTerm) ||
        f.description?.toLowerCase().includes(searchTerm) ||
        this.extractRepoName(f.url).toLowerCase().includes(searchTerm)
      );
    }

    this.currentPage = 1;
    this.renderTable();
  },

  renderTable() {
    const container = document.getElementById('frameworksTable');
    if (!container) return;

    if (this.filteredFrameworks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No frameworks found</h3>
          <p>Try adjusting your search query</p>
        </div>
      `;
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(this.filteredFrameworks.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageFrameworks = this.filteredFrameworks.slice(startIndex, endIndex);

    // Render table
    container.innerHTML = `
      <table class="frameworks-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Repository</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${pageFrameworks.map(f => `
            <tr>
              <td><strong>${f.name}</strong></td>
              <td><code>${this.extractRepoName(f.url)}</code></td>
              <td>${f.description || 'Framework documentation'}</td>
              <td>${f.validated ? '<span class="status-badge validated">✅ Verified</span>' : '<span class="status-badge pending">⏳ Pending</span>'}</td>
              <td>
                <button class="grid-action-btn" onclick="window.openFramework('${f.id}')">
                  <i class="fas fa-eye"></i> View
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    this.renderPagination(totalPages);
  },

  renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    paginationContainer.innerHTML = `
      <div class="pagination">
        <div class="pagination-info">
          Showing ${(this.currentPage - 1) * this.itemsPerPage + 1}-${Math.min(this.currentPage * this.itemsPerPage, this.filteredFrameworks.length)} of ${this.filteredFrameworks.length}
        </div>
        <div class="pagination-buttons">
          <button
            class="pagination-btn"
            ${this.currentPage === 1 ? 'disabled' : ''}
            onclick="window.browsePage?.goToPage(${this.currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Previous
          </button>
          ${pages.map(page => `
            <button
              class="pagination-btn ${page === this.currentPage ? 'active' : ''}"
              onclick="window.browsePage?.goToPage(${page})">
              ${page}
            </button>
          `).join('')}
          <button
            class="pagination-btn"
            ${this.currentPage === totalPages ? 'disabled' : ''}
            onclick="window.browsePage?.goToPage(${this.currentPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
  },

  goToPage(page) {
    this.currentPage = page;
    this.renderTable();
    // Scroll to top of table
    document.getElementById('frameworksTable')?.scrollIntoView({ behavior: 'smooth' });
  },

  extractRepoName(url) {
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : url;
  },

  cleanup() {
    // Remove global reference
    if (window.browsePage === this) {
      window.browsePage = null;
    }
  }
};
