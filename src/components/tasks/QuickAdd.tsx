"use client";
import { useState, useRef, useEffect } from "react";
import { Plus, X, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import * as chrono from "chrono-node";
import { createTask } from "@/hooks/useTasks";

const PRIORITY_COLORS = ["", "text-red-500", "text-orange-500", "text-blue-500", "text-gray-400"] as const;

export default function QuickAdd({
  projectId,
  parentId,
  onClose,
  onCreated,
}: {
  projectId?: number;
  parentId?: number;
  onClose?: () => void;
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(4);
  const [whenText, setWhenText] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const parsedDate = whenText.trim() ? chrono.parseDate(whenText) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await createTask({
      title: title.trim(),
      priority: priority as 1 | 2 | 3 | 4,
      dueDate: parsedDate ? parsedDate.toISOString() : undefined,
      projectId: projectId ?? null,
      parentId: parentId ?? null,
    });
    setTitle("");
    setWhenText("");
    setPriority(4);
    setLoading(false);
    onCreated?.();
    // Keep the form open and refocus so you can add several tasks in a row
    // (press Enter to add each; Escape to close).
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-indigo-300 rounded-xl p-3 bg-white shadow-[var(--shadow-card-hover)] ring-2 ring-indigo-500/10">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task name"
        className="w-full text-sm text-slate-900 placeholder-slate-500 focus:outline-none mb-2.5"
        onKeyDown={(e) => { if (e.key === "Escape") onClose?.(); }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex items-center">
          <CalendarClock size={13} className="absolute left-2.5 text-slate-500 pointer-events-none" aria-hidden="true" />
          <label htmlFor="quickadd-when" className="sr-only">When (due date)</label>
          <input
            id="quickadd-when"
            value={whenText}
            onChange={(e) => setWhenText(e.target.value)}
            placeholder="when… e.g. tomorrow"
            className="text-xs border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 w-40 transition-all"
            onKeyDown={(e) => { if (e.key === "Escape") onClose?.(); }}
          />
        </div>
        {whenText.trim() && (
          <span className={`text-xs font-medium ${parsedDate ? "text-emerald-600" : "text-slate-500"}`}>
            {parsedDate ? `→ ${format(parsedDate, "EEE MMM d")}` : "no date"}
          </span>
        )}
        <div className="flex items-center">
          <label htmlFor="quickadd-priority" className="sr-only">Priority</label>
          <select
            id="quickadd-priority"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className={`text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 transition-all ${PRIORITY_COLORS[priority]}`}
          >
            <option value={1}>Urgent</option>
            <option value={2}>High</option>
            <option value={3}>Medium</option>
            <option value={4}>No priority</option>
          </select>
        </div>
        <div className="flex-1" />
        <button type="button" onClick={onClose} aria-label="Cancel" className="text-slate-500 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
          <X size={14} aria-hidden="true" />
        </button>
        <button
          type="submit"
          disabled={!title.trim() || loading}
          aria-disabled={!title.trim() || loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-500/20 transition-colors"
        >
          <Plus size={12} /> Add task
        </button>
      </div>
    </form>
  );
}
