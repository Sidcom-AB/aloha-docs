/**
 * Semantic Search Index
 * Simple semantic search using string similarity (can be upgraded to embeddings later)
 */
export class SemanticIndex {
  constructor() {
    // repositoryId -> { documents }
    this.indexes = new Map();
  }

  /**
   * Build semantic index for a repository
   */
  buildIndex(repositoryId, documents) {
    const processedDocs = documents.map(doc => ({
      ...doc,
      titleLower: doc.title.toLowerCase(),
      descriptionLower: doc.description.toLowerCase(),
      contentLower: doc.content.toLowerCase(),
      // Create searchable text for semantic matching
      searchText: `${doc.title} ${doc.description} ${doc.content}`.toLowerCase()
    }));

    this.indexes.set(repositoryId, {
      documents: processedDocs
    });

    console.log(`[SemanticIndex] Indexed ${processedDocs.length} documents for ${repositoryId}`);
  }

  /**
   * Calculate semantic similarity score
   * Uses simple substring matching and position-based scoring
   * Can be upgraded to embeddings later
   */
  calculateSimilarity(query, doc) {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Exact title match (highest priority)
    if (doc.titleLower === queryLower) {
      score += 10;
    } else if (doc.titleLower.includes(queryLower)) {
      // Position-based scoring: earlier match = higher score
      const position = doc.titleLower.indexOf(queryLower);
      const positionScore = 1 - (position / doc.titleLower.length);
      score += 5 * positionScore;
    }

    // Description match
    if (doc.descriptionLower.includes(queryLower)) {
      score += 2;
    }

    // Content match with context
    if (doc.contentLower.includes(queryLower)) {
      // Count occurrences (but with diminishing returns)
      const occurrences = (doc.contentLower.match(new RegExp(queryLower, 'g')) || []).length;
      score += Math.min(occurrences, 5) * 0.5;
    }

    // Multi-word query: check if all words appear
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length > 1) {
      const allWordsPresent = queryWords.every(word => doc.searchText.includes(word));
      if (allWordsPresent) {
        score += 3;
      }
    }

    return score;
  }

  /**
   * Search within a specific repository
   */
  searchScoped(repositoryId, query, limit = 100) {
    const index = this.indexes.get(repositoryId);
    if (!index) {
      return [];
    }

    const results = [];

    for (const doc of index.documents) {
      const score = this.calculateSimilarity(query, doc);

      if (score > 0) {
        results.push({
          document: doc,
          score,
          source: 'semantic'
        });
      }
    }

    return results
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
        documentCount: index.documents.length
      });
    }

    return stats;
  }
}
