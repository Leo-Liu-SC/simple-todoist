---
name: simple-todoist
description: Use Simple-todoist's MCP tools to manage personal tasks, projects, labels, subtasks, priorities, due dates, and workflow statuses. Use when the user asks to list, search, create, inspect, update, complete, delete, organize, or triage tasks in Simple-todoist through the app's MCP server.
---

# Simple-todoist

Use the `mcp__simple_todoist` MCP tools as the source of truth for Simple-todoist task operations. Prefer the MCP tools over editing the database or calling REST endpoints directly.

## Capabilities

- `query_tasks`: List or search tasks. Use `status`, `projectId`, `q`, `includeDone`, and `limit` to narrow results.
- `get_task`: Fetch one task by id, including subtasks.
- `add_task`: Create a task or subtask. Only `title` is required.
- `update_task`: Patch one or more task fields.
- `set_status`: Change a task status; use `done` to complete.
- `delete_task`: Delete a task by id.
- `list_projects`: Resolve project ids before assigning `projectId`.
- `list_labels`: Resolve label ids before assigning `labelIds`.

Statuses are `new`, `onme`, `delegated`, `blocked`, `notime`, `resultback`, and `done`.

Priorities are numeric: `1` urgent, `2` high, `3` medium, `4` none.

## Workflow

1. Read before mutating. Use `query_tasks`, `get_task`, `list_projects`, or `list_labels` to resolve ids and current state.
2. Confirm destructive or broad changes before calling `delete_task` or bulk-updating many tasks.
3. Use the narrowest tool for the change: `set_status` for status-only changes, `update_task` for field patches, `add_task` for new tasks.
4. Send only changed fields to `update_task`; use `null` only when the user intends to clear `dueDate` or `projectId`.
5. After mutations, verify with `get_task` for a single task or `query_tasks` for list-level changes.

## Task Creation

When the user asks to capture a task, infer a concise `title` and use optional fields only when clearly provided:

- `description`: Rich text or HTML notes.
- `dueDate`: ISO-like date string such as `2026-07-16`.
- `priority`: `1` to `4`.
- `status`: Default is `new` unless the user names a workflow bucket.
- `projectId`: Call `list_projects` when the project is named.
- `parentId`: Use when creating a subtask under an existing task.
- `labelIds`: Call `list_labels` when labels are named.

## Common Requests

- "What is on me?" -> `query_tasks` with `status: "onme"` and usually `includeDone: false`.
- "Show blocked tasks" -> `query_tasks` with `status: "blocked"` and `includeDone: false`.
- "Mark task 42 done" -> `set_status` with `id: 42`, `status: "done"`, then `get_task`.
- "Move this to Project X" -> `list_projects`, then `update_task` with the resolved `projectId`.
- "Add this as a subtask" -> identify the parent with `query_tasks` or `get_task`, then `add_task` with `parentId`.

## Local Server Notes

The MCP server is configured in `.codex/config.toml` as `simple-todoist` and runs `node mcp/dist/index.js`. If tools fail because the server is unavailable, build it with `cd mcp && npm run build` and start the app dev server with `npm run dev`; the MCP server reads `API_TOKEN` from `.env.local` unless `TODOIST_API_TOKEN` is set.
