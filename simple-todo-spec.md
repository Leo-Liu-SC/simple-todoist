# Simple-todoist — Product Spec

## App Concept

- Personal Todoist-inspired task manager, web-first (mobile + desktop)
- Single-user authentication
- SQLite backend
- REST API reserved for future mobile app integration

---

## Authentication

- Single-user login with password
- Bearer-token API for external integrations

---

## Task Fields & Columns

| Field | Notes |
|---|---|
| Status | Custom statuses (see below) |
| Project | Editable via popover; supports sub-project hierarchy with indent |
| Task title | Wraps up to two lines; bold for parent tasks with subtasks |
| Due date | Color-coded (see below) |
| Priority | Popover menu; options: Urgent, High, Medium, Low |
| Labels | Multiple labels per task |

- All columns left-aligned
- All columns resizable (including title)
- Column order: Status → Project → Task title → Due → Priority → Labels

---

## Task Status

Custom statuses (in order):

1. New
2. On me
3. Delegated
4. Blocked
5. Not the time
6. Result back
7. Done

Status changes via popover/dialog — not inline edit.

---

## Due Date Color Coding

| Condition | Color |
|---|---|
| Overdue | Red |
| Due within 1 day | Amber |
| Due within 1 week | Green |
| Due beyond 1 week | Gray |

---

## Task List Page (UX)

- Click task title or double-click row → opens task detail modal
- Search bar: centered at top
- Parent tasks: bold text
- Subtask-count badge displayed at front of parent task title
- Subtasks: indented under parent, checkbox and status do not overlap

---

## Task Detail Modal

- Centered modal (not a side panel)
- Hypertext detail field with editing
- Modal tall enough to avoid clipping toggle/buttons
- "Mark it done" button style consistent with list page
- "Mark it done" and Delete buttons grouped together
- Subtask list with "Add subtask" button at the bottom

---

## Left Sidebar

- Resizable
- Sections: Today, Upcoming, All tasks
- Projects section: hash (#) icon per project, count badge for task count
- Sub-projects: indented with # icon
- Labels section: tag icon per label

---

## Branding

- App name: **Simpletodo**
- Custom logo: swoosh check design
- Browser tab title: "Simple-todoist"

---

## External API (`/api/v1`)

- Bearer-token authentication
- Endpoints: query tasks, change status, add tasks
- Designed for use by Claude Code, mobile apps, and other external clients

---

## MCP Server

- MCP server built for agent-native task management
- Integrated into second-brain and myPA projects
- Codex configured to pick up MCP from myPA

---

## Deferred / Not Planned

- ClickUp import (cancelled)
