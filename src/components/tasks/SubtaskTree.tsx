"use client";
import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Calendar } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { Task } from "@/lib/types";
import { updateTask } from "@/hooks/useTasks";
import { useTaskContext } from "@/lib/TaskContext";
import QuickAdd from "./QuickAdd";

const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-blue-500",
  4: "bg-gray-200",
};

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

  async function toggleDone(e: React.MouseEvent) {
    e.stopPropagation();
    await updateTask(task.id, { status: isDone ? "new" : "done" });
    onChanged();
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 pr-2 hover:bg-gray-50 rounded group cursor-pointer"
        style={{ paddingLeft: depth * 16 + 4 }}
        onClick={() => setSelectedTask(task)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={`flex-shrink-0 text-gray-300 hover:text-gray-500 ${hasChildren ? "" : "invisible"}`}
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        <button
          onClick={toggleDone}
          className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            isDone ? "border-gray-300 bg-gray-300" : PRIORITY_COLORS[task.priority]
          }`}
          style={{ borderColor: isDone ? undefined : undefined }}
        >
          {isDone && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <span className={`flex-1 text-sm min-w-0 truncate ${isDone ? "line-through text-gray-400" : "text-gray-700"}`}>
          {task.title}
        </span>

        {task.dueDate && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar size={10} />
            {formatDue(task.dueDate)}
          </span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); setShowAdd(!showAdd); }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 flex-shrink-0"
          title="Add subtask"
        >
          <Plus size={13} />
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
    <div className="border border-gray-200 rounded-lg py-1">
      {tasks.map((t) => (
        <SubtaskRow key={t.id} task={t} depth={0} onChanged={onChanged} />
      ))}
    </div>
  );
}
