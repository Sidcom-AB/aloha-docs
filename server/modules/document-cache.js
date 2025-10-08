import { promises as fs } from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Document Cache
 * In-memory cache for all loaded documents with compressed disk persistence
 * Ensures we never fetch from GitHub/remote sources after initial load
 */
export class DocumentCache {
  constructor(persistPath = './config/cache') {
    // repositoryId -> Map(filePath -> { content, metadata })
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      totalSize: 0
    };
    this.persistPath = persistPath;
    this.version = '1.0.0'; // For cache invalidation
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

  /**
   * Save cache to disk for persistence
   * Saves each repository to its own compressed file for better scalability
   */
  async saveToDisk() {
    try {
      console.log('[DocumentCache] Saving cache to disk...');

      // Ensure cache directory exists
      await fs.mkdir(this.persistPath, { recursive: true });

      // Save index file with metadata
      const index = {
        version: this.version,
        savedAt: Date.now(),
        repositories: []
      };

      let totalOriginal = 0;
      let totalCompressed = 0;

      // Save each repository to its own compressed file
      for (const [repoId, repoCache] of this.cache) {
        const repoData = {};
        let docCount = 0;

        for (const [filePath, data] of repoCache) {
          repoData[filePath] = data;
          docCount++;
        }

        // Convert to JSON and compress
        const jsonString = JSON.stringify(repoData);
        const compressed = await gzip(jsonString);

        const repoFilePath = path.join(this.persistPath, `${this.sanitizeFilename(repoId)}.cache`);
        await fs.writeFile(repoFilePath, compressed);

        totalOriginal += Buffer.byteLength(jsonString);
        totalCompressed += compressed.length;

        // Add to index
        index.repositories.push({
          id: repoId,
          file: `${this.sanitizeFilename(repoId)}.cache`,
          documentCount: docCount,
          savedAt: Date.now()
        });
      }

      // Save index file
      const indexPath = path.join(this.persistPath, 'index.json');
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2));

