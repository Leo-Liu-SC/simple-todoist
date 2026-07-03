# Simple-todoist

A lightweight personal task manager built for AI-native workflows. It runs locally, stores everything in SQLite, and exposes a full REST API plus an MCP server so Claude Code (and other AI agents) can query and manage tasks without touching the UI.

## What it is

- **Web UI** — a Next.js task list with projects, labels, priorities, due dates, and a 7-state status workflow (`new → onme → delegated → blocked → notime → resultback → done`)
- **REST API** (`/api/v1`) — bearer-token authenticated endpoints for external scripts and apps
- **MCP server** — wraps the REST API as MCP tools so Claude Code can add, query, and update tasks natively in any conversation

The status model is designed around a GTD-style capture-and-triage flow: tasks land in `new`, you mark what's `onme` today, delegate or block the rest, and close with `done`.

## Stack

- Next.js 15 (App Router) · TypeScript
- Prisma + SQLite (local file, zero infra)
- MCP SDK (`@modelcontextprotocol/sdk`)

## Getting started

```bash
npm install
npx prisma migrate dev
npm run dev        # http://localhost:3000
```

Create a `.env.local` with:
```
API_TOKEN="your-secret-token"
```

## MCP setup (Claude Code)

Build the MCP server once:
```bash
cd mcp && npm install && npm run build
```

Add to your Claude Code `settings.json`:
```json
{
  "mcpServers": {
    "simple-todoist": {
      "command": "node",
      "args": ["/absolute/path/to/Simple-todoist/mcp/dist/index.js"]
    }
  }
}
```

The MCP server reads `API_TOKEN` from the app's `.env.local` automatically — no token config needed in Claude Code.

## REST API

See [API.md](API.md) for the full endpoint reference.

Base URL: `http://localhost:3000/api/v1`  
Auth: `Authorization: Bearer <API_TOKEN>`
