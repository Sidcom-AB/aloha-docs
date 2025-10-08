/**
 * Framework Detector
 * Detects framework intent from queries using pattern matching and keyword analysis
 */
export class FrameworkDetector {
  constructor() {
    // Framework patterns and keywords
    this.frameworkPatterns = {
      // Repository ID patterns from our actual repositories
      'aloha-docs': {
        keywords: ['aloha', 'documentation', 'mcp', 'docs'],
        aliases: ['aloha'],
        confidence: 0.9
      },
      'sample-framework': {
        keywords: ['sample', 'example', 'demo'],
        aliases: ['sample'],
        confidence: 0.9
      },
      'andymcloid-webawesome-docs': {
        keywords: ['webawesome', 'web awesome', 'shoelace', 'components'],
        aliases: ['webawesome', 'web-awesome'],
        confidence: 0.9
      }
    };

    // Common framework detection (for future repos)
    this.commonFrameworks = {
      'react': ['react', 'jsx', 'hooks', 'usestate', 'useeffect'],
      'vue': ['vue', 'vuejs', 'composition', 'ref', 'reactive'],
      'angular': ['angular', 'ng', 'directive', 'component', 'service'],
      'svelte': ['svelte', 'sveltekit', 'reactive', 'stores'],
      'next': ['nextjs', 'next.js', 'server component', 'app router'],
      'nuxt': ['nuxt', 'nuxtjs', 'nuxt.js'],
      'tailwind': ['tailwind', 'tailwindcss', 'utility class'],
      'bootstrap': ['bootstrap', 'bs5', 'container', 'row'],
      'vite': ['vite', 'vitejs'],
      'webpack': ['webpack', 'bundle'],
      'typescript': ['typescript', 'ts', 'type', 'interface']
    };
  }

  /**
   * Detect framework from query
   */
  detectFramework(query, availableRepositories = []) {
    const queryLower = query.toLowerCase();
    const candidates = [];

    // Check against available repositories
    for (const repoId of availableRepositories) {
      const pattern = this.frameworkPatterns[repoId];
      if (!pattern) continue;

      let score = 0;
      let matches = [];

      // Check keywords
      for (const keyword of pattern.keywords) {
        if (queryLower.includes(keyword)) {
          score += 1;
          matches.push(keyword);
        }
      }

      // Check aliases
      for (const alias of pattern.aliases) {
        if (queryLower.includes(alias)) {
          score += 2; // Aliases are stronger signals
          matches.push(alias);
        }
      }

      if (score > 0) {
        candidates.push({
          repositoryId: repoId,
          confidence: Math.min(score / 3, 1) * pattern.confidence,
          matches,
          reason: `Matched keywords: ${matches.join(', ')}`
        });
      }
    }

    // Check common frameworks (for repositories we might add later)
    for (const [framework, keywords] of Object.entries(this.commonFrameworks)) {
      let score = 0;
      let matches = [];

      for (const keyword of keywords) {
        if (queryLower.includes(keyword)) {
          score += 1;
          matches.push(keyword);
        }
      }

      if (score > 0) {
        // Try to find matching repository by name similarity
        const matchingRepo = availableRepositories.find(repoId =>
          repoId.toLowerCase().includes(framework)
        );

        if (matchingRepo) {
          candidates.push({
            repositoryId: matchingRepo,
            confidence: Math.min(score / 3, 0.8),
            matches,
            reason: `Matched framework keywords: ${matches.join(', ')}`
          });
        }
      }
    }

    // Sort by confidence
    candidates.sort((a, b) => b.confidence - a.confidence);

    return {
      detected: candidates.length > 0,
      candidates,
      topCandidate: candidates[0] || null,
      shouldUseScoped: candidates.length > 0 && candidates[0].confidence > 0.6
    };
  }

  /**
   * Extract topic/intent from query
   */
  extractTopic(query) {
    const queryLower = query.toLowerCase();
    const topics = [];

    // Common documentation topics
    const topicPatterns = {
      'installation': ['install', 'setup', 'getting started', 'quick start'],
      'configuration': ['config', 'configure', 'settings', 'options'],
      'components': ['component', 'button', 'input', 'form', 'modal', 'card'],
      'api': ['api', 'method', 'function', 'parameter', 'props'],
      'styling': ['style', 'css', 'theme', 'design', 'color', 'class'],
      'routing': ['route', 'router', 'navigation', 'link'],
      'state': ['state', 'store', 'context', 'redux', 'vuex'],
      'hooks': ['hook', 'lifecycle', 'effect', 'memo'],
      'examples': ['example', 'demo', 'sample', 'tutorial'],
      'troubleshooting': ['error', 'issue', 'problem', 'debug', 'fix']
    };

    for (const [topic, keywords] of Object.entries(topicPatterns)) {
      for (const keyword of keywords) {
        if (queryLower.includes(keyword)) {
          topics.push(topic);
          break;
        }
      }
    }

    return {
      topics: [...new Set(topics)], // Remove duplicates
      primaryTopic: topics[0] || 'general'
    };
  }

  /**
   * Suggest query expansions
   */
  expandQuery(query, framework = null) {
    const queryLower = query.toLowerCase();
    const expansions = [query]; // Always include original

    // Add synonyms for common terms
    const synonyms = {
      'button': ['btn', 'button component'],
      'config': ['configuration', 'settings', 'options'],
      'install': ['installation', 'setup', 'getting started'],
      'style': ['styling', 'css', 'theme', 'design'],
      'use': ['using', 'usage', 'how to use']
    };

    for (const [term, syns] of Object.entries(synonyms)) {
      if (queryLower.includes(term)) {
        for (const syn of syns) {
          if (!queryLower.includes(syn)) {
            expansions.push(query.replace(new RegExp(term, 'gi'), syn));
          }
        }
      }
    }

    // Add framework-specific expansions if known
    if (framework) {
      const pattern = this.frameworkPatterns[framework];
      if (pattern && pattern.aliases.length > 0) {
        const alias = pattern.aliases[0];
        if (!queryLower.includes(alias)) {
          expansions.push(`${alias} ${query}`);
        }
      }
    }

    return expansions.slice(0, 5); // Limit to 5 expansions
  }

  /**
   * Get search strategy recommendation
   */
  getSearchStrategy(query, availableRepositories = []) {
    const detection = this.detectFramework(query, availableRepositories);
    const topic = this.extractTopic(query);

    return {
      strategy: detection.shouldUseScoped ? 'scoped' : 'global',
      primaryRepository: detection.topCandidate?.repositoryId || null,
      fallbackToGlobal: detection.shouldUseScoped, // Always run global as fallback
      confidence: detection.topCandidate?.confidence || 0,
      topic: topic.primaryTopic,
      queryExpansions: this.expandQuery(query, detection.topCandidate?.repositoryId),
      reasoning: detection.topCandidate?.reason || 'No framework detected, using global search'
    };
  }
}
