// Main Marketplace App Module - SPA Router
import HomePage from './pages/home.js';
import BrowsePage from './pages/browse.js';
import AddPage from './pages/add.js';
import HowToPage from './pages/howto.js';

class MarketplaceApp {
  constructor() {
    this.pages = {
      home: HomePage,
      browse: BrowsePage,
      add: AddPage,
      howto: HowToPage
    };
    this.currentPage = null;
    this.currentPageModule = null;
  }

  init() {
    // Setup navigation
    this.setupNavigation();

    // Setup global functions
    this.setupGlobalFunctions();

    // Handle initial route
    this.handleRoute();

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());

    // Listen for popstate
    window.addEventListener('popstate', () => this.handleRoute());
  }

  setupNavigation() {
    document.querySelectorAll('.nav-item a').forEach(link => {
      link.addEventListener('click', (e) => {
        if (!link.getAttribute('href').startsWith('http')) {
          e.preventDefault();

          // Remove active from all
          document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
          });

          // Add active to clicked
          link.parentElement.classList.add('active');

          // Update pill position
          this.updatePillPosition();

          // Navigate
          const page = link.parentElement.dataset.page;
          this.navigateTo(page);
        }
      });
    });

    // Mobile menu toggle
    window.toggleMenu = () => {
      document.getElementById('navbarMenu').classList.toggle('active');
    };
  }

  updatePillPosition() {
    const activeItem = document.querySelector('.nav-item.active');
    const pillSelector = document.querySelector('.pill-selector');

    if (activeItem && pillSelector) {
      const navRect = document.querySelector('.navbar-nav').getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      const itemLeft = itemRect.left - navRect.left;
      const itemWidth = itemRect.width;

      requestAnimationFrame(() => {
        pillSelector.style.left = `${itemLeft}px`;
        pillSelector.style.width = `${itemWidth}px`;
      });
    }
  }

  setupGlobalFunctions() {
    // Global navigate function
    window.navigateTo = (page) => this.navigateTo(page);

    // Global framework opener
    window.openFramework = (id) => {
      window.location.href = `/${id}`;
    };
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const page = hash.split('/')[0];

    if (this.pages[page]) {
      this.loadPage(page);
    } else {
      this.loadPage('home');
    }
  }

  navigateTo(page, params = {}) {
    if (this.pages[page]) {
      // Store params for the page
      this.pageParams = params;
      window.location.hash = page;
    }
  }

  async loadPage(pageName) {
    const pageModule = this.pages[pageName];
    if (!pageModule) return;

    // Cleanup previous page
    if (this.currentPageModule && this.currentPageModule.cleanup) {
      this.currentPageModule.cleanup();
    }

    // Get main content container
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    // Render new page
    appContainer.innerHTML = pageModule.render();

    // Initialize page with params
    if (pageModule.init) {
      await pageModule.init(this.pageParams || {});
    }

    // Set global reference for browse page
    if (pageName === 'browse') {
      window.browsePage = pageModule;
    }

    // Clear params after init
    this.pageParams = null;

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === pageName) {
        item.classList.add('active');
      }
    });

    // Update pill position
    this.updatePillPosition();

    // Store current page
    this.currentPage = pageName;
    this.currentPageModule = pageModule;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new MarketplaceApp();
  app.init();

  // Initialize pill position
  window.addEventListener('load', () => app.updatePillPosition());
  window.addEventListener('resize', () => app.updatePillPosition());
});
