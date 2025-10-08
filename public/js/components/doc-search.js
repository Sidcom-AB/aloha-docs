// Reusable Documentation Search Component
export class DocSearch {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.repositoryId = options.repositoryId || null;
    this.placeholder = options.placeholder || 'Search documentation...';
    this.limit = options.limit || 10;
    this.onResultClick = options.onResultClick || this.defaultResultClick.bind(this);

    this.searchInput = null;
    this.searchResults = null;

    this.init();
  }

  init() {
    if (!this.container) {
      console.error('DocSearch: Container not found');
      return;
    }

    // Create search UI
    this.container.innerHTML = `
      <div class="doc-search-wrapper">
        <div class="doc-search-input-wrapper">
          <input
            type="text"
            class="doc-search-input"
            placeholder="${this.placeholder}"
            autocomplete="off"
          >
          <i class="fas fa-search doc-search-icon"></i>
        </div>
        <div class="doc-search-results"></div>
      </div>
    `;

    // Add styles if not already added
    if (!document.getElementById('doc-search-styles')) {
      this.addStyles();
    }

    // Get elements
    this.searchInput = this.container.querySelector('.doc-search-input');
    this.searchResults = this.container.querySelector('.doc-search-results');

    // Attach event listeners
    this.attachEventListeners();
  }

  addStyles() {
    const style = document.createElement('style');
    style.id = 'doc-search-styles';
    style.textContent = `
      .doc-search-wrapper {
        position: relative;
        width: 100%;
      }

      .doc-search-input-wrapper {
        position: relative;
        width: 100%;
      }

      .doc-search-input {
        width: 100%;
        padding: 0.75rem 1rem;
        padding-right: 2.5rem;
        background: rgba(30, 33, 57, 0.8);
        border: 1px solid var(--border-dark);
        border-radius: 8px;
        color: var(--color-text-light);
        font-size: 0.9rem;
        transition: all 0.2s;
        outline: none;
      }

      .doc-search-input:focus {
        border-color: var(--color-accent);
        background: rgba(30, 33, 57, 0.95);
      }

      .doc-search-input::placeholder {
        color: #8892b0;
      }

      .doc-search-icon {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #8892b0;
        pointer-events: none;
      }

      .doc-search-results {
        display: none;
        position: absolute;
        top: calc(100% + 0.5rem);
        left: 0;
        right: 0;
        background: rgba(30, 33, 57, 0.98);
        backdrop-filter: blur(10px);
        border: 1px solid var(--border-dark);
        border-radius: 8px;
        max-height: 400px;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        z-index: 1000;
      }

      .doc-search-results.show {
        display: block;
      }

      .doc-search-result-item {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid rgba(45, 50, 80, 0.5);
        cursor: pointer;
        transition: all 0.2s;
      }

      .doc-search-result-item:last-child {
        border-bottom: none;
      }

      .doc-search-result-item:hover {
        background: rgba(255, 149, 0, 0.1);
      }

      .doc-search-result-title {
        color: var(--color-accent);
        font-weight: 500;
        margin-bottom: 0.25rem;
        font-size: 0.95rem;
      }

      .doc-search-result-meta {
        color: #8892b0;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .doc-search-result-category {
        opacity: 0.8;
      }

      .doc-search-result-description {
        color: #a8b2d1;
        margin-top: 0.25rem;
        font-size: 0.8rem;
        line-height: 1.4;
      }

      .doc-search-no-results {
        padding: 1.5rem 1rem;
        text-align: center;
        color: #8892b0;
        font-size: 0.9rem;
      }

      .doc-search-loading {
        padding: 1.5rem 1rem;
        text-align: center;
        color: var(--color-accent);
        font-size: 0.9rem;
      }

      /* Scrollbar styling */
      .doc-search-results::-webkit-scrollbar {
        width: 8px;
      }

      .doc-search-results::-webkit-scrollbar-track {
        background: rgba(10, 14, 39, 0.5);
        border-radius: 4px;
      }

      .doc-search-results::-webkit-scrollbar-thumb {
        background: rgba(255, 149, 0, 0.3);
        border-radius: 4px;
      }

      .doc-search-results::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 149, 0, 0.5);
      }
    `;
    document.head.appendChild(style);
  }

  attachEventListeners() {
    // Search on input
    let debounceTimer;
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      if (query.length < 2) {
        this.hideResults();
        return;
      }

      debounceTimer = setTimeout(() => {
        this.performSearch(query);
      }, 300);
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideResults();
      }
    });

    // Handle escape key
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideResults();
        this.searchInput.blur();
      }
    });
  }

  async performSearch(query) {
    this.showLoading();

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          repositoryId: this.repositoryId,
          limit: this.limit
        })
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      this.displayResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Search failed. Please try again.');
    }
  }

  showLoading() {
    this.searchResults.innerHTML = `
      <div class="doc-search-loading">
        <i class="fas fa-spinner fa-spin"></i> Searching...
      </div>
    `;
    this.searchResults.classList.add('show');
  }

  showError(message) {
    this.searchResults.innerHTML = `
      <div class="doc-search-no-results">
        ${message}
      </div>
    `;
    this.searchResults.classList.add('show');
  }

  displayResults(results) {
    if (results.length === 0) {
      this.searchResults.innerHTML = `
        <div class="doc-search-no-results">
          No results found
        </div>
      `;
      this.searchResults.classList.add('show');
      return;
    }

    this.searchResults.innerHTML = results.map((result, index) => {
      const title = result.title || result.path;
      const category = result.section || result.category || '';
      const description = result.description || result.excerpt || '';
      const repository = result.repositoryName || '';
      const file = result.file || result.path;

      return `
        <div class="doc-search-result-item" data-index="${index}" data-file="${file}">
          <div class="doc-search-result-title">${this.escapeHtml(title)}</div>
          <div class="doc-search-result-meta">
            ${category ? `<span class="doc-search-result-category">${this.escapeHtml(category)}</span>` : ''}
            ${repository && !this.repositoryId ? `<span class="doc-search-result-category">• ${this.escapeHtml(repository)}</span>` : ''}
          </div>
          ${description ? `<div class="doc-search-result-description">${this.escapeHtml(description)}</div>` : ''}
        </div>
      `;
    }).join('');

    this.searchResults.classList.add('show');

    // Attach click handlers
    this.searchResults.querySelectorAll('.doc-search-result-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.onResultClick(results[index]);
        this.clear();
      });
    });
  }

  defaultResultClick(result) {
    console.log('Result clicked:', result);
  }

  hideResults() {
    this.searchResults.classList.remove('show');
  }

  clear() {
    this.searchInput.value = '';
    this.hideResults();
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