      const ratio = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);
      console.log(`[DocumentCache] Saved ${index.repositories.length} repos (${(totalCompressed / 1024 / 1024).toFixed(1)}MB compressed, ${ratio}% smaller)`);

      return { success: true, path: this.persistPath, fileCount: this.cache.size };
    } catch (error) {
      console.error('[DocumentCache] Failed to save to disk:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sanitize repository ID for use as filename
   */
  sanitizeFilename(repoId) {
    return repoId.replace(/[^a-z0-9-_]/gi, '_');
  }

  /**
   * Save only a specific repository to disk (faster than full save)
   * Compresses data with gzip for smaller footprint
   */
  async saveRepository(repositoryId) {
    try {
      const repoCache = this.cache.get(repositoryId);
      if (!repoCache) {
        console.warn(`[DocumentCache] Repository ${repositoryId} not in cache`);
        return { success: false, reason: 'not_found' };
      }

      // Ensure cache directory exists
      await fs.mkdir(this.persistPath, { recursive: true });

      // Prepare repository data
      const repoData = {};
      for (const [filePath, data] of repoCache) {
        repoData[filePath] = data;
      }

      // Convert to JSON and compress with gzip
      const jsonString = JSON.stringify(repoData);
      const compressed = await gzip(jsonString);

      const repoFilePath = path.join(this.persistPath, `${this.sanitizeFilename(repositoryId)}.cache`);
      await fs.writeFile(repoFilePath, compressed);

      // Calculate compression ratio
      const originalSize = Buffer.byteLength(jsonString);
      const compressedSize = compressed.length;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

      // Update index
      await this.updateIndex();

      console.log(`[DocumentCache] Saved ${repositoryId} (${(compressedSize / 1024).toFixed(1)}KB, ${ratio}% smaller)`);
      return { success: true, repositoryId, originalSize, compressedSize };
    } catch (error) {
      console.error(`[DocumentCache] Failed to save ${repositoryId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update the index.json file with current repositories
   */
  async updateIndex() {
    const index = {
      version: this.version,
      savedAt: Date.now(),
      repositories: []
    };

    for (const [repoId, repoCache] of this.cache) {
      index.repositories.push({
        id: repoId,
        file: `${this.sanitizeFilename(repoId)}.cache`,
        documentCount: repoCache.size,
        savedAt: Date.now()
      });
    }

    const indexPath = path.join(this.persistPath, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  }

  /**
   * Load cache from disk on startup
   * Loads from index.json and individual repository files
   */
  async loadFromDisk() {
    try {
      const indexPath = path.join(this.persistPath, 'index.json');

      // Check if index file exists
      try {
        await fs.access(indexPath);
      } catch {
        console.log('[DocumentCache] No persistent cache found, will build fresh');
        return { success: false, reason: 'no_cache' };
      }

      console.log('[DocumentCache] Loading cache from disk...');
      const indexData = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexData);

      // Check version compatibility
      if (index.version !== this.version) {
        console.warn(`[DocumentCache] Cache version mismatch (${index.version} vs ${this.version}), rebuilding...`);
        await this.cleanupOrphanedFiles();
        return { success: false, reason: 'version_mismatch' };
      }

      // Check cache age (optional - invalidate if older than X days)
      const cacheAge = Date.now() - index.savedAt;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (cacheAge > maxAge) {
        console.warn(`[DocumentCache] Cache is ${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days old, rebuilding...`);
        await this.cleanupOrphanedFiles();
        return { success: false, reason: 'cache_too_old' };
      }

      // Restore cache from individual repository files
      this.cache.clear();
      let totalDocs = 0;
      const loadedRepos = new Set();

      for (const repoInfo of index.repositories) {
        try {
          const repoFilePath = path.join(this.persistPath, repoInfo.file);

          // Read compressed file
          const compressed = await fs.readFile(repoFilePath);

          // Decompress
          const decompressed = await gunzip(compressed);
          const jsonString = decompressed.toString('utf-8');
          const repoDocs = JSON.parse(jsonString);

          const repoCache = new Map();

          for (const [filePath, data] of Object.entries(repoDocs)) {
            repoCache.set(filePath, data);
            this.stats.totalSize += data.metadata.size;
            totalDocs++;
          }

          this.cache.set(repoInfo.id, repoCache);
          loadedRepos.add(repoInfo.file);
        } catch (error) {
          console.warn(`[DocumentCache] Failed to load ${repoInfo.id}: ${error.message}`);
        }
      }

      // Cleanup orphaned cache files
      await this.cleanupOrphanedFiles(loadedRepos);

      console.log(`[DocumentCache] Loaded ${totalDocs} documents from ${this.cache.size} repository caches`);
      return {
        success: true,
        documentCount: totalDocs,
        repositoryCount: this.cache.size,
        cacheAge: Math.round(cacheAge / (60 * 60 * 1000)) // hours
      };
    } catch (error) {
      console.error('[DocumentCache] Failed to load from disk:', error.message);
      return { success: false, reason: 'load_error', error: error.message };
    }
  }

  /**
   * Cleanup orphaned cache files (repos that are no longer in index)
   */
  async cleanupOrphanedFiles(validFiles = null) {
    try {
      const files = await fs.readdir(this.persistPath);
      let cleaned = 0;

      for (const file of files) {
        // Skip index.json
        if (file === 'index.json') continue;

        // Skip if it's a valid file
        if (validFiles && validFiles.has(file)) continue;

        // Remove orphaned cache file
        const filePath = path.join(this.persistPath, file);
        await fs.unlink(filePath);
        cleaned++;
        console.log(`[DocumentCache] Removed orphaned cache file: ${file}`);
      }

      if (cleaned > 0) {
        console.log(`[DocumentCache] Cleaned up ${cleaned} orphaned cache files`);
      }
    } catch (error) {
      console.warn('[DocumentCache] Failed to cleanup orphaned files:', error.message);
    }
  }

  /**
   * Clear all disk cache files
   */
  async clearDiskCache() {
    try {
      const files = await fs.readdir(this.persistPath);
      let cleared = 0;

      for (const file of files) {
        const filePath = path.join(this.persistPath, file);
        await fs.unlink(filePath);
        cleared++;
      }

      console.log(`[DocumentCache] Cleared ${cleared} cache files from disk`);
      return { success: true, filesCleared: cleared };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true, message: 'No cache to clear' };
      }
      return { success: false, error: error.message };
    }
  }
}
