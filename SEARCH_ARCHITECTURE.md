# Search Architecture

## Overview

Aloha Docs uses a **hybrid 2-stage search strategy** combining BM25 lexical search with semantic ranking, automatic framework detection, and intelligent scoping. This provides both precision (when we know the framework) and discovery (when exploring).

## Architecture

### Modular Structure

```
server/modules/
├── search/
│   ├── bm25-index.js          # BM25 lexical search
│   ├── semantic-index.js      # Semantic similarity search
│   ├── hybrid-ranker.js       # Score merging + MMR diversity
│   ├── framework-detector.js  # Auto-detect framework intent
│   └── search-pipeline.js     # Orchestration layer
├── document-cache.js          # In-memory document storage
├── search-engine.js           # Main search interface
└── repository-manager.js      # Repository + cache management
```

### Document Caching Strategy

**IMPORTANT:** Aloha Docs **NEVER** fetches documents on-demand from GitHub or remote sources during runtime.

All documents are:
1. **Downloaded once** during repository initialization
2. **Cached in memory** for instant access
3. **Never re-fetched** unless explicitly refreshed

This ensures:
- ✅ **No API rate limits** during normal operation
- ✅ **Fast response times** (< 5ms from cache)
- ✅ **Offline capable** (after initial load)
- ✅ **Predictable performance**

### Core Components

#### 1. BM25Index (`bm25-index.js`)
Fast keyword-based search using the BM25 algorithm.

**Features:**
- TF-IDF weighting with length normalization
- Per-repository indexing
- Configurable parameters (k1=1.5, b=0.75)

**Methods:**
- `buildIndex(repositoryId, documents)` - Index a repository
- `searchScoped(repositoryId, query, limit)` - Search within one repo
- `searchGlobal(query, limit)` - Search across all repos

#### 2. SemanticIndex (`semantic-index.js`)
Semantic search using string similarity and position-based scoring.

**Features:**
- Title/description/content matching
- Position-aware scoring (earlier = better)
- Multi-word query support
- Upgradeable to embeddings later

**Methods:**
- `buildIndex(repositoryId, documents)` - Index a repository
- `searchScoped(repositoryId, query, limit)` - Semantic search in one repo
- `searchGlobal(query, limit)` - Semantic search across all repos

#### 3. HybridRanker (`hybrid-ranker.js`)
Combines BM25 and semantic results with diversity optimization.

**Features:**
- Score normalization (0-1 range)
- Weighted merging (50% BM25 + 50% semantic by default)
- MMR (Maximal Marginal Relevance) for diversity
- Deduplication

**Methods:**
- `mergeResults(bm25Results, semanticResults)` - Combine scores
- `applyMMR(results, topK)` - Apply diversity algorithm
- `rank(bm25Results, semanticResults, topK)` - Full pipeline

#### 4. FrameworkDetector (`framework-detector.js`)
Detects framework/repository intent from queries.

**Features:**
- Keyword and pattern matching
- Confidence scoring
- Topic extraction (installation, config, components, etc.)
- Query expansion with synonyms

**Methods:**
- `detectFramework(query, availableRepos)` - Detect framework intent
- `extractTopic(query)` - Extract documentation topic
- `expandQuery(query, framework)` - Generate query variations
- `getSearchStrategy(query, availableRepos)` - Recommend search strategy

#### 5. SearchPipeline (`search-pipeline.js`)
Orchestrates the entire search process.

**Search Modes:**

**Scoped Search** - Search within specific repository
```javascript
await pipeline.searchScoped('aloha-docs', 'button config', { topK: 10 });
```

**Global Search** - Search across all repositories
```javascript
await pipeline.searchGlobal('button config', { topK: 15, perRepoLimit: 5 });
```

**Smart Search** - Auto-detect + hybrid fallback
```javascript
await pipeline.search('button config', { autoDetect: true });
```

## Search Flow

### 1. Query Input
User searches for "button config"

### 2. Framework Detection (if autoDetect enabled)
```javascript
{
  detected: true,
  strategy: 'scoped',
  primaryRepository: 'webawesome-docs',
  confidence: 0.85,
  reasoning: 'Matched keywords: button, component'
}
```

### 3A. Scoped Search (high confidence)
```
BM25 Search (webawesome-docs) → 100 results
Semantic Search (webawesome-docs) → 100 results
Hybrid Merge → 60 results
MMR Diversity → 10 results
```

### 3B. Global Search (low confidence or fallback)
```
BM25 Search (all repos) → 200 results
Semantic Search (all repos) → 200 results
Hybrid Merge → 60 results
MMR Diversity → 15 results
Per-repo Limit (5 each) → Diversified results
```

### 3C. Hybrid Strategy (scoped + global fallback)
If scoped finds < 3 results, also run global and combine.

### 4. Result Formatting
```javascript
{
  query: 'button config',
  strategy: 'scoped',
  results: [
    {
      title: 'Button Configuration',
      repository: 'Webawesome Docs',
      section: 'Components',
      description: '...button props and config...',
      file: 'components/button.md',
      score: 0.92,
      source: 'both' // or 'bm25' or 'semantic'
    }
  ],
  metadata: {
    detectionConfidence: 0.85,
    bm25Count: 45,
    semanticCount: 38,
    finalCount: 10
  }
}
```

## MCP Tools

### `search_docs`
Standard search with auto-detection.
```javascript
{
  query: "button props",
  limit: 10
}
```

### `search_frameworks`
Detect framework intent without searching.
```javascript
{
  query: "webawesome button config",
  detected: true,
  primaryFramework: "webawesome-docs",
  confidence: 0.9,
  topic: "configuration",
  queryExpansions: ["button config", "btn configuration", "button settings"]
}
```

