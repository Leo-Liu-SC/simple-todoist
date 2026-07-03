import { Priority, Status, ColumnConfig } from "./types";

// Fixed widths (px) for each optional column. Shared by the list header row
// and every task row so a CSS grid keeps them aligned — empty cells render
// where a task has no value for that column.
export const COL_WIDTHS = {
  status: 118,
  project: 120,
  dueDate: 84,
  priority: 96,
  labels: 150,
} as const;

// Column order in the row: checkbox | STATUS | PROJECT | task (flex) | due | priority | labels.
// "status" and "project" sit before the flex title; the rest trail after it.
export const LEADING_COLS = ["status", "project"] as const;
export const TRAILING_COLS = ["dueDate", "priority", "labels"] as const;

// Build the grid-template-columns string honoring the column order above.
// The title is capped (not 1fr) and a trailing 1fr spacer absorbs leftover
// width, so due/priority/labels sit right after the title instead of being
// pushed to the far right edge.
export function gridTemplate(columns: ColumnConfig): string {
  const lead = LEADING_COLS.filter((k) => columns[k]).map((k) => `${COL_WIDTHS[k]}px`).join(" ");
  const trail = TRAILING_COLS.filter((k) => columns[k]).map((k) => `${COL_WIDTHS[k]}px`).join(" ");
  return [`40px`, lead, `minmax(120px,420px)`, trail, `1fr`].filter(Boolean).join(" ");
}

// Single source of truth for priority + status metadata, used across
// list, board, detail, and quick-add so labels/colors stay consistent.

export const PRIORITIES: { value: Priority; label: string; dot: string; ring: string; text: string }[] = [
  { value: 1, label: "Urgent", dot: "bg-red-500", ring: "border-red-400 hover:border-red-500", text: "text-red-500" },
  { value: 2, label: "High", dot: "bg-orange-500", ring: "border-orange-400 hover:border-orange-500", text: "text-orange-500" },
  { value: 3, label: "Medium", dot: "bg-blue-500", ring: "border-blue-400 hover:border-blue-500", text: "text-blue-500" },
  { value: 4, label: "Low", dot: "bg-slate-300", ring: "border-slate-300 hover:border-slate-400", text: "text-slate-400" },
];

export const PRIORITY_BY_VALUE = Object.fromEntries(PRIORITIES.map((p) => [p.value, p])) as Record<Priority, (typeof PRIORITIES)[number]>;

export const STATUSES: { value: Status; label: string; dot: string; pill: string }[] = [
  { value: "new", label: "New", dot: "bg-slate-400", pill: "bg-slate-100 text-slate-600" },
  { value: "onme", label: "On me", dot: "bg-indigo-500", pill: "bg-indigo-100 text-indigo-700" },
  { value: "delegated", label: "Delegated", dot: "bg-violet-500", pill: "bg-violet-100 text-violet-700" },
  { value: "blocked", label: "Blocked", dot: "bg-red-500", pill: "bg-red-100 text-red-700" },
  { value: "notime", label: "Not the time", dot: "bg-slate-400", pill: "bg-slate-100 text-slate-500" },
  { value: "resultback", label: "Result back", dot: "bg-amber-500", pill: "bg-amber-100 text-amber-700" },
  { value: "done", label: "Done", dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-700" },
];

// Default status for newly-created tasks.
export const DEFAULT_STATUS: Status = "new";

// Rank of a status for sorting (its position in STATUSES). Unknown → end.
export function statusRank(value: string): number {
  const i = STATUSES.findIndex((s) => s.value === value);
  return i === -1 ? STATUSES.length : i;
}

const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.value, s])) as Record<Status, (typeof STATUSES)[number]>;

// Safe lookup: unknown/legacy status values fall back to "new" so the UI
// never renders undefined (e.g. rows created before the status set changed).
export function statusMeta(value: string) {
  return STATUS_MAP[value as Status] ?? STATUS_MAP.new;
}

export const STATUS_BY_VALUE = STATUS_MAP;
