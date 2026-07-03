# Simple-todoist External API (v1)

A bearer-token REST API for external apps (Claude Code, scripts, mobile) to
query tasks, change status, and add tasks. Separate from the cookie-based web
session.

## Authentication

Every request needs an `Authorization` header:

```
Authorization: Bearer <API_TOKEN>
```

The token is the `API_TOKEN` value in `.env.local`. Requests without it (or with
a wrong token) return `401`.

Base URL (local): `http://localhost:3000/api/v1`

## Status values

`new` · `onme` · `delegated` · `blocked` · `notime` · `resultback` · `done`

## Priority values

`1` = Urgent · `2` = High · `3` = Medium · `4` = None

---

## Endpoints

### List / query tasks
```
GET /api/v1/tasks
```
Query params (all optional):
| param | meaning |
|---|---|
| `status` | filter by exact status |
| `projectId` | filter by project |
| `q` | title contains (search) |
| `includeDone=false` | exclude done tasks |
| `parentId` | `null` for root tasks only, or a task id for its subtasks |
| `limit` | max results (default 100, max 500) |

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/tasks?includeDone=false&status=onme"
```

### Get one task (with subtasks)
```
GET /api/v1/tasks/{id}
```

### Create a task
```
POST /api/v1/tasks
```
Body — `title` required; the rest optional:
```json
{
  "title": "Prepare WBR deck",
  "description": "<p>rich text html</p>",
  "dueDate": "2026-07-10",
  "priority": 2,
  "status": "onme",
  "projectId": 1,
  "parentId": null,
  "labelIds": [1]
}
```
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Call vendor","priority":2}' \
  http://localhost:3000/api/v1/tasks
```

### Update a task (change status or any field)
```
PATCH /api/v1/tasks/{id}
```
Send only the fields to change:
```bash
curl -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"done"}' \
  http://localhost:3000/api/v1/tasks/10
```

### Delete a task
```
DELETE /api/v1/tasks/{id}
```

### Lookups (resolve IDs)
```
GET /api/v1/projects   → { projects: [{ id, name, color, parentId }] }
GET /api/v1/labels     → { labels:   [{ id, name, color }] }
```

---

## Responses

- Success: `{ "task": {...} }`, `{ "tasks": [...] }`, `{ "projects": [...] }`, or `{ "ok": true }`
- Errors: `{ "error": "message" }` with HTTP `400` (bad input), `401` (auth), `404` (not found)

## Notes for AI agents (e.g. Claude Code)

- Statuses are a fixed enum (above) — invalid values return `400` with the valid list.
- To create a task under a project, first `GET /api/v1/projects` to resolve the `projectId`.
- Completing a task = `PATCH {"status":"done"}`.
