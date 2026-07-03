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
  }

  return (
    <form onSubmit={handleSubmit} className="border border-indigo-300 rounded-lg p-3 bg-white shadow-sm">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task name"
        className="w-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none mb-2"
        onKeyDown={(e) => { if (e.key === "Escape") onClose?.(); }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex items-center">
          <CalendarClock size={13} className="absolute left-2 text-gray-400 pointer-events-none" />
          <input
            value={whenText}
            onChange={(e) => setWhenText(e.target.value)}
            placeholder="when… e.g. tomorrow"
            className="text-xs border border-gray-200 rounded pl-7 pr-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-40"
            onKeyDown={(e) => { if (e.key === "Escape") onClose?.(); }}
          />
        </div>
        {whenText.trim() && (
          <span className={`text-xs ${parsedDate ? "text-green-600" : "text-gray-400"}`}>
            {parsedDate ? `→ ${format(parsedDate, "EEE MMM d")}` : "no date"}
          </span>
        )}
        <select
          value={priority}
          onChange={(e) => setPriority(Number(e.target.value))}
          className={`text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${PRIORITY_COLORS[priority]}`}
        >
          <option value={1}>Urgent</option>
          <option value={2}>High</option>
          <option value={3}>Medium</option>
          <option value={4}>No priority</option>
        </select>
        <div className="flex-1" />
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <X size={14} />
        </button>
        <button
          type="submit"
          disabled={!title.trim() || loading}
          className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus size={12} /> Add task
        </button>
      </div>
    </form>
  );
}
