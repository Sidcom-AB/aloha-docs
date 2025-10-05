export class ReloadMonitor {
  constructor() {
    this.eventSource = null;
    this.notification = null;
    this.reconnectTimeout = null;
    this.isConnected = false;
  }
  
  start() {
    this.connect();
    this.createNotificationElement();
  }
  
  connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    
    this.eventSource = new EventSource('/api/events');
    
    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleEvent(data);
    };
    
    this.eventSource.onopen = () => {
      console.log('Connected to reload monitor');
      this.isConnected = true;
      clearTimeout(this.reconnectTimeout);
    };
    
    this.eventSource.onerror = () => {
      console.warn('Reload monitor connection lost');
      this.isConnected = false;
      this.eventSource.close();
      
      // Attempt to reconnect after 5 seconds
      this.reconnectTimeout = setTimeout(() => {
        console.log('Attempting to reconnect...');
        this.connect();
      }, 5000);
    };
  }
  
  handleEvent(event) {
    switch (event.type) {
      case 'connected':
        console.log('Reload monitor connected');
        break;
        
      case 'reload':
        this.showNotification('Documentation reloaded', 'success', event.stats);
        this.reloadCurrentPage();
        break;
        
      case 'error':
        this.showNotification(`Reload failed: ${event.message}`, 'error');
        break;
    }
  }
  
  createNotificationElement() {
    if (this.notification) return;
    
    this.notification = document.createElement('div');
    this.notification.className = 'reload-notification hidden';
    this.notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message"></span>
        <button class="notification-close">×</button>
      </div>
    `;
    
    document.body.appendChild(this.notification);
    
    const closeBtn = this.notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.hideNotification();
    });
  }
  
  showNotification(message, type = 'info', stats = null) {
    const messageEl = this.notification.querySelector('.notification-message');
    
    let fullMessage = message;
    if (stats) {
      fullMessage += ` (${stats.schemas} schemas, ${stats.docs} docs)`;
    }
    
    messageEl.textContent = fullMessage;
    this.notification.className = `reload-notification ${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }
  
  hideNotification() {
    if (this.notification) {
      this.notification.classList.add('hidden');
    }
  }
  
  async reloadCurrentPage() {
    // Check if we're viewing a component or doc
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    
    // Wait a bit for server to finish indexing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reload the current doc/component
    if (window.app && window.app.loadDoc) {
      try {
        await window.app.loadDoc(hash);
        console.log('Page content refreshed');
      } catch (error) {
        console.error('Failed to refresh page:', error);
      }
    }
  }
  
  async manualReload() {
    try {
      const response = await fetch('/api/reload', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        this.showNotification(data.message, 'success', data.stats);
      } else {
        this.showNotification(data.error, 'error');
      }
    } catch (error) {
      this.showNotification('Failed to reload', 'error');
    }
  }
  
  stop() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    clearTimeout(this.reconnectTimeout);
    
    if (this.notification) {
      this.notification.remove();
      this.notification = null;
    }
  }
}