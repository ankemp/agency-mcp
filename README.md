# agency-mcp

A **JIT Agent Router** — an MCP (Model Context Protocol) server that indexes AI agent system prompts from a GitHub repository and exposes them as searchable tools for LLMs.

## How It Works

1. **Hydration** — On startup the server fetches the full file tree from the configured GitHub repo, downloads every `.md` agent file, and builds an in-memory fuzzy search index (Fuse.js).
2. **search_agents** — An LLM calls this tool with a natural-language description of the task. The server returns the top 5 matching agents with snippets so the LLM can pick the best one.
3. **get_agent_prompt** — The LLM requests the full markdown text for a specific agent and uses it as its active system prompt.

## Quick Start

The easiest way to run agency-mcp is directly from GitHub — no local clone required:

```bash
npx github:ankemp/agency-mcp
```

To pin a specific release:

```bash
npx github:ankemp/agency-mcp#v1.0.0
```

### Local Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
npm start
```

## Environment Variables

| Variable        | Default                      | Description                                                     |
| --------------- | ---------------------------- | --------------------------------------------------------------- |
| `GITHUB_REPO`   | `msitarzewski/agency-agents` | `owner/repo` of the agents repository                           |
| `GITHUB_BRANCH` | `main`                       | Branch to index                                                 |
| `GITHUB_PAT`    | *(none)*                     | GitHub Personal Access Token — raises API rate limits from 60→5000/hr |

## Claude Desktop Integration

Add the following to your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "agency-mcp": {
      "command": "npx",
      "args": ["-y", "github:ankemp/agency-mcp"],
      "env": {
        "GITHUB_PAT": "ghp_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

To pin a specific release, replace `github:ankemp/agency-mcp` with `github:ankemp/agency-mcp#v1.0.0`.

Add your GitHub PAT (optional but recommended — raises API rate limits from 60→5000/hr).

Restart Claude Desktop after editing the config.

## Tools

### `search_agents`

| Parameter | Type   | Description                                      |
| --------- | ------ | ------------------------------------------------ |
| `query`   | string | A description of the task or agent you need       |

Returns the top 5 matches with `filepath`, `category`, `filename`, `score`, and `contentSnippet`.

### `get_agent_prompt`

| Parameter  | Type   | Description                                           |
| ---------- | ------ | ----------------------------------------------------- |
| `filepath` | string | Exact repo-relative path (from `search_agents` results) |

Returns the full markdown system prompt for the agent.
