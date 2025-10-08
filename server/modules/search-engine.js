import { SearchPipeline } from './search/search-pipeline.js';

/**
 * Centralized Search Engine with hybrid BM25 + Semantic search
 * Used by both MCP handler and Web UI API
 */
export class SearchEngine {
  constructor() {
    this.pipeline = new SearchPipeline();
    this.repositoryMetadata = new Map(); // Store repo metadata
    this.initialized = false;
  }

  /**
   * Build search index for a repository
   */
  async indexRepository(repositoryId, structure, loadDocumentFn) {
    console.log(`[SearchEngine] Indexing repository: ${repositoryId}`);

    const documents = [];
    const categories = structure.categories || [];

    // Build list of all documents to index
    for (const category of categories) {
      if (category.items) {
        for (const item of category.items) {
          documents.push({
            repositoryId,
            repositoryName: structure.title || repositoryId,
            category: category.title,
            title: item.title,
            description: item.description || '',
            file: item.file
          });
        }
      }
    }

    // Load all documents in parallel
    const loadPromises = documents.map(async (doc) => {
      try {
        const content = await loadDocumentFn(doc.file);
        return {
          ...doc,
          content: content
        };
      } catch (error) {
        console.error(`[SearchEngine] Failed to load ${doc.file}:`, error.message);
        return null;
      }
    });

    const loadedDocs = (await Promise.all(loadPromises)).filter(d => d !== null);

    // Store metadata
    this.repositoryMetadata.set(repositoryId, {
      title: structure.title || repositoryId,
      description: structure.description || '',
      documentCount: loadedDocs.length,
      indexedAt: Date.now()
    });

    // Index in search pipeline
    await this.pipeline.indexRepository(repositoryId, loadedDocs);

    console.log(`[SearchEngine] Indexed ${loadedDocs.length} documents for ${repositoryId}`);
    return loadedDocs.length;
  }

  /**
   * Remove repository from index
   */
  removeRepository(repositoryId) {
    this.pipeline.removeRepository(repositoryId);
    this.repositoryMetadata.delete(repositoryId);
    console.log(`[SearchEngine] Removed index for ${repositoryId}`);
  }

  /**
   * Check if repository is indexed
   */
  isIndexed(repositoryId) {
    return this.repositoryMetadata.has(repositoryId);
  }

  /**
   * Get index statistics
   */
  getStats() {
    const pipelineStats = this.pipeline.getStats();
    const repos = [];

    for (const [id, metadata] of this.repositoryMetadata) {
      repos.push({
        id,
        title: metadata.title,
        documentCount: metadata.documentCount,
        indexedAt: new Date(metadata.indexedAt).toISOString()
      });
    }

    return {
      repositoryCount: this.repositoryMetadata.size,
      repositories: repos,
      pipeline: pipelineStats
    };
  }

  /**
   * Search using hybrid pipeline with auto-detection
   */
  async search(query, repositoryId = null, limit = 10) {
    const result = await this.pipeline.search(query, {
      repositoryId,
      topK: limit,
      autoDetect: !repositoryId // Only auto-detect if no repo specified
    });

    return result.results;
  }

  /**
   * Search with detailed metadata (for debugging/analytics)
   */
  async searchDetailed(query, repositoryId = null, limit = 10) {
    return await this.pipeline.search(query, {
      repositoryId,
      topK: limit,
      autoDetect: !repositoryId
    });
  }

  /**
   * Rebuild entire index (useful for refresh)
   */
  async rebuildIndex(repositoryManager) {
    console.log('[SearchEngine] Rebuilding entire search index...');
    this.repositoryMetadata.clear();

    const repos = Array.from(repositoryManager.repositories.values());
    const indexPromises = [];

    for (const repo of repos) {
      if (repo.validated && repo.enabled && repo.structure) {
        const loadDocFn = async (file) => {
          return await repositoryManager.loadDocument(repo.id, file);
        };

        indexPromises.push(
          this.indexRepository(repo.id, repo.structure, loadDocFn)
            .catch(error => {
              console.error(`[SearchEngine] Failed to index ${repo.id}:`, error.message);
              return 0;
            })
        );
      }
    }

    const results = await Promise.all(indexPromises);
    const totalDocs = results.reduce((sum, count) => sum + count, 0);

    console.log(`[SearchEngine] Index rebuilt: ${this.repositoryMetadata.size} repositories, ${totalDocs} documents`);
    this.pipeline.initialized = true;
    this.initialized = true;

    return { repositoryCount: this.repositoryMetadata.size, documentCount: totalDocs };
  }
}