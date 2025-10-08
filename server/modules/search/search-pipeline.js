import { BM25Index } from './bm25-index.js';
import { SemanticIndex } from './semantic-index.js';
import { HybridRanker } from './hybrid-ranker.js';
import { FrameworkDetector } from './framework-detector.js';

/**
 * Search Pipeline
 * Orchestrates the hybrid search strategy with framework detection
 */
export class SearchPipeline {
  constructor() {
    this.bm25Index = new BM25Index();
    this.semanticIndex = new SemanticIndex();
    this.ranker = new HybridRanker();
    this.detector = new FrameworkDetector();
    this.initialized = false;
  }

  /**
   * Index a repository
   */
  async indexRepository(repositoryId, documents) {
    console.log(`[SearchPipeline] Indexing ${repositoryId} (${documents.length} documents)`);

    // Build both indexes in parallel
    await Promise.all([
      this.bm25Index.buildIndex(repositoryId, documents),
      this.semanticIndex.buildIndex(repositoryId, documents)
    ]);
  }

  /**
   * Remove repository from indexes
   */
  removeRepository(repositoryId) {
    this.bm25Index.removeRepository(repositoryId);
    this.semanticIndex.removeRepository(repositoryId);
    console.log(`[SearchPipeline] Removed ${repositoryId} from search indexes`);
  }

  /**
   * Get list of indexed repositories
   */
  getIndexedRepositories() {
    const bm25Stats = this.bm25Index.getStats();
    return bm25Stats.repositories.map(r => r.id);
  }

  /**
   * Scoped search pipeline (search within specific repository)
   */
  async searchScoped(repositoryId, query, options = {}) {
    const {
      topK = 10,
      includeBM25 = true,
      includeSemantic = true
    } = options;

    console.log(`[SearchPipeline] Scoped search in ${repositoryId}: "${query}"`);

    // Run both searches in parallel
    const [bm25Results, semanticResults] = await Promise.all([
      includeBM25 ? this.bm25Index.searchScoped(repositoryId, query, 100) : Promise.resolve([]),
      includeSemantic ? this.semanticIndex.searchScoped(repositoryId, query, 100) : Promise.resolve([])
    ]);

    // Merge and rank
    const ranked = this.ranker.rank(bm25Results, semanticResults, topK);

    return {
      query,
      strategy: 'scoped',
      repositoryId,
      results: this.formatResults(ranked),
      metadata: {
        bm25Count: bm25Results.length,
        semanticCount: semanticResults.length,
        finalCount: ranked.length
      }
    };
  }

  /**
   * Global search pipeline (search across all repositories)
   */
  async searchGlobal(query, options = {}) {
    const {
      topK = 15,
      perRepoLimit = 5,
      includeBM25 = true,
      includeSemantic = true
    } = options;

    console.log(`[SearchPipeline] Global search: "${query}"`);

    // Run both searches in parallel
    const [bm25Results, semanticResults] = await Promise.all([
      includeBM25 ? this.bm25Index.searchGlobal(query, 200) : Promise.resolve([]),
      includeSemantic ? this.semanticIndex.searchGlobal(query, 200) : Promise.resolve([])
    ]);

    // Merge and rank
    const ranked = this.ranker.rank(bm25Results, semanticResults, topK);

    // Apply per-repository diversity
    const diversified = this.diversifyByRepository(ranked, perRepoLimit);

    return {
      query,
      strategy: 'global',
      results: this.formatResults(diversified),
      metadata: {
        bm25Count: bm25Results.length,
        semanticCount: semanticResults.length,
        finalCount: diversified.length,
        repositoriesSearched: this.getIndexedRepositories().length
      }
    };
  }

  /**
   * Smart search with automatic framework detection
   */
  async search(query, options = {}) {
    const {
      repositoryId = null, // If provided, force scoped search
      topK = 10,
      autoDetect = true
    } = options;

    // If repositoryId is explicitly provided, use scoped search
    if (repositoryId) {
      return await this.searchScoped(repositoryId, query, { topK });
    }

    // Auto-detect framework if enabled
    if (autoDetect) {
      const availableRepos = this.getIndexedRepositories();
      const strategy = this.detector.getSearchStrategy(query, availableRepos);

      console.log(`[SearchPipeline] Detection: ${strategy.strategy} (confidence: ${strategy.confidence.toFixed(2)})`);

      if (strategy.strategy === 'scoped' && strategy.primaryRepository) {
        // Run scoped search on detected framework
        const scopedResult = await this.searchScoped(
          strategy.primaryRepository,
          query,
          { topK }
        );

        // If fallback enabled and scoped found few results, also run global
        if (strategy.fallbackToGlobal && scopedResult.results.length < 3) {
          console.log(`[SearchPipeline] Scoped found ${scopedResult.results.length} results, running global fallback`);
          const globalResult = await this.searchGlobal(query, { topK });

          // Combine results, prioritizing scoped
          return {
            query,
            strategy: 'hybrid',
            primaryRepository: strategy.primaryRepository,
            results: [
              ...scopedResult.results,
              ...globalResult.results.filter(gr =>
                !scopedResult.results.some(sr => sr.file === gr.file)
              )
            ].slice(0, topK),
            metadata: {
              detectionConfidence: strategy.confidence,
              scopedCount: scopedResult.results.length,
              globalCount: globalResult.results.length,
              reasoning: strategy.reasoning
            }
          };
        }

        // Scoped found enough results
        scopedResult.metadata.detectionConfidence = strategy.confidence;
        scopedResult.metadata.reasoning = strategy.reasoning;
        return scopedResult;
      }
    }

    // Fall back to global search
    return await this.searchGlobal(query, { topK });
  }

  /**
   * Diversify results to include multiple repositories
   */
  diversifyByRepository(results, perRepoLimit = 5) {
    const repoCount = new Map();
    const diversified = [];

    for (const result of results) {
      const repoId = result.document.repositoryId;
      const count = repoCount.get(repoId) || 0;

      if (count < perRepoLimit) {
        diversified.push(result);
        repoCount.set(repoId, count + 1);
      }
    }

    return diversified;
  }

  /**
   * Format results for API response
   */
  formatResults(rankedResults) {
    return rankedResults.map(result => ({
      repositoryId: result.document.repositoryId,
      repositoryName: result.document.repositoryName,
      section: result.document.category,
      title: result.document.title,
      description: this.extractExcerpt(result.document),
      file: result.document.file,
      score: result.combinedScore,
      source: result.source
    }));
  }

  /**
   * Extract relevant excerpt from document
   */
  extractExcerpt(doc, query = '', maxLength = 150) {
    if (query && doc.content) {
      const queryLower = query.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      const index = contentLower.indexOf(queryLower);

      if (index !== -1) {
        const start = Math.max(0, index - 60);
        const end = Math.min(doc.content.length, index + query.length + 60);
        return '...' + doc.content.substring(start, end).replace(/\n/g, ' ') + '...';
      }
    }

    // Fallback to description or content start
    if (doc.description) {
      return doc.description;
    }

    if (doc.content) {
      return doc.content.substring(0, maxLength) + '...';
    }

    return '';
  }

  /**
   * Get search statistics
   */
  getStats() {
    const bm25Stats = this.bm25Index.getStats();
    const semanticStats = this.semanticIndex.getStats();

    return {
      initialized: this.initialized,
      bm25: bm25Stats,
      semantic: semanticStats
    };
  }
}