### `search_detailed`
Search with full metadata for debugging.
```javascript
{
  query: "button",
  strategy: "hybrid",
  metadata: {
    detectionConfidence: 0.75,
    scopedCount: 8,
    globalCount: 15,
    reasoning: "Matched keywords: button, component"
  }
}
```

### `get_doc`
Fetch full document content.
```javascript
{
  repositoryId: "aloha-docs",
  path: "getting-started.md"
}
```

## Performance Characteristics

### Indexing
- **Time:** ~50-100ms per repository (depends on doc count)
- **Memory:** ~2-3MB per 1000 documents (all in RAM)
- **Parallel:** All documents loaded in parallel

### Search
- **BM25:** O(V × D) where V = vocabulary size, D = documents
- **Semantic:** O(D) linear scan
- **Typical:** < 50ms for 1000 documents
- **Cached:** All indexes in memory, no disk I/O

### Scalability
- **Single Container:** Designed for Docker deployment
- **~10MB markdown per repo:** Easily handled in memory
- **Multiple repos:** Per-repo indexes scale linearly

## Configuration

### BM25 Parameters
```javascript
k1: 1.5  // Term frequency saturation
b: 0.75  // Length normalization
```

### Hybrid Ranker Weights
```javascript
bm25Weight: 0.5      // 50% lexical
semanticWeight: 0.5  // 50% semantic
mmrLambda: 0.7       // 70% relevance, 30% diversity
```

### Framework Detector
Edit `framework-detector.js` to add new framework patterns:
```javascript
this.frameworkPatterns = {
  'my-framework': {
    keywords: ['myframework', 'my-lib'],
    aliases: ['myfw'],
    confidence: 0.9
  }
};
```

## Upgrading to Embeddings

The architecture is designed to easily upgrade to vector embeddings:

1. Replace `SemanticIndex.calculateSimilarity()` with cosine similarity
2. Add embedding model (e.g., all-MiniLM-L6-v2)
3. Generate embeddings during indexing
4. Use vector similarity for semantic search

The rest of the pipeline remains unchanged.

## Testing

### Unit Tests (Recommended)
```javascript
// Test BM25 scoring
const index = new BM25Index();
index.buildIndex('test', documents);
const results = index.searchScoped('test', 'button', 10);
assert(results[0].score > 0);

// Test framework detection
const detector = new FrameworkDetector();
const strategy = detector.getSearchStrategy('webawesome button', ['webawesome-docs']);
assert(strategy.primaryRepository === 'webawesome-docs');
```

### Integration Tests
```javascript
// Test full pipeline
const pipeline = new SearchPipeline();
await pipeline.indexRepository('test', documents);
const result = await pipeline.search('button config', { autoDetect: true });
assert(result.results.length > 0);
```

## Troubleshooting

### Slow Search
- Check index size: `searchEngine.getStats()`
- Verify parallel loading during indexing
- Consider reducing `topK` in intermediate steps

### Poor Results
- Check BM25/semantic weights in `HybridRanker`
- Adjust framework detection patterns
- Increase `mmrLambda` for more relevance (less diversity)

### Framework Not Detected
- Add keywords to `FrameworkDetector.frameworkPatterns`
- Lower confidence threshold (default: 0.6)
- Check available repositories list

## Refresh & Cache Management

### Refreshing Documents

When you need to update documentation from the source (GitHub or local):

```javascript
// Refresh single repository
await repositoryManager.refreshRepository('repo-id');

// Refresh all repositories
await repositoryManager.refreshAll();
```

**API Endpoints:**
```bash
# Refresh single repo
POST /api/repos/:id/refresh

# Refresh all repos
POST /api/repos/refresh-all

# Get cache statistics
GET /api/cache/stats
```

### Cache Statistics

```javascript
const stats = repositoryManager.getCacheStats();

// Returns:
{
  documentCache: {
    repositoryCount: 3,
    totalDocuments: 127,
    totalSizeMB: "8.45",
    hitRate: "99.2%",
    repositories: [
      {
        id: "aloha-docs",
        documentCount: 45,
        sizeMB: "3.2"
      }
    ]
  },
  searchEngine: { ... }
}
```

### When to Refresh

- **Manual updates:** When you know docs changed on GitHub
- **Scheduled:** Set up a cron job (e.g., daily at 3am)
- **Webhooks:** GitHub webhook on push events
- **On-demand:** User clicks "Refresh" button in UI

## API Reference

### SearchEngine (Main Interface)

```javascript
const searchEngine = new SearchEngine();

// Index repository
await searchEngine.indexRepository(repoId, structure, loadDocFn);

// Simple search
const results = await searchEngine.search(query, repositoryId, limit);

// Detailed search with metadata
const detailed = await searchEngine.searchDetailed(query, repositoryId, limit);

// Get stats
const stats = searchEngine.getStats();
```

### SearchPipeline (Advanced)

```javascript
const pipeline = new SearchPipeline();

// Scoped search
const scoped = await pipeline.searchScoped(repoId, query, { topK: 10 });

// Global search
const global = await pipeline.searchGlobal(query, {
  topK: 15,
  perRepoLimit: 5
});

// Smart search with auto-detect
const smart = await pipeline.search(query, {
  autoDetect: true,
  repositoryId: null // or specific repo to force scoped
});
```

## Future Enhancements

1. **Vector Embeddings** - Replace string similarity with neural embeddings
2. **Cross-Encoder Reranking** - Add final reranking step for top results
3. **Query Understanding** - NLP for better intent detection
4. **Result Caching** - Cache popular queries (1-10 min TTL)
5. **Incremental Indexing** - Update index without full rebuild
6. **Analytics** - Track query performance and click-through rates

## License

Part of Aloha Docs - MIT License
