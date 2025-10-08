/**
 * Document Cache
 * In-memory cache for all loaded documents
 * Ensures we never fetch from GitHub/remote sources after initial load
 */
export class DocumentCache {
  constructor() {
    // repositoryId -> Map(filePath -> { content, metadata })
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      totalSize: 0
    };
  }

  /**
   * Store document in cache
   */
  set(repositoryId, filePath, content, metadata = {}) {
    if (!this.cache.has(repositoryId)) {
      this.cache.set(repositoryId, new Map());
    }

    const repoCache = this.cache.get(repositoryId);
    repoCache.set(filePath, {
      content,
      metadata: {
        ...metadata,
        cachedAt: Date.now(),
        size: content.length
      }
    });

    this.stats.totalSize += content.length;
  }

  /**
   * Get document from cache
   */
  get(repositoryId, filePath) {
    const repoCache = this.cache.get(repositoryId);
    if (!repoCache) {
      this.stats.misses++;
      return null;
    }

    const doc = repoCache.get(filePath);
    if (doc) {
      this.stats.hits++;
      return doc.content;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Check if document is cached
   */
  has(repositoryId, filePath) {
    const repoCache = this.cache.get(repositoryId);
    return repoCache ? repoCache.has(filePath) : false;
  }

  /**
   * Get all documents for a repository
   */
  getRepository(repositoryId) {
    const repoCache = this.cache.get(repositoryId);
    if (!repoCache) return null;

    const docs = {};
    for (const [filePath, data] of repoCache) {
      docs[filePath] = data.content;
    }
    return docs;
  }

  /**
   * Clear cache for a specific repository
   */
  clearRepository(repositoryId) {
    const repoCache = this.cache.get(repositoryId);
    if (repoCache) {
      // Update total size
      for (const [_, data] of repoCache) {
        this.stats.totalSize -= data.metadata.size;
      }
      this.cache.delete(repositoryId);
      console.log(`[DocumentCache] Cleared cache for ${repositoryId}`);
    }
  }

  /**
   * Clear entire cache
   */
  clearAll() {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
    console.log('[DocumentCache] Cleared all caches');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const repositories = [];

    for (const [repoId, repoCache] of this.cache) {
      let repoSize = 0;
      let docCount = 0;

      for (const [_, data] of repoCache) {
        repoSize += data.metadata.size;
        docCount++;
      }

      repositories.push({
        id: repoId,
        documentCount: docCount,
        sizeBytes: repoSize,
        sizeMB: (repoSize / 1024 / 1024).toFixed(2)
      });
    }

    return {
      repositoryCount: this.cache.size,
      totalDocuments: Array.from(this.cache.values()).reduce((sum, cache) => sum + cache.size, 0),
      totalSizeBytes: this.stats.totalSize,
      totalSizeMB: (this.stats.totalSize / 1024 / 1024).toFixed(2),
      hitRate: this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%'
        : '0%',
      hits: this.stats.hits,
      misses: this.stats.misses,
      repositories
    };
  }

  /**
   * Get list of all cached files for a repository
   */
  listFiles(repositoryId) {
    const repoCache = this.cache.get(repositoryId);
    if (!repoCache) return [];

    return Array.from(repoCache.keys());
  }

  /**
   * Get metadata for a cached document
   */
  getMetadata(repositoryId, filePath) {
    const repoCache = this.cache.get(repositoryId);
    if (!repoCache) return null;

    const doc = repoCache.get(filePath);
    return doc ? doc.metadata : null;
  }

  /**
   * Batch set documents (used during initial load/refresh)
   */
  batchSet(repositoryId, documents) {
    if (!this.cache.has(repositoryId)) {
      this.cache.set(repositoryId, new Map());
    }

    const repoCache = this.cache.get(repositoryId);
    let count = 0;

    for (const [filePath, content] of Object.entries(documents)) {
      repoCache.set(filePath, {
        content,
        metadata: {
          cachedAt: Date.now(),
          size: content.length
        }
      });
      this.stats.totalSize += content.length;
      count++;
    }

    console.log(`[DocumentCache] Cached ${count} documents for ${repositoryId}`);
    return count;
  }
}
