# Document Caching Architecture

## Overview

Aloha Docs uses an **in-memory document cache** to ensure fast, predictable performance without hitting API rate limits. All documents are downloaded once and cached permanently until explicitly refreshed.

## Core Principle

**❌ NEVER fetch on-demand from GitHub/remote sources**
**✅ ALWAYS serve from in-memory cache**

## How It Works

### 1. Initial Load (Repository Initialization)

When a repository is added:

```
1. Validate repository structure
2. Load ALL documents in parallel (GitHub API or local files)
3. Store in DocumentCache (Map in memory)
4. Build search indexes (BM25 + Semantic)
5. Repository is ready for instant access
```

**Example:**
```javascript
// User adds GitHub repo
POST /api/repos
{
  "id": "my-docs",
  "url": "https://github.com/user/my-docs"
}

// Behind the scenes:
1. Fetch repo structure (1 API call)
2. Load all markdown files in parallel (N API calls)
3. Cache all content in memory
4. Build search indexes
5. Done! No more API calls during normal operation
```

### 2. Document Access (User Viewing)

When a user views a document:

```
1. User clicks document link
2. loadDocument(repoId, path) is called
3. Check DocumentCache.get(repoId, path)
4. Return cached content (< 5ms)
```

**NO GitHub API calls!**

### 3. Search

Search operates entirely on cached data:

```
1. User searches for "button config"
2. SearchEngine queries in-memory indexes
3. Results returned from cache (< 50ms)
```

**NO document fetching!**

### 4. Refresh (Manual Update)

When docs need updating:

```
1. Admin calls POST /api/repos/:id/refresh
2. Clear old cache for repository
3. Re-download all documents
4. Re-cache and re-index
5. Done!
```

## Architecture Components

### DocumentCache (`document-cache.js`)

Stores all loaded documents in memory.

```javascript
class DocumentCache {
  constructor() {
    // Map<repositoryId, Map<filePath, { content, metadata }>>
    this.cache = new Map();
  }

  set(repositoryId, filePath, content) { ... }
  get(repositoryId, filePath) { ... }
  clearRepository(repositoryId) { ... }
  batchSet(repositoryId, documents) { ... }
  getStats() { ... }
}
```

**Key Methods:**
- `set()` - Store single document
- `get()` - Retrieve cached document (returns null if not found)
- `batchSet()` - Store multiple documents at once (used during initial load)
- `clearRepository()` - Remove all docs for a repo (used before refresh)
- `getStats()` - Get cache size, hit rate, etc.

### RepositoryManager Integration

```javascript
// cacheRepositoryDocuments() - Called during validation
async cacheRepositoryDocuments(repo) {
  // 1. Collect all file paths from structure
  const files = [...];

  // 2. Load ALL documents in parallel
  const loadPromises = files.map(async (file) => {
    // Load from GitHub or local
    const content = await loadFile(file);
    return { file, content };
  });

  const results = await Promise.all(loadPromises);

  // 3. Batch store in cache
  this.documentCache.batchSet(repo.id, documents);

  // 4. Build search indexes (using cached docs)
  await this.searchEngine.indexRepository(...);
}

// loadDocument() - Always checks cache first
async loadDocument(repositoryId, documentPath) {
  // Try cache first
  const cached = this.documentCache.get(repositoryId, documentPath);
  if (cached) return cached; // ✅ Fast path (99%+ of requests)

  // Fallback: load and cache (should rarely happen)
  console.warn(`Document not in cache, loading...`);
  const content = await loadFromSource(documentPath);
  this.documentCache.set(repositoryId, documentPath, content);
  return content;
}
```

## Memory Usage

### Estimation

Typical markdown documentation:
- **1 file:** ~5-20 KB
- **100 files:** ~0.5-2 MB
- **1000 files:** ~5-20 MB

A repository with ~10MB of markdown (typical for large docs) uses ~10MB RAM.

**Example Project Sizes:**
- **Small docs** (10-50 files): ~0.5-1 MB
- **Medium docs** (50-200 files): ~2-5 MB
- **Large docs** (200-1000 files): ~5-20 MB
- **Very large** (1000+ files): ~20-100 MB

### Total System Memory

With 10 repositories averaging 5MB each:
- **Document cache:** ~50 MB
- **Search indexes:** ~100 MB (duplicate for indexing)
- **Node.js overhead:** ~50 MB
- **Total:** ~200 MB

Very reasonable for a Docker container!

## Performance Characteristics

### Initial Load (per repository)
- **Small repo (50 files):** 1-3 seconds
- **Medium repo (200 files):** 3-8 seconds
- **Large repo (1000 files):** 10-30 seconds

*Note: Parallel loading makes this much faster than sequential*

