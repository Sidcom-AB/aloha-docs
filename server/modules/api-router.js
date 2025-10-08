import { Router } from 'express';
import { GitHubDiscovery } from './github-discovery.js';

export function apiRouter(searchEngine, repositoryManager, mcpRouter) {
  const router = Router();
  const discovery = new GitHubDiscovery(process.env.GITHUB_TOKEN);
  
  router.post('/search', async (req, res) => {
    try {
      const { query, limit = 5, repositoryId = null } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      // Use repository manager (which uses SearchEngine for fast cached search)
      const results = await repositoryManager.searchDocuments(query, repositoryId, limit);
      res.json({ results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Multi-repository endpoints
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
        structure: repo.structure,
        metadata: repo.metadata,
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

      // Create discovery instance with token (from request or env)
      const discoveryInstance = new GitHubDiscovery(token || process.env.GITHUB_TOKEN);
      const result = await discoveryInstance.discoverRepository(url, customPath);

      // Check if the error indicates authentication is required
      if (!result.found && result.error) {
        if (result.error.includes('404') && result.error.includes('Not Found') && !token) {
          // 404 on a repo without token likely means it's private
          return res.status(403).json({
            found: false,
            error: 'Repository is private or does not exist. Authentication required.',
            needsAuth: true
          });
        }
      }

      res.json(result);
    } catch (error) {
      // Check if error is a 403 or 404 authentication error
      if (error.message.includes('403') || error.message.includes('404')) {
        return res.status(403).json({
          error: error.message,
          needsAuth: true
        });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Refresh repository cache
  router.post('/repos/:id/refresh', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await repositoryManager.refreshRepository(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Refresh all repositories
  router.post('/repos/refresh-all', async (req, res) => {
    try {
      const results = await repositoryManager.refreshAll();
      res.json({
        success: true,
        results
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get cache statistics
  router.get('/cache/stats', async (req, res) => {
    try {
      const stats = repositoryManager.getCacheStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}