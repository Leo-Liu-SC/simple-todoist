"use client";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Calendar, ChevronRight } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/lib/types";
import { useTaskContext } from "@/lib/TaskContext";

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

export default function TaskCard({ task }: { task: Task }) {
  const { selectedTask, setSelectedTask } = useTaskContext();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const isDone = task.status === "done";
  const duePast = task.dueDate && !isDone && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

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
      className={`bg-white border rounded-lg p-3 shadow-sm cursor-pointer hover:shadow transition-shadow ${
        selectedTask?.id === task.id ? "border-indigo-400 ring-1 ring-indigo-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-start gap-2">
        {task.priority < 4 && (
          <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
        )}
        <span className={`text-sm flex-1 ${isDone ? "line-through text-gray-400" : "text-gray-800"}`}>
          {task.title}
        </span>
      </div>

      {(task.labels.length > 0 || task.dueDate || task._count?.subtasks) && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: l.color + "22", color: l.color }}
            >
              {l.name}
            </span>
          ))}
          {task.dueDate && (
            <span className={`text-xs flex items-center gap-1 ${duePast ? "text-red-500" : "text-gray-400"}`}>
              <Calendar size={10} />
              {formatDue(task.dueDate)}
            </span>
          )}
          {task._count?.subtasks ? (
            <span className="text-xs text-gray-400 flex items-center">
              <ChevronRight size={10} />{task._count.subtasks}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
