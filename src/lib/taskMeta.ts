import { Priority, Status } from "./types";

// Single source of truth for priority + status metadata, used across
// list, board, detail, and quick-add so labels/colors stay consistent.

export const PRIORITIES: { value: Priority; label: string; dot: string; ring: string; text: string }[] = [
  { value: 1, label: "Urgent", dot: "bg-red-500", ring: "border-red-400 hover:border-red-500", text: "text-red-500" },
  { value: 2, label: "High", dot: "bg-orange-500", ring: "border-orange-400 hover:border-orange-500", text: "text-orange-500" },
  { value: 3, label: "Medium", dot: "bg-blue-500", ring: "border-blue-400 hover:border-blue-500", text: "text-blue-500" },
  { value: 4, label: "No priority", dot: "bg-slate-300", ring: "border-slate-300 hover:border-slate-400", text: "text-slate-400" },
];

export const PRIORITY_BY_VALUE = Object.fromEntries(PRIORITIES.map((p) => [p.value, p])) as Record<Priority, (typeof PRIORITIES)[number]>;

export const STATUSES: { value: Status; label: string; dot: string }[] = [
  { value: "todo", label: "To do", dot: "bg-slate-400" },
  { value: "doing", label: "In progress", dot: "bg-amber-500" },
  { value: "done", label: "Done", dot: "bg-emerald-500" },
];

export const STATUS_BY_VALUE = Object.fromEntries(STATUSES.map((s) => [s.value, s])) as Record<Status, (typeof STATUSES)[number]>;
