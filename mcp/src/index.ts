#!/usr/bin/env node
/**
 * Simple-todoist MCP server.
 *
 * Wraps the app's /api/v1 REST endpoints as MCP tools so agents (Claude Code,
 * etc.) can query, add, and update tasks natively.
 *
 * Config via env (all optional):
 *   TODOIST_API_URL    base URL (default http://localhost:3000)
 *   TODOIST_API_TOKEN  bearer token. If unset, falls back to reading API_TOKEN
 *                      from the app's .env.local — so the MCP config need not
 *                      contain the secret.
 *   TODOIST_ENV_FILE   path to the .env.local to read the token from
 *                      (default: ../.env.local relative to this file)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { z } from "zod";

const BASE = (process.env.TODOIST_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Resolve the bearer token: explicit env wins, else read API_TOKEN from the
// app's .env.local (keeping the secret out of the MCP client config).
function resolveToken(): string {
  if (process.env.TODOIST_API_TOKEN) return process.env.TODOIST_API_TOKEN;
  const here = dirname(fileURLToPath(import.meta.url));
  const envPath = process.env.TODOIST_ENV_FILE ?? resolve(here, "../../.env.local");
  try {
    const content = readFileSync(envPath, "utf8");
    const m = content.match(/^API_TOKEN\s*=\s*"?([^"\n]+)"?/m);
    if (m) return m[1];
  } catch { /* fall through */ }
  return "";
}
const TOKEN = resolveToken();

const STATUSES = ["new", "onme", "delegated", "blocked", "notime", "resultback", "done"] as const;

// Thin fetch wrapper against /api/v1 with bearer auth + uniform error text.
async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = (json as { error?: string })?.error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
function fail(e: unknown) {
  return {
    content: [{ type: "text" as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
    isError: true,
  };
}

const server = new McpServer({ name: "simple-todoist", version: "1.0.0" });

// --- query_tasks -----------------------------------------------------------
server.tool(
  "query_tasks",
  "List/query tasks. Filter by status, project, or title text. Statuses: " + STATUSES.join(", "),
  {
    status: z.enum(STATUSES).optional().describe("Filter by exact status"),
    projectId: z.number().optional().describe("Filter by project id"),
    q: z.string().optional().describe("Title contains (search)"),
    includeDone: z.boolean().optional().describe("Include done tasks (default true)"),
    limit: z.number().optional().describe("Max results (default 100)"),
  },
  async ({ status, projectId, q, includeDone, limit }) => {
    try {
      const p = new URLSearchParams();
      if (status) p.set("status", status);
      if (projectId) p.set("projectId", String(projectId));
      if (q) p.set("q", q);
      if (includeDone === false) p.set("includeDone", "false");
      if (limit) p.set("limit", String(limit));
      const data = await api(`/tasks?${p.toString()}`);
      return ok(data);
    } catch (e) { return fail(e); }
  }
);

// --- get_task --------------------------------------------------------------
server.tool(
  "get_task",
  "Get a single task by id, including its subtasks.",
  { id: z.number().describe("Task id") },
  async ({ id }) => {
    try { return ok(await api(`/tasks/${id}`)); } catch (e) { return fail(e); }
  }
);

// --- add_task --------------------------------------------------------------
server.tool(
  "add_task",
  "Create a task. Only 'title' is required. Priority 1=urgent … 4=none.",
  {
    title: z.string().describe("Task title (required)"),
    description: z.string().optional().describe("Rich-text/HTML description"),
    dueDate: z.string().optional().describe("Due date, e.g. 2026-07-10"),
    priority: z.number().min(1).max(4).optional().describe("1=urgent 2=high 3=medium 4=none"),
    status: z.enum(STATUSES).optional().describe("Initial status (default new)"),
    projectId: z.number().optional().describe("Project id (see list_projects)"),
    parentId: z.number().optional().describe("Parent task id to make this a subtask"),
    labelIds: z.array(z.number()).optional().describe("Label ids to attach"),
  },
  async (args) => {
    try { return ok(await api("/tasks", { method: "POST", body: JSON.stringify(args) })); }
    catch (e) { return fail(e); }
  }
);

// --- set_status ------------------------------------------------------------
server.tool(
  "set_status",
  "Change a task's status. Statuses: " + STATUSES.join(", ") + ". Use 'done' to complete.",
  {
    id: z.number().describe("Task id"),
    status: z.enum(STATUSES).describe("New status"),
  },
  async ({ id, status }) => {
    try { return ok(await api(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })); }
    catch (e) { return fail(e); }
  }
);

// --- update_task -----------------------------------------------------------
server.tool(
  "update_task",
  "Update any field(s) of a task. Send only the fields to change.",
  {
    id: z.number().describe("Task id"),
    title: z.string().optional(),
    description: z.string().optional(),
    dueDate: z.string().nullable().optional().describe("null clears the due date"),
    priority: z.number().min(1).max(4).optional(),
    status: z.enum(STATUSES).optional(),
    projectId: z.number().nullable().optional(),
    labelIds: z.array(z.number()).optional(),
  },
  async ({ id, ...patch }) => {
    try { return ok(await api(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) })); }
    catch (e) { return fail(e); }
  }
);

// --- delete_task -----------------------------------------------------------
server.tool(
  "delete_task",
  "Delete a task by id.",
  { id: z.number().describe("Task id") },
  async ({ id }) => {
    try { return ok(await api(`/tasks/${id}`, { method: "DELETE" })); } catch (e) { return fail(e); }
  }
);

// --- list_projects ---------------------------------------------------------
server.tool(
  "list_projects",
  "List projects (id, name, color) to resolve projectId when adding tasks.",
  {},
  async () => { try { return ok(await api("/projects")); } catch (e) { return fail(e); } }
);

// --- list_labels -----------------------------------------------------------
server.tool(
  "list_labels",
  "List labels (id, name, color) to resolve labelIds.",
  {},
  async () => { try { return ok(await api("/labels")); } catch (e) { return fail(e); } }
);

const transport = new StdioServerTransport();
await server.connect(transport);
