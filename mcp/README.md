# Simple-todoist MCP server

An MCP (Model Context Protocol) server that lets agents like Claude Code
manage your tasks natively — wrapping the app's `/api/v1` REST endpoints.

## Tools

| Tool | What it does |
|---|---|
| `query_tasks` | List/filter tasks (status, project, title search, includeDone, limit) |
| `get_task` | Fetch one task with its subtasks |
| `add_task` | Create a task (only `title` required) |
| `set_status` | Change a task's status (use `done` to complete) |
| `update_task` | Update any field(s) of a task |
| `delete_task` | Delete a task |
| `list_projects` | List projects to resolve `projectId` |
| `list_labels` | List labels to resolve `labelIds` |

Statuses: `new, onme, delegated, blocked, notime, resultback, done`.
Priority: `1`=urgent … `4`=none.

## Setup

```bash
cd mcp
npm install
npm run build
```

## Auth

The server needs the app's API bearer token. It resolves it in this order:
1. `TODOIST_API_TOKEN` env var (if set)
2. Otherwise reads `API_TOKEN` from the app's `.env.local` automatically

So the MCP client config needs **no secret**. Base URL defaults to
`http://localhost:3000` (override with `TODOIST_API_URL`).

## Register with Claude Code

Already registered at project scope in `.mcp.json`:

```json
{
  "mcpServers": {
    "simple-todoist": {
      "type": "stdio",
      "command": "node",
      "args": ["<abs-path>/mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

On the next `claude` launch you'll be prompted to approve the project MCP
server. The app dev server (`npm run dev`) must be running for the tools to work.

## Prerequisite

Run `npm run build` after cloning (the compiled `dist/` is gitignored).
