import Fuse from 'fuse.js';

export class SearchEngine {
  constructor() {
    this.fuse = null;
    this.documents = [];
  }
  
  async index(documents) {
    this.documents = documents.map((doc, idx) => ({
      id: idx,
      title: doc.title,
      content: doc.content,
      path: doc.path,
      type: doc.type,
      tags: doc.tags || [],
      snippet: this.createSnippet(doc.content)
    }));
    
    const options = {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'content', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'snippet', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: true,
      ignoreLocation: true
    };
    
    this.fuse = new Fuse(this.documents, options);
    console.log(`Indexed ${this.documents.length} documents`);
  }
  
  async search(query, limit = 5) {
    if (!this.fuse) {
      throw new Error('Search engine not initialized');
    }
    
    const results = this.fuse.search(query).slice(0, limit);
    
    return results.map(result => ({
      title: result.item.title,
      snippet: this.extractRelevantSnippet(result.item.content, query),
      source: `http://localhost:3000/docs/${result.item.path}`,
      score: 1 - result.score,
      type: result.item.type,
      tags: result.item.tags
    }));
  }
  
  createSnippet(content, maxLength = 200) {
    if (!content) return '';
    const text = content.replace(/[#*`\[\]]/g, '').trim();
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;
  }
  
  extractRelevantSnippet(content, query, contextLength = 150) {
    if (!content) return '';
    
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const queryWords = lowerQuery.split(/\s+/);
    
    let bestPosition = -1;
    let bestScore = 0;
    
    for (const word of queryWords) {
      const pos = lowerContent.indexOf(word);
      if (pos !== -1) {
        const score = word.length;
        if (score > bestScore) {
          bestScore = score;
          bestPosition = pos;
        }
      }
    }
    
    if (bestPosition === -1) {
      return this.createSnippet(content, contextLength);
    }
    
    const start = Math.max(0, bestPosition - contextLength / 2);
    const end = Math.min(content.length, bestPosition + contextLength / 2);
    
    let snippet = content.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet.replace(/\n+/g, ' ').trim();
  }
  
  async addDocument(doc) {
    this.documents.push({
      id: this.documents.length,
      title: doc.title,
      content: doc.content,
      path: doc.path,
      type: doc.type,
      tags: doc.tags || [],
      snippet: this.createSnippet(doc.content)
    });
    
    await this.reindex();
  }
  
  async reindex() {
    const options = {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'content', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'snippet', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: true,
      ignoreLocation: true
    };
    
    this.fuse = new Fuse(this.documents, options);
  }
}