### Document Access (after caching)
- **Cache hit:** < 5 ms
- **Cache miss:** N/A (shouldn't happen)

### Search (fully cached)
- **Small index:** < 10 ms
- **Large index:** < 50 ms

## API Endpoints

### Get Cache Stats
```bash
GET /api/cache/stats

Response:
{
  "documentCache": {
    "repositoryCount": 3,
    "totalDocuments": 127,
    "totalSizeBytes": 8862720,
    "totalSizeMB": "8.45",
    "hitRate": "99.8%",
    "hits": 5423,
    "misses": 11,
    "repositories": [
      {
        "id": "aloha-docs",
        "documentCount": 45,
        "sizeBytes": 3355443,
        "sizeMB": "3.20"
      }
    ]
  }
}
```

### Refresh Single Repository
```bash
POST /api/repos/:id/refresh

Response:
{
  "success": true,
  "repositoryId": "aloha-docs",
  "documentCount": 45
}
```

### Refresh All Repositories
```bash
POST /api/repos/refresh-all

Response:
{
  "success": true,
  "results": [
    {
      "success": true,
      "repositoryId": "aloha-docs",
      "documentCount": 45
    },
    {
      "success": true,
      "repositoryId": "sample-framework",
      "documentCount": 12
    }
  ]
}
```

## Refresh Strategies

### Manual Refresh
Admin clicks "Refresh" button in UI:
```javascript
fetch('/api/repos/aloha-docs/refresh', { method: 'POST' });
```

### Scheduled Refresh (Cron)
Update all docs daily at 3am:
```bash
# crontab
0 3 * * * curl -X POST http://localhost:3000/api/repos/refresh-all
```

### Webhook-based Refresh
GitHub webhook on push:
```javascript
// server/webhooks.js
app.post('/webhook/github', async (req, res) => {
  const { repository } = req.body;
  const repoId = findRepoIdFromGitHubUrl(repository.html_url);

  if (repoId) {
    await repositoryManager.refreshRepository(repoId);
    res.json({ success: true });
  }
});
```

### Auto-refresh on Interval
Background task every 6 hours:
```javascript
// server/index.js
setInterval(async () => {
  console.log('[AutoRefresh] Updating all repositories...');
  await repositoryManager.refreshAll();
}, 6 * 60 * 60 * 1000); // 6 hours
```

## Benefits

### 1. No Rate Limits
- GitHub API: 5,000 requests/hour (with token)
- With caching: Only ~N requests per refresh (where N = number of docs)
- Normal operation: 0 API calls

### 2. Fast Response Times
- Cache hit: < 5ms
- No network latency
- No authentication overhead
- Predictable performance

### 3. Offline Capable
- After initial load, works without internet
- Great for local development
- No external dependencies during runtime

### 4. Cost Efficient
- No API quota consumption during normal use
- Can serve millions of page views
- Only pay GitHub API cost during refresh

### 5. Simple Architecture
- No external cache (Redis, Memcached, etc.)
- No database needed
- Just Node.js memory
- Easy to deploy in Docker

## Limitations & Considerations

### Memory Constraints
- **Problem:** Large documentation sets consume RAM
- **Solution:** Docker container with 512MB-1GB RAM is plenty
- **Mitigation:** Monitor with `GET /api/cache/stats`

### Stale Data
- **Problem:** Cache doesn't auto-update when GitHub changes
- **Solution:** Implement refresh strategy (webhook, cron, manual)
- **Mitigation:** Show "Last updated" timestamp in UI

### Initial Load Time
- **Problem:** Adding repo with 1000 files takes 10-30 seconds
- **Solution:** Show progress indicator in UI
- **Mitigation:** Parallel loading speeds this up significantly

### Server Restart
- **Problem:** Cache lost on restart (all docs must reload)
- **Solution:** Automatic reload during initialization
- **Mitigation:** Could add persistent cache layer (optional)

## Future Enhancements

### 1. Persistent Cache (Optional)
Store cache to disk between restarts:
```javascript
// On shutdown
await documentCache.saveToDisk('./cache/docs.json');

// On startup
await documentCache.loadFromDisk('./cache/docs.json');
```

### 2. Incremental Updates
Only fetch changed files:
```javascript
// Use GitHub commits API to detect changes
const changedFiles = await getChangedFilesSince(lastRefreshDate);
// Only reload those specific files
```

### 3. Cache Warming
Pre-populate cache on deployment:
```bash
# Dockerfile
RUN node scripts/warm-cache.js
```

### 4. Smart Refresh
Track document update timestamps and only refresh if needed:
```javascript
if (Date.now() - repo.lastRefreshed > 6 * 3600 * 1000) {
  await refreshRepository(repo.id);
}
```

## Summary

✅ **All docs cached in memory on first load**
✅ **Zero API calls during normal operation**
✅ **Fast, predictable performance**
✅ **Explicit refresh when needed**
✅ **Scalable to 100+ MB of docs**
✅ **Simple, no external dependencies**

The document cache ensures Aloha Docs is **fast, reliable, and won't hit rate limits** no matter how many users search or view documentation.
