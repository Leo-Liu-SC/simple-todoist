"use client";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { ChevronRight, Calendar, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, ColumnConfig } from "@/lib/types";
import { updateTask } from "@/hooks/useTasks";

const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-blue-500",
  4: "bg-gray-200",
};

// Border color for the uncompleted checkbox ring, tinted by priority.
const PRIORITY_RING: Record<number, string> = {
  1: "border-red-400 hover:border-red-500",
  2: "border-orange-400 hover:border-orange-500",
  3: "border-blue-400 hover:border-blue-500",
  4: "border-slate-300 hover:border-slate-400",
};

function formatDue(date: string) {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d");
}

export default function TaskItem({
  task,
  selected,
  columns,
  onSelect,
  sortable = false,
}: {
  task: Task;
  selected: boolean;
  columns: ColumnConfig;
  onSelect: (task: Task) => void;
  sortable?: boolean;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id, disabled: !sortable });

  async function toggleDone(e: React.MouseEvent) {
    e.stopPropagation();
    await updateTask(task.id, { status: task.status === "done" ? "todo" : "done" });
  }

  const isDone = task.status === "done";
  const duePast = task.dueDate && !isDone && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

  const style = sortable
    ? { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div
      ref={sortable ? setNodeRef : undefined}
      style={style}
      onClick={() => onSelect(task)}
      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-slate-100 last:border-0 group ${
        selected ? "bg-indigo-50/70" : "hover:bg-slate-50"
      }`}
    >
      {sortable && (
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 -ml-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      )}
      <button
        onClick={toggleDone}
        className={`flex-shrink-0 w-[18px] h-[18px] rounded-full border-2 transition-all flex items-center justify-center ${
          isDone ? "border-indigo-500 bg-indigo-500" : `bg-transparent ${PRIORITY_RING[task.priority]}`
        }`}
        title={isDone ? "Mark as to-do" : "Mark as done"}
      >
        {isDone && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className={`flex-1 text-sm min-w-0 truncate ${isDone ? "line-through text-slate-400" : "text-slate-700"}`}>
        {task.title}
        {task._count?.subtasks ? (
          <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-slate-400 align-middle">
            <ChevronRight size={11} />{task._count.subtasks}
          </span>
        ) : null}
      </span>

      <div className="flex items-center gap-2 flex-shrink-0">
        {columns.labels && task.labels.map((l) => (
          <span
            key={l.id}
            className="text-[11px] px-2 py-0.5 rounded-full font-medium leading-relaxed"
            style={{ backgroundColor: l.color + "1a", color: l.color }}
          >
            {l.name}
          </span>
        ))}

        {columns.project && task.project && (
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.project.color }} />
            {task.project.name}
          </span>
        )}

        {columns.dueDate && task.dueDate && (
          <span className={`text-xs flex items-center gap-1 tabular-nums ${duePast ? "text-red-500 font-medium" : "text-slate-400"}`}>
            <Calendar size={11} />
            {formatDue(task.dueDate)}
          </span>
        )}

        {columns.priority && task.priority < 4 && (
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
        )}
      </div>
    </div>
  );
}
