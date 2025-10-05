import { watch } from 'fs';
import { join } from 'path';
import { config } from './config.js';

export class FileWatcher {
  constructor(docsLoader, searchEngine) {
    this.docsLoader = docsLoader;
    this.searchEngine = searchEngine;
    this.watchers = [];
    this.reloadTimeout = null;
    this.listeners = new Set();
  }
  
  start() {
    if (!config.watchFiles) {
      console.log('File watching disabled');
      return;
    }
    
    console.log('Starting file watchers...');
    
    // Watch entire docs directory
    this.watchDirectory(config.paths.root, null);
  }
  
  stop() {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
  }
  
  watchDirectory(path, pattern) {
    try {
      const watcher = watch(path, { recursive: true }, (eventType, filename) => {
        if (filename && this.matchesPattern(filename, pattern)) {
          console.log(`File ${eventType}: ${filename}`);
          this.scheduleReload();
        }
      });
      
      this.watchers.push(watcher);
      console.log(`Watching directory: ${path}`);
    } catch (error) {
      console.warn(`Could not watch directory ${path}:`, error.message);
    }
  }
  
  watchFile(path) {
    try {
      const watcher = watch(path, (eventType) => {
        console.log(`File ${eventType}: ${path}`);
        this.scheduleReload();
      });
      
      this.watchers.push(watcher);
      console.log(`Watching file: ${path}`);
    } catch (error) {
      console.warn(`Could not watch file ${path}:`, error.message);
    }
  }
  
  matchesPattern(filename, pattern) {
    if (!pattern) return true;
    
    if (pattern.startsWith('*')) {
      return filename.endsWith(pattern.slice(1));
    }
    
    return filename === pattern;
  }
  
  scheduleReload() {
    clearTimeout(this.reloadTimeout);
    
    this.reloadTimeout = setTimeout(() => {
      this.reload();
    }, config.reloadDebounce);
  }
  
  async reload() {
    console.log('Reloading documentation...');
    
    try {
      // Clear existing data
      this.docsLoader.docs.clear();
      this.docsLoader.schemas.clear();
      this.docsLoader.components.clear();
      
      // Reload all data
      await this.docsLoader.loadAll();
      
      // Re-index search engine
      await this.searchEngine.index(this.docsLoader.getAllDocs());
      
      console.log('Documentation reloaded successfully');
      
      // Notify listeners
      this.notifyListeners({
        type: 'reload',
        timestamp: new Date().toISOString(),
        stats: {
          schemas: this.docsLoader.schemas.size,
          docs: this.docsLoader.docs.size
        }
      });
      
    } catch (error) {
      console.error('Failed to reload documentation:', error);
      
      this.notifyListeners({
        type: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  onReload(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }
}