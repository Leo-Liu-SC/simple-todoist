"use client";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Calendar, ChevronRight } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/lib/types";
import { useTaskContext } from "@/lib/TaskContext";
import { updateTask } from "@/hooks/useTasks";
import { PRIORITY_BY_VALUE } from "@/lib/taskMeta";
import { useToast } from "@/lib/ToastContext";

function formatDue(date: string) {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d");
}

export default function TaskCard({ task }: { task: Task }) {
  const { selectedTask, setSelectedTask } = useTaskContext();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const toast = useToast();

  const isDone = task.status === "done";
  const prio = PRIORITY_BY_VALUE[task.priority];
  const duePast = task.dueDate && !isDone && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

  async function toggleDone(e: React.MouseEvent) {
    e.stopPropagation();
    const prev = task.status;
    const next = isDone ? "new" : "done";
    await updateTask(task.id, { status: next });
    if (next === "done") {
      toast.show("Task completed", {
        actionLabel: "Undo",
        onAction: () => updateTask(task.id, { status: prev }),
      });
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedTask(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelectedTask(task);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open task: ${task.title}`}
      className={`bg-white border rounded-xl p-3 cursor-pointer transition-all shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:outline-none ${
        selectedTask?.id === task.id ? "border-indigo-400 ring-2 ring-indigo-500/15" : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={toggleDone}
          onPointerDown={(e) => e.stopPropagation()}
          className={`mt-0.5 flex-shrink-0 w-[16px] h-[16px] rounded-full border-2 transition-all flex items-center justify-center ${
            isDone ? "border-indigo-500 bg-indigo-500" : `bg-transparent ${prio.ring}`
          }`}
          title={isDone ? "Mark as to-do" : "Mark as done"}
        >
          {isDone && (
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 10 10">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <span className={`text-sm flex-1 leading-snug ${isDone ? "line-through text-slate-500" : "text-slate-800"}`}>
          {task.title}
        </span>
      </div>

      {(task.labels.length > 0 || task.dueDate || task._count?.subtasks) && (
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="text-[13px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: l.color + "1a", color: l.color }}
            >
              {l.name}
            </span>
          ))}
          {task.dueDate && (
            <span className={`text-xs flex items-center gap-1 tabular-nums ${duePast ? "text-red-500 font-medium" : "text-slate-500"}`}>
              <Calendar size={10} />
              {formatDue(task.dueDate)}
            </span>
          )}
          {task._count?.subtasks ? (
            <span className="text-xs text-slate-500 flex items-center gap-0.5">
              <ChevronRight size={10} />{task._count.subtasks}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
