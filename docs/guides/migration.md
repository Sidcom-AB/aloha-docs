# Migration Guide

Convert your existing documentation to the Aloha standard using AI assistance.

## The AI-Powered Migration Workflow

This guide shows you how to use Claude (or another AI assistant) to automatically convert your documentation to the Aloha format.

### Step 1: Download the Aloha Standard

Visit [How To](http://localhost:3000/#howto) and click **Download Aloha Standard**.

This gives you `aloha-standard.md` - a complete specification that AI can read and follow.

### Step 2: Add Aloha MCP Server

Configure Claude Desktop to access Aloha Docs via MCP:

**macOS/Linux:**
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
notepad %APPDATA%\Claude\claude_desktop_config.json
```

Add:
```json
{
  "mcpServers": {
    "aloha-docs": {
      "command": "node",
      "args": ["/path/to/aloha-docs/server/index.js"]
    }
  }
}
```

Restart Claude Desktop.

### Step 3: Ask Claude to Migrate

Share your current documentation structure with Claude:

```
I need to convert my project's documentation to the Aloha format.

Current structure:
- README.md (5000 lines - contains everything)
- API.md (API reference)
- CONTRIBUTING.md

Read the Aloha documentation standard from aloha-docs MCP and help me:
1. Create the new folder structure
2. Split README into focused files
3. Organize into sections (getting-started, guides, api)
4. Ensure proper markdown formatting
```

### Step 4: Review AI's Plan

Claude will read the Aloha standard via MCP and provide:
- Recommended folder structure
- File splitting strategy
- Content organization plan

### Step 5: Execute Migration

Ask Claude to generate the files:

```
Generate the markdown files according to your plan. For each file,
provide the complete content following the Aloha standard.
```

### Step 6: Commit and Push

```bash
git add docs/
git commit -m "docs: migrate to Aloha standard"
git push
```

### Step 7: Add to Aloha Docs

Visit Aloha Docs and add your repository:

```
http://localhost:3000/#add
→ Enter your GitHub URL
→ Test discovery
→ Submit
```

### Step 8: Verify

Your docs are now:
- ✅ In the Aloha marketplace
- ✅ Accessible via MCP server
- ✅ Searchable by AI assistants

## Migration Examples

### Example 1: README-Heavy Project

**Before:**
```
my-framework/
├── README.md (10,000 lines)
└── src/
```

**AI Prompt:**
```
Read my README.md and the Aloha standard, then restructure into:
- docs/getting-started/introduction.md (overview)
- docs/getting-started/installation.md (install steps)
- docs/getting-started/quick-start.md (first example)
- docs/components/ (split component sections)
- docs/api/ (API reference)
```

**After:**
```
my-framework/
├── docs/
│   ├── getting-started/
│   │   ├── introduction.md
│   │   ├── installation.md
│   │   └── quick-start.md
│   ├── components/
│   │   ├── button.md
│   │   └── modal.md
│   └── api/
│       └── reference.md
├── README.md (short overview + link to docs)
└── src/
```

### Example 2: Docusaurus Migration

**Before:**
```
my-project/
├── docs/
│   ├── intro.md (with frontmatter)
│   ├── tutorial-basics/
│   └── tutorial-extras/
└── docusaurus.config.js
```

**AI Prompt:**
```
Remove Docusaurus frontmatter from all .md files and reorganize
according to Aloha standard. Convert docusaurus.config.js navigation
into aloha.json format.
```

**After:**
```
my-project/
├── docs/
│   ├── getting-started/
│   │   └── intro.md (frontmatter removed)
│   ├── tutorials/
│   │   ├── basics/
│   │   └── extras/
│   └── aloha.json (converted from docusaurus config)
└── docusaurus.config.js (keep for existing site)
```

### Example 3: Wiki to Docs

**Before:**
```
GitHub Wiki with many pages
```

**AI Prompt:**
```
Export my GitHub wiki and convert to Aloha format. Organize pages into
logical sections and ensure proper markdown formatting.
```

**After:**
```
my-repo/
└── docs/
    ├── getting-started/
    ├── guides/
    └── reference/
```

## AI Prompts Library

### Complete Migration Prompt

```
I need to migrate my project documentation to Aloha Docs format.

Step 1: Read the Aloha standard
Use the aloha-docs MCP server to read:
- Documentation guide
- Best practices
- Example structure

Step 2: Analyze my current docs
My structure:
[paste your current structure]

Step 3: Create migration plan
Propose:
- New folder structure
- File organization
- Content splits/merges
- Navigation order

Step 4: Generate new documentation
Create all markdown files following Aloha standard:
- Proper heading hierarchy
- Code blocks with language tags
- Tables for options/props
- Examples for each concept

Step 5: Generate aloha.json
Create metadata file with navigation structure.
```

### Validate Existing Docs

```
Read my existing docs/ folder and check against the Aloha standard.
List any issues:
- Missing H1 titles
- Code blocks without language
- Broken internal links
- Improper heading hierarchy
- Files in wrong locations
```

### Quick Cleanup

```
Read the Aloha documentation guide and fix these issues in my docs:
1. Ensure one H1 per file
2. Add language tags to code blocks
3. Standardize file names (lowercase-with-hyphens)
4. Fix relative links
```

## Manual Migration Steps

If you prefer manual migration:

### 1. Create Folder Structure

```bash
mkdir -p docs/{getting-started,guides,api,components}
```

### 2. Split Large Files

Identify sections in your README:
- Intro → `docs/getting-started/introduction.md`
- Install → `docs/getting-started/installation.md`
- Usage → `docs/getting-started/quick-start.md`
- API → `docs/api/reference.md`

### 3. Standardize Markdown

For each file:
- [ ] One H1 (`#`) title at top
- [ ] Use H2 (`##`) for main sections
- [ ] Use H3 (`###`) for subsections
- [ ] Add language to code blocks
- [ ] Create tables for props/options
- [ ] Add examples

### 4. Update Links

Convert absolute to relative links:
```markdown
Before: [Link](/docs/page.md)
After:  [Link](./page.md)
```

### 5. Test Locally

Add to Aloha and verify:
```bash
npm start
# Visit http://localhost:3000
# Add your repo
# Check navigation
```

## Post-Migration Checklist

After migration, verify:

- [ ] All sections have a README or index file
- [ ] File names use lowercase-with-hyphens
- [ ] Each file has one H1 title
- [ ] Code blocks have language specified
- [ ] Internal links work
- [ ] Tables are properly formatted
- [ ] Navigation is logical
- [ ] Examples are included
- [ ] Auto-discovery works in Aloha

## Maintaining Documentation

### Keep Docs Updated

```bash
# Update docs with code changes
git add docs/
git commit -m "docs: update API reference for v2.0"
```

Aloha automatically picks up changes (5-minute cache).

### Version Documentation

Create version-specific folders:
```
docs/
├── v1/
│   └── api/
├── v2/
│   └── api/
└── latest/ → v2/ (symlink)
```

### Continuous Integration

Add docs validation to CI:

```yaml
# .github/workflows/docs.yml
name: Validate Docs
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate with Aloha
        run: |
          curl -X POST http://aloha-docs.example.com/api/validate \
            -H "Content-Type: application/json" \
            -d '{"url":"${{ github.repository_url }}"}'
```

## Getting Help

### Common Issues

**"Auto-discovery failed"**
- Ensure `docs/` folder exists
- Check folder names (lowercase, hyphens)
- Verify markdown files are valid

**"No navigation appearing"**
- Add `aloha.json` with navigation structure
- Or ensure folders are properly named

**"Links broken"**
- Use relative links (`./file.md`)
- Avoid absolute paths

### Ask the Community

- GitHub Issues: [aloha-docs/issues](https://github.com/Sidcom-AB/aloha-docs/issues)
- MCP Community: Use Claude to read Aloha docs and help troubleshoot!

## Next Steps

- [Documentation Guide](./documentation-guide.md) - Writing best practices
- [MCP Usage](./mcp-usage.md) - Use AI with your migrated docs
