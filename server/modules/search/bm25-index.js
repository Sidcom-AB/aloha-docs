/**
 * BM25 Lexical Search Index
 * Fast keyword-based search using BM25 algorithm
 */
export class BM25Index {
  constructor() {
    // repositoryId -> { documents, idf, avgDocLength }
    this.indexes = new Map();
    this.k1 = 1.5; // Term frequency saturation
    this.b = 0.75; // Length normalization
  }

  /**
   * Tokenize and normalize text
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2); // Remove very short tokens
  }

  /**
   * Calculate term frequency
   */
  termFrequency(term, tokens) {
    return tokens.filter(t => t === term).length;
  }

  /**
   * Build BM25 index for a repository
   */
  buildIndex(repositoryId, documents) {
    const docCount = documents.length;
    const termDocFreq = new Map(); // term -> number of docs containing it
    const processedDocs = [];

    // First pass: collect term statistics
    for (const doc of documents) {
      const text = `${doc.title} ${doc.description} ${doc.content}`;
      const tokens = this.tokenize(text);
      const uniqueTerms = new Set(tokens);

      processedDocs.push({
        ...doc,
        tokens,
        length: tokens.length
      });

      // Count documents containing each term
      for (const term of uniqueTerms) {
        termDocFreq.set(term, (termDocFreq.get(term) || 0) + 1);
      }
    }

    // Calculate average document length
    const avgDocLength = processedDocs.reduce((sum, doc) => sum + doc.length, 0) / docCount;

    // Calculate IDF for each term
    const idf = new Map();
    for (const [term, df] of termDocFreq) {
      idf.set(term, Math.log((docCount - df + 0.5) / (df + 0.5) + 1));
    }

    this.indexes.set(repositoryId, {
      documents: processedDocs,
      idf,
      avgDocLength,
      docCount
    });

    console.log(`[BM25Index] Indexed ${docCount} documents for ${repositoryId}`);
  }

  /**
   * Search within a specific repository
   */
  searchScoped(repositoryId, query, limit = 100) {
    const index = this.indexes.get(repositoryId);
    if (!index) {
      return [];
    }

    const queryTokens = this.tokenize(query);
    const scores = [];

    for (const doc of index.documents) {
      let score = 0;

      for (const term of queryTokens) {
        const tf = this.termFrequency(term, doc.tokens);
        if (tf === 0) continue;

        const idfScore = index.idf.get(term) || 0;
        const docLengthNorm = doc.length / index.avgDocLength;

        // BM25 formula
        score += idfScore * (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * docLengthNorm));
      }

      if (score > 0) {
        scores.push({
          document: doc,
          score,
          source: 'bm25'
        });
      }
    }

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Search across all repositories
   */
  searchGlobal(query, limit = 200) {
    const allResults = [];

    for (const [repositoryId, _] of this.indexes) {
      const results = this.searchScoped(repositoryId, query, limit);
      allResults.push(...results);
    }

    return allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Remove repository from index
   */
  removeRepository(repositoryId) {
    this.indexes.delete(repositoryId);
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      repositoryCount: this.indexes.size,
      repositories: []
    };

    for (const [id, index] of this.indexes) {
      stats.repositories.push({
        id,
        documentCount: index.docCount,
        avgDocLength: Math.round(index.avgDocLength),
        vocabularySize: index.idf.size
      });
    }

    return stats;
  }
}
