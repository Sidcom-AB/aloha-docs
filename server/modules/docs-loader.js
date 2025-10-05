import { readFile, readdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { marked } from 'marked';
import { config } from './config.js';

export class DocsLoader {
  constructor() {
    this.docs = new Map();
    this.schemas = new Map();
    this.components = new Map();
    this.tableOfContents = null;
  }
  
  async loadAll() {
    await this.loadTableOfContents();
    await this.loadSchemas();
    await this.loadMarkdownFiles();
    await this.generateComponentDocs();
  }
  
  async loadTableOfContents() {
    try {
      const content = await readFile(config.paths.tableOfContents, 'utf-8');
      this.tableOfContents = JSON.parse(content);
      console.log('Loaded table of contents');
    } catch (error) {
      console.warn('Could not load table of contents:', error.message);
      this.tableOfContents = { sections: [] };
    }
  }
  
  async loadSchemas() {
    try {
      const entries = await readdir(config.paths.schemas, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.schema.json')) {
          const fullPath = join(config.paths.schemas, entry.name);
          const content = await readFile(fullPath, 'utf-8');
          const name = entry.name.replace('.schema.json', '');
          
          try {
            const schema = JSON.parse(content);
            this.schemas.set(name, schema);
            
            // Handle both components and tokens
            if (schema.tagName) {
              this.components.set(schema.tagName, schema);
              this.components.set(name, schema);
            }
          } catch (e) {
            console.warn(`Invalid schema JSON in ${entry.name}`);
          }
        }
      }
      
      console.log(`Loaded ${this.schemas.size} schemas`);
    } catch (error) {
      console.warn('Could not load schemas:', error.message);
    }
  }
  
  async loadMarkdownFiles() {
    try {
      const contentPath = join(config.paths.root, 'content');
      const entries = await readdir(contentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const fullPath = join(contentPath, entry.name);
          const content = await readFile(fullPath, 'utf-8');
          const doc = await this.processMarkdown(content, entry.name);
          
          // Use filename without extension as key
          const key = entry.name.replace('.md', '');
          this.docs.set(key, doc);
        }
      }
      
      console.log(`Loaded ${this.docs.size} markdown files`);
    } catch (error) {
      console.warn('Could not load markdown files:', error.message);
    }
  }
  
  async generateComponentDocs() {
    for (const [name, schema] of this.schemas) {
      const docKey = `components/${name}`;
      
      const doc = {
        path: docKey,
        title: schema.title || name,
        type: name === 'tokens' ? 'tokens' : 'component',
        tags: ['component', name, ...(schema.tags || [])],
        schema: schema,
        content: this.schemaToMarkdown(schema),
        html: marked(this.schemaToMarkdown(schema))
      };
      
      this.docs.set(docKey, doc);
    }
    
    console.log(`Generated ${this.schemas.size} docs from schemas`);
  }
  
  schemaToMarkdown(schema) {
    let markdown = `# ${schema.title}\n\n`;
    markdown += `${schema.description}\n\n`;
    
    // Special handling for tokens
    if (schema.tokens) {
      markdown += this.renderTokensMarkdown(schema.tokens);
    }
    
    if (schema.tagName) {
      markdown += `**Tag:** \`<${schema.tagName}>\`\n\n`;
    }
    
    if (schema.examples && schema.examples.length > 0) {
      markdown += `## Examples\n\n`;
      schema.examples.forEach(ex => {
        markdown += `### ${ex.title}\n\n`;
        markdown += '```' + (ex.language || 'html') + '\n' + ex.code + '\n```\n\n';
      });
    }
    
    if (schema.properties && Object.keys(schema.properties).length > 0) {
      markdown += `## Properties\n\n`;
      markdown += `| Property | Type | Default | Description |\n`;
      markdown += `|----------|------|---------|-------------|\n`;
      
      for (const [name, prop] of Object.entries(schema.properties)) {
        const type = prop.enum ? prop.enum.join(' \\| ') : prop.type;
        markdown += `| ${name} | ${type} | ${prop.default !== undefined ? JSON.stringify(prop.default) : '-'} | ${prop.description || '-'} |\n`;
      }
      markdown += '\n';
    }
    
    if (schema.events && schema.events.length > 0) {
      markdown += `## Events\n\n`;
      markdown += `| Event | Type | Description |\n`;
      markdown += `|-------|------|-------------|\n`;
      schema.events.forEach(event => {
        markdown += `| ${event.name} | ${event.type || 'Event'} | ${event.description || '-'} |\n`;
      });
      markdown += '\n';
    }
    
    if (schema.slots && schema.slots.length > 0) {
      markdown += `## Slots\n\n`;
      markdown += `| Slot | Description |\n`;
      markdown += `|------|-------------|\n`;
      schema.slots.forEach(slot => {
        const name = slot.name || 'default';
        markdown += `| ${name} | ${slot.description || '-'} |\n`;
      });
      markdown += '\n';
    }
    
    if (schema.cssParts && schema.cssParts.length > 0) {
      markdown += `## CSS Parts\n\n`;
      schema.cssParts.forEach(part => {
        markdown += `- \`::part(${part.name})\` - ${part.description}\n`;
      });
      markdown += '\n';
    }
    
    if (schema.cssProperties && schema.cssProperties.length > 0) {
      markdown += `## CSS Properties\n\n`;
      markdown += `| Property | Description | Default |\n`;
      markdown += `|----------|-------------|----------|\n`;
      schema.cssProperties.forEach(prop => {
        markdown += `| ${prop.name} | ${prop.description} | ${prop.default || '-'} |\n`;
      });
      markdown += '\n';
    }
    
    return markdown;
  }
  
  renderTokensMarkdown(tokens) {
    let markdown = '';
    
    for (const [category, values] of Object.entries(tokens)) {
      markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      
      if (typeof values === 'object') {
        markdown += `| Token | Value |\n`;
        markdown += `|-------|-------|\n`;
        
        const flatTokens = this.flattenTokens(values);
        for (const [key, value] of Object.entries(flatTokens)) {
          markdown += `| ${key} | \`${value}\` |\n`;
        }
        markdown += '\n';
      }
    }
    
    return markdown;
  }
  
  flattenTokens(obj, prefix = '') {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}-${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flattenTokens(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
    
    return result;
  }
  
  async processMarkdown(content, filename) {
    let title = basename(filename, '.md')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    let type = 'document';
    let tags = [];
    
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1];
    }
    
    const tagsMatch = content.match(/tags:\s*\[([^\]]+)\]/);
    if (tagsMatch) {
      tags = tagsMatch[1].split(',').map(t => t.trim());
    }
    
    // Determine type from tags or filename
    if (tags.includes('guide')) type = 'guide';
    else if (tags.includes('api')) type = 'api';
    else if (filename.includes('api')) type = 'api';
    
    return {
      path: filename.replace('.md', ''),
      filename: filename,
      title,
      type,
      tags,
      content,
      html: marked(content)
    };
  }
  
  getAllDocs() {
    return Array.from(this.docs.values());
  }
  
  getDoc(path) {
    return this.docs.get(path) || null;
  }
  
  getSchema(name) {
    return this.schemas.get(name) || null;
  }
  
  getComponent(name) {
    return this.components.get(name) || null;
  }
  
  getDesignTokens() {
    // Return tokens from the tokens schema
    const tokensSchema = this.schemas.get('tokens');
    return tokensSchema?.tokens || {};
  }
  
  getTableOfContents() {
    return this.tableOfContents || { sections: [] };
  }
  
  // Generate navigation structure from table of contents
  getNavigation() {
    if (!this.tableOfContents) return [];
    
    return this.tableOfContents.sections.map(section => {
      if (section.type === 'schemas') {
        // Auto-populate from schemas folder
        return {
          title: section.title,
          description: section.description,
          items: Array.from(this.schemas.entries())
            .sort((a, b) => {
              // Put tokens last
              if (a[0] === 'tokens') return 1;
              if (b[0] === 'tokens') return -1;
              // Sort others alphabetically
              return a[1].title?.localeCompare(b[1].title) || 0;
            })
            .map(([name, schema]) => ({
              title: schema.title || name,
              path: `components/${name}`,
              description: schema.description?.substring(0, 80)
            }))
        };
      } else {
        // Regular sections with items
        return {
          ...section,
          items: (section.items || []).map(item => ({
            ...item,
            path: item.file ? item.file.replace('content/', '').replace('.md', '') : item.path
          }))
        };
      }
    });
  }
  
  // Generate custom elements manifest from schemas
  getCustomElements() {
    const modules = [];
    
    for (const [name, schema] of this.components) {
      if (schema.tagName) {
        modules.push({
          kind: 'javascript-module',
          path: `components/${name}.js`,
          declarations: [{
            kind: 'class',
            name: schema.className || name,
            tagName: schema.tagName,
            description: schema.description,
            customElement: true,
            attributes: Object.entries(schema.properties || {}).map(([key, prop]) => ({
              name: key,
              type: prop.type,
              default: prop.default,
              description: prop.description
            })),
            events: schema.events || [],
            slots: schema.slots || [],
            cssParts: schema.cssParts || [],
            cssProperties: schema.cssProperties || []
          }]
        });
      }
    }
    
    return { 
      schemaVersion: '1.0.0',
      readme: 'Aloha Framework Web Components',
      modules 
    };
  }
}