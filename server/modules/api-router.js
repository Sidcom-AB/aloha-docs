import { Router } from 'express';
import { GitHubDiscovery } from './github-discovery.js';

export function apiRouter(searchEngine, repositoryManager, mcpRouter) {
  const router = Router();
  const discovery = new GitHubDiscovery(process.env.GITHUB_TOKEN);
  
  router.post('/search', async (req, res) => {
    try {
      const { query, limit = 5 } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const results = await searchEngine.search(query, limit);
      res.json({ results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  router.get('/docs', (req, res) => {
    const docs = docsLoader.getAllDocs();
    const summary = docs.map(d => ({
      path: d.path,
      title: d.title,
      type: d.type,
      tags: d.tags
    }));
    res.json(summary);
  });
  
  router.get('/docs/*', (req, res) => {
    const path = req.params[0];
    const doc = docsLoader.getDoc(path);
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(doc);
  });
  
  router.get('/components', (req, res) => {
    const components = Array.from(docsLoader.components.entries())
      .filter(([key, schema]) => schema.tagName)
      .map(([key, schema]) => ({
        name: schema.tagName,
        title: schema.title,
        description: schema.description
      }));
    
    res.json(components);
  });
  
  router.get('/components/:name', (req, res) => {
    const { name } = req.params;
    const component = docsLoader.getComponent(name);
    
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    res.json(component);
  });
  
  router.get('/schemas', (req, res) => {
    const schemas = Array.from(docsLoader.schemas.keys());
    res.json(schemas);
  });
  
  router.get('/schemas/:name', (req, res) => {
    const { name } = req.params;
    const schema = docsLoader.getSchema(name);
    
    if (!schema) {
      return res.status(404).json({ error: 'Schema not found' });
    }
    
    res.json(schema);
  });
  
  router.get('/tokens', (req, res) => {
    const tokens = docsLoader.getDesignTokens();
    res.json(tokens);
  });
  
  router.get('/navigation', (req, res) => {
    const navigation = docsLoader.getNavigation();
    res.json(navigation);
  });
  
  router.get('/table-of-contents', (req, res) => {
    const toc = docsLoader.getTableOfContents();
    res.json(toc);
  });
  
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      docsCount: docsLoader.docs.size,
      schemasCount: docsLoader.schemas.size
    });
  });
  
  // New multi-repository endpoints
  router.get('/repositories', async (req, res) => {
    try {
      const hierarchy = repositoryManager.getRepositoryHierarchy();
      res.json(hierarchy);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  router.get('/repos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const repo = repositoryManager.getRepository(id);
      
      if (!repo) {
        return res.status(404).json({ error: 'Repository not found' });
      }
      
      res.json({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        url: repo.url,
        validated: repo.validated,
        tableOfContents: repo.tableOfContents,
        children: Array.from(repo.children.keys())
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  router.get('/repos/:id/docs/*', async (req, res) => {
    try {
      const { id } = req.params;
      const docPath = req.params[0];
      
      const content = await repositoryManager.loadDocument(id, docPath);
      res.json({ 
        repositoryId: id,
        path: docPath,
        content 
      });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });
  
  router.post('/repos', async (req, res) => {
    try {
      const { id, name, description, url, parent, token, enabled = true } = req.body;
      
      if (!id || !url) {
        return res.status(400).json({ error: 'ID and URL are required' });
      }
      
      const repo = await repositoryManager.addRepository({
        id,
        name,
        description,
        url,
        parent,
        token,
        enabled
      });
      
      const validation = await repositoryManager.validateRepository(repo);
      
      await repositoryManager.saveConfiguration();
      
      res.json({
        repository: {
          id: repo.id,
          name: repo.name,
          url: repo.url,
          validated: validation.valid
        },
        validation
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  router.post('/validate', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      const parsed = repositoryManager.githubLoader.parseGitHubUrl(url);
      const validation = await repositoryManager.githubLoader.validateRepository(
        parsed.owner,
        parsed.repo,
        parsed.branch,
        parsed.path
      );
      
      res.json(validation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  router.post('/repos/:id/validate', async (req, res) => {
    try {
      const { id } = req.params;
      const repo = repositoryManager.getRepository(id);
      
      if (!repo) {
        return res.status(404).json({ error: 'Repository not found' });
      }
      
      const validation = await repositoryManager.validateRepository(repo);
      const validator = repositoryManager.docValidator || new (await import('./doc-validator.js')).DocValidator();
      
      const fullValidation = await validator.validateFullRepository(
        repo.tableOfContents,
        async (file) => {
          const { owner, repo: repoName, branch, path: basePath } = repo.github;
          const fullPath = basePath ? `${basePath}/${file}` : file;
          return await repositoryManager.githubLoader.loadFile(owner, repoName, branch, fullPath);
        }
      );
      
      res.json({
        basic: validation,
        full: fullValidation,
        report: validator.generateValidationReport(fullValidation)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // MCP routing
  router.get('/mcp/*', async (req, res) => {
    try {
      const path = req.params[0] || '/';
      const result = await mcpRouter.handleRequest(path);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });
  
  router.post('/mcp/search', async (req, res) => {
    try {
      const { query, scope } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const results = await mcpRouter.search(query, scope);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  router.get('/mcp/routes', (req, res) => {
    const routes = mcpRouter.getAvailableRoutes();
    res.json(routes);
  });
  
  // Auto-discover endpoint
  router.post('/discover', async (req, res) => {
    try {
      const { url, customPath, token } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      // Create discovery instance with token if provided
      const discoveryInstance = new GitHubDiscovery(token || null);
      const result = await discoveryInstance.discoverRepository(url, customPath);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  return router;
}