export function initSearch(app) {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  let searchTimeout;
  
  // Auto-search on input with debounce
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      searchResults.classList.add('hidden');
      return;
    }
    
    searchTimeout = setTimeout(() => performSearch(query), 300);
  });
  
  async function performSearch(query) {
    const results = await app.searchDocs(query);
    displayResults(results, query);
  }
  
  function displayResults(results, query) {
    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="no-results">
          <h3>No results found for "${query}"</h3>
          <p>Try different keywords or browse the navigation menu.</p>
        </div>
      `;
    } else {
      searchResults.innerHTML = `
        <div class="results-header">
          <h3>Search Results</h3>
          <span class="results-count">${results.length} results for "${query}"</span>
        </div>
        ${results.map(result => createResultItem(result)).join('')}
      `;
    }
    
    searchResults.classList.remove('hidden');
  }
  
  function createResultItem(result) {
    const tags = result.tags && result.tags.length > 0 
      ? `<span class="tags">${result.tags.join(', ')}</span>`
      : '';
    
    return `
      <div class="search-result-item">
        <h3>
          <a href="${result.source}" data-path="${extractPath(result.source)}">
            ${result.title}
          </a>
        </h3>
        <p class="snippet">${highlightQuery(result.snippet)}</p>
        <div class="meta">
          <span class="type">${result.type}</span>
          <span class="score">Score: ${(result.score * 100).toFixed(0)}%</span>
          ${tags}
        </div>
      </div>
    `;
  }
  
  function extractPath(url) {
    const match = url.match(/\/docs\/(.+)$/);
    return match ? match[1] : '';
  }
  
  function highlightQuery(text) {
    const query = searchInput.value.trim();
    if (!query) return text;
    
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
  
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}