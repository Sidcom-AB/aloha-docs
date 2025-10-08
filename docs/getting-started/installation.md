# Installation

Get Aloha Docs running locally in minutes.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- **Git**
- **GitHub Account** (for adding private repositories)

## Quick Install

### Clone the Repository

```bash
git clone https://github.com/Sidcom-AB/aloha-docs.git
cd aloha-docs
```

### Install Dependencies

```bash
npm install
```

### Environment Configuration (Optional)

Create a `.env` file for GitHub token (needed for private repos):

```bash
# .env
GITHUB_TOKEN=ghp_your_token_here
PORT=3000
```

**Getting a GitHub Token:**
1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (for private repos) or `public_repo` (for public only)
4. Copy the token to your `.env` file

### Start the Server

```bash
npm start
```

The server will start at `http://localhost:3000`

## Development Mode

For auto-reload during development:

```bash
npm run dev
```

Uses Node's `--watch` flag to restart on file changes.

## Docker Installation

### Using Docker Compose

```bash
docker-compose up -d
```

### Manual Docker Build

```bash
docker build -t aloha-docs .
docker run -p 3000:3000 -e GITHUB_TOKEN=your_token aloha-docs
```

## Verify Installation

Open your browser to `http://localhost:3000` and you should see:
- ✅ Aloha Docs marketplace homepage
- ✅ Sample framework (Aloha Sample) pre-loaded
- ✅ Navigation working (Home, Browse, Add, How To)

## Troubleshooting

### Port Already in Use

If port 3000 is taken, change it in `.env`:

```bash
PORT=8080
```

### GitHub API Rate Limiting

Without a token, you're limited to 60 requests/hour. Add a `GITHUB_TOKEN` to increase to 5,000/hour.

### Module Not Found Errors

Ensure you're using Node.js 18+:

```bash
node --version
```

If using ES modules, make sure `package.json` has:

```json
{
  "type": "module"
}
```

## Next Steps

- [Quick Start Guide](./quick-start.md) - Add your first framework
- [MCP Server Setup](../guides/mcp-usage.md) - Connect AI assistants
