/**
 * Hybrid Ranker
 * Combines BM25 (lexical) and Semantic scores with normalization and MMR
 */
export class HybridRanker {
  constructor() {
    this.bm25Weight = 0.5;
    this.semanticWeight = 0.5;
    this.mmrLambda = 0.7; // Diversity vs relevance tradeoff
  }

  /**
   * Normalize scores to 0-1 range
   */
  normalizeScores(results) {
    if (results.length === 0) return results;

    const maxScore = Math.max(...results.map(r => r.score));
    const minScore = Math.min(...results.map(r => r.score));
    const range = maxScore - minScore || 1;

    return results.map(r => ({
      ...r,
      normalizedScore: (r.score - minScore) / range
    }));
  }

  /**
   * Merge and rank BM25 and semantic results
   */
  mergeResults(bm25Results, semanticResults) {
    // Create a map of docId -> combined scores
    const scoreMap = new Map();

    // Normalize both result sets
    const normalizedBM25 = this.normalizeScores(bm25Results);
    const normalizedSemantic = this.normalizeScores(semanticResults);

    // Add BM25 scores
    for (const result of normalizedBM25) {
      const docId = result.document.file;
      scoreMap.set(docId, {
        document: result.document,
        bm25Score: result.normalizedScore,
        semanticScore: 0,
        source: 'bm25'
      });
    }

    // Add/merge semantic scores
    for (const result of normalizedSemantic) {
      const docId = result.document.file;
      const existing = scoreMap.get(docId);

      if (existing) {
        existing.semanticScore = result.normalizedScore;
        existing.source = 'both';
      } else {
        scoreMap.set(docId, {
          document: result.document,
          bm25Score: 0,
          semanticScore: result.normalizedScore,
          source: 'semantic'
        });
      }
    }

    // Calculate combined scores
    const merged = Array.from(scoreMap.values()).map(item => ({
      ...item,
      combinedScore:
        item.bm25Score * this.bm25Weight +
        item.semanticScore * this.semanticWeight
    }));

    return merged.sort((a, b) => b.combinedScore - a.combinedScore);
  }

  /**
   * Apply Maximal Marginal Relevance (MMR) for diversity
   * Reduces redundancy by penalizing similar documents
   */
  applyMMR(results, topK = 60) {
    if (results.length <= topK) return results;

    const selected = [];
    const remaining = [...results];

    // Select first result (highest score)
    selected.push(remaining.shift());

    // Iteratively select most relevant yet diverse documents
    while (selected.length < topK && remaining.length > 0) {
      let bestIndex = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];

        // Relevance score
        const relevance = candidate.combinedScore;

        // Calculate maximum similarity to already selected docs
        let maxSimilarity = 0;
        for (const selectedDoc of selected) {
          const similarity = this.documentSimilarity(candidate.document, selectedDoc.document);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }

        // MMR score: balance relevance and diversity
        const mmrScore = this.mmrLambda * relevance - (1 - this.mmrLambda) * maxSimilarity;

        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIndex = i;
        }
      }

      selected.push(remaining.splice(bestIndex, 1)[0]);
    }

    return selected;
  }

  /**
   * Calculate similarity between two documents
   * Simple word overlap - can be upgraded to cosine similarity with embeddings
   */
  documentSimilarity(doc1, doc2) {
    const words1 = new Set(this.tokenize(doc1.title + ' ' + doc1.description));
    const words2 = new Set(this.tokenize(doc2.title + ' ' + doc2.description));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Tokenize text for similarity calculation
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Deduplicate results by URL/file
   */
  deduplicate(results) {
    const seen = new Set();
    const deduped = [];

    for (const result of results) {
      const key = result.document.file;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(result);
      }
    }

    return deduped;
  }

  /**
   * Full hybrid ranking pipeline
   */
  rank(bm25Results, semanticResults, topK = 10) {
    // 1. Merge BM25 and semantic results
    const merged = this.mergeResults(bm25Results, semanticResults);

    // 2. Apply MMR for diversity (on top 60)
    const diverse = this.applyMMR(merged, 60);

    // 3. Deduplicate
    const deduped = this.deduplicate(diverse);

    // 4. Return top K
    return deduped.slice(0, topK);
  }
}
