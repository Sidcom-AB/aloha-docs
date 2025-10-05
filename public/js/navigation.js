export function initNavigation(app) {
  const navLinks = document.querySelectorAll('.nav-section a');
  
  navLinks.forEach(link => {
    link.addEventListener('click', handleNavClick);
  });
  
  function handleNavClick(e) {
    const target = e.target;
    
    if (target.dataset.path === 'tokens') {
      e.preventDefault();
      loadTokensView();
      window.location.hash = 'tokens';
      setActiveLink(target);
    }
  }
  
  function setActiveLink(link) {
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  }
  
  async function loadTokensView() {
    try {
      const response = await fetch('/api/tokens');
      const tokens = await response.json();
      renderTokensView(tokens);
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  }
  
  function renderTokensView(tokens) {
    const content = document.getElementById('doc-content');
    content.innerHTML = `
      <div class="tokens-view">
        <h1>Design Tokens</h1>
        <p>Design tokens for consistent theming across the Aloha Framework.</p>
        
        ${renderTokenSection('Colors', tokens.colors)}
        ${renderTokenSection('Typography', tokens.typography)}
        ${renderTokenSection('Spacing', tokens.spacing)}
        ${renderTokenSection('Shadows', tokens.shadows)}
        ${renderTokenSection('Radius', tokens.radius)}
      </div>
    `;
  }
  
  function renderTokenSection(title, tokens) {
    if (!tokens) return '';
    
    return `
      <section class="token-section">
        <h2>${title}</h2>
        <div class="token-grid">
          ${Object.entries(tokens).map(([key, value]) => 
            renderTokenCard(key, value, title.toLowerCase())
          ).join('')}
        </div>
      </section>
    `;
  }
  
  function renderTokenCard(name, value, type) {
    let preview = '';
    
    if (type === 'colors') {
      preview = `<div class="token-preview" style="background: ${value}"></div>`;
    } else if (type === 'typography') {
      if (typeof value === 'object') {
        preview = `<div class="token-details">${JSON.stringify(value, null, 2)}</div>`;
      } else {
        preview = `<div class="token-preview" style="font-family: ${value}">Aa</div>`;
      }
    } else if (type === 'spacing') {
      preview = `<div class="token-preview" style="width: ${value}; height: 20px; background: var(--color-primary)"></div>`;
    } else if (type === 'shadows') {
      preview = `<div class="token-preview" style="box-shadow: ${value}"></div>`;
    } else if (type === 'radius') {
      preview = `<div class="token-preview" style="border-radius: ${value}; border: 2px solid var(--color-border)"></div>`;
    }
    
    return `
      <div class="token-card">
        <div class="token-name">${name}</div>
        <div class="token-value">${typeof value === 'object' ? JSON.stringify(value) : value}</div>
        ${preview}
      </div>
    `;
  }
  
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash === 'tokens') {
      loadTokensView();
      const tokenLink = document.querySelector('[data-path="tokens"]');
      if (tokenLink) setActiveLink(tokenLink);
    }
  });
}