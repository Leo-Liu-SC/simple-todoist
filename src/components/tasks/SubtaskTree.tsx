"use client";
import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Calendar } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { Task } from "@/lib/types";
import { updateTask } from "@/hooks/useTasks";
import { useTaskContext } from "@/lib/TaskContext";
import { PRIORITY_BY_VALUE } from "@/lib/taskMeta";
import QuickAdd from "./QuickAdd";

function formatDue(date: string) {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d");
}

function SubtaskRow({
  task,
  depth,
  onChanged,
}: {
  task: Task;
  depth: number;
  onChanged: () => void;
}) {
  const { setSelectedTask } = useTaskContext();
  const [expanded, setExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const children = task.subtasks ?? [];
  const hasChildren = children.length > 0;
  const isDone = task.status === "done";
  const prio = PRIORITY_BY_VALUE[task.priority];

  async function toggleDone(e: React.MouseEvent) {
    e.stopPropagation();
    await updateTask(task.id, { status: isDone ? "new" : "done" });
    onChanged();
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 pr-2 hover:bg-slate-50 rounded-lg group"
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
          aria-expanded={hasChildren ? expanded : undefined}
          className={`flex-shrink-0 text-slate-400 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:outline-none rounded ${hasChildren ? "" : "invisible"}`}
        >
          {expanded ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
        </button>

        <button
          onClick={toggleDone}
          aria-label={isDone ? "Mark as to-do" : "Mark as done"}
          className={`flex-shrink-0 w-4 h-4 rounded border-2 transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:outline-none ${
            isDone ? "border-indigo-500 bg-indigo-500" : `bg-transparent ${prio.ring}`
          }`}
        >
          {isDone && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <button
          onClick={() => setSelectedTask(task)}
          className={`flex-1 text-sm min-w-0 truncate text-left rounded px-1 -mx-1 hover:bg-slate-100/70 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:outline-none ${isDone ? "line-through text-slate-400" : "text-slate-700"}`}
          title="Open subtask details"
        >
          {task.title}
        </button>

        {task.dueDate && (
          <span className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
            <Calendar size={10} aria-hidden="true" />
            {formatDue(task.dueDate)}
          </span>
        )}

        <button
          onClick={() => setShowAdd(!showAdd)}
          aria-label="Add subtask"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:outline-none rounded flex-shrink-0"
        >
          <Plus size={13} aria-hidden="true" />
        </button>
      </div>

      {showAdd && (
        <div style={{ paddingLeft: (depth + 1) * 16 + 4 }} className="py-1 pr-2">
          <QuickAdd
            projectId={task.projectId ?? undefined}
            parentId={task.id}
            onClose={() => setShowAdd(false)}
            onCreated={() => { setShowAdd(false); onChanged(); }}
          />
        </div>
      )}

      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <SubtaskRow key={child.id} task={child} depth={depth + 1} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubtaskTree({
  tasks,
  onChanged,
}: {
  tasks: Task[];
  onChanged: () => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="border border-slate-200 rounded-lg py-1">
      {tasks.map((t) => (
        <SubtaskRow key={t.id} task={t} depth={0} onChanged={onChanged} />
      ))}
    </div>
  );
}
