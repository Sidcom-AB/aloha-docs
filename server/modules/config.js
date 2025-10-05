import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

dotenvConfig();

export const config = {
  port: process.env.PORT || 3000,
  apiKey: process.env.API_KEY || 'dev-key-123',
  
  // GitHub API token (optional, for higher rate limits)
  githubToken: process.env.GITHUB_TOKEN || null,
  
  // Cache settings
  cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300000'), // 5 minutes
  
  rateLimit: {
    windowMs: 60000,
    max: 100
  },
  
  // Repository configuration path
  repositoriesConfig: process.env.REPOS_CONFIG || './config/repositories.json'
};