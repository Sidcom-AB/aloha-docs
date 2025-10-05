import { RepositoryManager } from './repository-manager.js';

export class MCPRouter {
  constructor() {
    this.repositoryManager = new RepositoryManager();
    this.routes = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    await this.repositoryManager.initialize();
    this.buildRoutes();
    this.initialized = true;
  }

  buildRoutes() {
    this.routes.clear();
    
    this.routes.set('/', {
      type: 'root',
      description: 'Access all documentation repositories',
      handler: () => this.handleRootRequest()
    });

    const hierarchy = this.repositoryManager.getRepositoryHierarchy();
    this.buildRoutesFromHierarchy(hierarchy);
  }

  buildRoutesFromHierarchy(nodes, parentPath = '') {
    for (const node of nodes) {
      const path = parentPath ? `${parentPath}/${node.id}` : `/${node.id}`;
      
      this.routes.set(path, {
        type: 'repository',
        repositoryId: node.id,
        description: node.description,
        handler: () => this.handleRepositoryRequest(node.id)
      });

      if (node.children && node.children.length > 0) {
        this.buildRoutesFromHierarchy(node.children, path);
      }
    }
  }

  async handleRequest(path) {
    if (!this.initialized) {
      await this.initialize();
    }

    const normalizedPath = this.normalizePath(path);
    const route = this.routes.get(normalizedPath);
    
    if (!route) {
      const dynamicRoute = this.matchDynamicRoute(normalizedPath);
      if (dynamicRoute) {
        return await dynamicRoute.handler();
      }
      
      throw new Error(`Route not found: ${path}`);
    }

    return await route.handler();
  }

  normalizePath(path) {
    if (!path || path === '/') return '/';
    
    let normalized = path.startsWith('/') ? path : `/${path}`;
    normalized = normalized.replace(/\/+/g, '/');
    
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    
    return normalized;
  }

  matchDynamicRoute(path) {
    const segments = path.split('/').filter(Boolean);
    
    if (segments.length >= 2) {
      const repoId = segments[0];
      const docPath = segments.slice(1).join('/');
      
      const repo = this.repositoryManager.getRepository(repoId);
      if (repo) {
        return {
          type: 'document',
          handler: () => this.handleDocumentRequest(repoId, docPath)
        };
      }
    }
    
    return null;
  }

  async handleRootRequest() {
    const hierarchy = this.repositoryManager.getRepositoryHierarchy();
    
    return {
      type: 'root',
      message: 'Available documentation repositories',
      repositories: this.formatHierarchyForResponse(hierarchy),
      capabilities: {
        search: true,
        hierarchical: true,
        multiFramework: true
      }
    };
  }

  async handleRepositoryRequest(repositoryId) {
    const repo = this.repositoryManager.getRepository(repositoryId);
    
    if (!repo) {
      throw new Error(`Repository not found: ${repositoryId}`);
    }

    if (!repo.validated) {
      throw new Error(`Repository not validated: ${repositoryId} - ${repo.validationError || 'Unknown error'}`);
    }

    const hierarchy = this.repositoryManager.getRepositoryHierarchy(repositoryId);
    
    return {
      type: 'repository',
      repository: {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        url: repo.url
      },
      tableOfContents: repo.tableOfContents,
      children: hierarchy.children || [],
      capabilities: {
        search: true,
        documents: true,
        children: (hierarchy.children && hierarchy.children.length > 0)
      }
    };
  }

  async handleDocumentRequest(repositoryId, documentPath) {
    const content = await this.repositoryManager.loadDocument(repositoryId, documentPath);
    
    return {
      type: 'document',
      repositoryId: repositoryId,
      path: documentPath,
      content: content
    };
  }

  async search(query, scope = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    let repositoryId = null;
    
    if (scope && scope !== '/') {
      const normalizedScope = this.normalizePath(scope);
      const route = this.routes.get(normalizedScope);
      
      if (route && route.type === 'repository') {
        repositoryId = route.repositoryId;
      }
    }

    const results = await this.repositoryManager.searchDocuments(query, repositoryId);
    
    return {
      type: 'search',
      query: query,
      scope: scope || 'all',
      results: results,
      count: results.length
    };
  }

  formatHierarchyForResponse(hierarchy) {
    const formatted = [];
    
    for (const node of hierarchy) {
      const formattedNode = {
        id: node.id,
        name: node.name,
        description: node.description,
        path: `/${node.id}`,
        validated: node.validated,
        enabled: node.enabled
      };

      if (node.children && node.children.length > 0) {
        formattedNode.children = this.formatChildrenForResponse(node.children, `/${node.id}`);
      }

      formatted.push(formattedNode);
    }

    return formatted;
  }

  formatChildrenForResponse(children, parentPath) {
    const formatted = [];
    
    for (const child of children) {
      const childPath = `${parentPath}/${child.id}`;
      const formattedChild = {
        id: child.id,
        name: child.name,
        description: child.description,
        path: childPath,
        validated: child.validated,
        enabled: child.enabled
      };

      if (child.children && child.children.length > 0) {
        formattedChild.children = this.formatChildrenForResponse(child.children, childPath);
      }

      formatted.push(formattedChild);
    }

    return formatted;
  }

  getAvailableRoutes() {
    const routes = [];
    
    for (const [path, route] of this.routes) {
      routes.push({
        path: path,
        type: route.type,
        description: route.description,
        repositoryId: route.repositoryId || null
      });
    }

    return routes.sort((a, b) => a.path.localeCompare(b.path));
  }
}