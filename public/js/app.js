import { initNavigation } from './navigation.js';
import { initSearch } from './search.js';
import { renderDoc } from './renderer.js';
import { ReloadMonitor } from './reload-monitor.js';

const API_BASE = '/api';

class DocsApp {
  constructor() {
    this.currentDoc = null;
    this.docs = [];
    this.navigation = [];
  }
  
  async init() {
    await this.loadInitialData();
    this.setupEventListeners();
    initNavigation(this);
    initSearch(this);
    
    // Start reload monitor
    this.reloadMonitor = new ReloadMonitor();
    this.reloadMonitor.start();
    
    const hash = window.location.hash.slice(1);
    if (hash) {
      await this.loadDoc(hash);
    }
  }
  
  async loadInitialData() {
    try {
      const [docsRes, navRes] = await Promise.all([
        fetch(`${API_BASE}/docs`),
        fetch(`${API_BASE}/navigation`)
      ]);
      
      this.docs = await docsRes.json();
      this.navigation = await navRes.json();
      
      this.populateNavigation();
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }
  
  populateNavigation() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    
    navMenu.innerHTML = this.navigation.map(section => `
      <section class="nav-section">
        <h3>${section.title}</h3>
        <ul>
          ${(section.items || []).map(item => 
            `<li><a href="#${item.path}" data-path="${item.path}">${item.title}</a></li>`
          ).join('')}
        </ul>
      </section>
    `).join('');
  }
  
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('a[data-path]')) {
        e.preventDefault();
        const path = e.target.dataset.path;
        this.loadDoc(path);
        window.location.hash = path;
      }
    });
    
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        this.loadDoc(hash);
      }
    });
  }
  
  async loadDoc(path) {
    try {
      const response = await fetch(`${API_BASE}/docs/${path}`);
      if (!response.ok) {
        throw new Error('Document not found');
      }
      
      const doc = await response.json();
      this.currentDoc = doc;
      
      this.setActiveNav(path);
      renderDoc(doc);
      
      document.getElementById('search-results').classList.add('hidden');
    } catch (error) {
      console.error('Failed to load document:', error);
      this.showError('Document not found');
    }
  }
  
  setActiveNav(path) {
    document.querySelectorAll('.nav-section a').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.path === path) {
        link.classList.add('active');
      }
    });
  }
  
  showError(message) {
    const content = document.getElementById('doc-content');
    content.innerHTML = `
      <div class="error-message">
        <h2>Error</h2>
        <p>${message}</p>
      </div>
    `;
  }
  
  async searchDocs(query) {
    try {
      const response = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 10 })
      });
      
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }
}

const app = new DocsApp();
document.addEventListener('DOMContentLoaded', () => app.init());

// Make app globally accessible for reload monitor
window.app = app;

export { app };