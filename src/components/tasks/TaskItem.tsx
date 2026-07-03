"use client";
import { useState, useRef, useEffect } from "react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { ChevronRight, Calendar, GripVertical, Flag } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, ColumnConfig, Priority, Status } from "@/lib/types";
import { updateTask } from "@/hooks/useTasks";
import { PRIORITIES, PRIORITY_BY_VALUE, STATUSES, STATUS_BY_VALUE, gridTemplate } from "@/lib/taskMeta";
import { useToast } from "@/lib/ToastContext";

function formatDue(date: string) {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d");
}

type EditField = null | "title" | "priority" | "status" | "dueDate";

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
  const toast = useToast();

  const [editing, setEditing] = useState<EditField>(null);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing === "title") {
      setTitleDraft(task.title);
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [editing, task.title]);

  const isDone = task.status === "done";
  const prio = PRIORITY_BY_VALUE[task.priority];
  const stat = STATUS_BY_VALUE[task.status];
  const duePast = task.dueDate && !isDone && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

  async function toggleDone(e: React.MouseEvent) {
    e.stopPropagation();
    const prev = task.status;
    const next = isDone ? "todo" : "done";
    await updateTask(task.id, { status: next });
    if (next === "done") {
      toast.show("Task completed", {
        actionLabel: "Undo",
        onAction: () => updateTask(task.id, { status: prev }),
      });
    }
  }

  async function saveTitle() {
    setEditing(null);
    if (titleDraft.trim() && titleDraft !== task.title) {
      await updateTask(task.id, { title: titleDraft.trim() });
    }
  }

  // Open a field's inline editor (single click on the value).
  function startEdit(field: EditField) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditing(field);
    };
  }

  const cellSelect =
    "w-full text-xs border border-indigo-300 rounded-md px-1.5 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  const style = {
    gridTemplateColumns: gridTemplate(columns),
    ...(sortable
      ? { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
      : {}),
  };

  return (
    <div
      ref={sortable ? setNodeRef : undefined}
      style={style}
      onDoubleClick={() => onSelect(task)}
      className={`relative grid items-center gap-3 px-4 py-2.5 transition-colors border-b border-slate-100 last:border-0 group ${
        selected ? "bg-indigo-50/70" : duePast ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-slate-50"
      }`}
    >
      {duePast && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-400" />}
      {sortable && (
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      )}

      {/* Col: checkbox */}
      <button
        onClick={toggleDone}
        className={`w-[18px] h-[18px] rounded-full border-2 transition-all flex items-center justify-center ${
          isDone ? "border-indigo-500 bg-indigo-500" : `bg-transparent ${prio.ring}`
        }`}
        title={isDone ? "Mark as to-do" : "Mark as done"}
      >
        {isDone && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Col: title (inline editable) */}
      {editing === "title" ? (
        <input
          ref={titleRef}
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={saveTitle}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveTitle();
            if (e.key === "Escape") { setTitleDraft(task.title); setEditing(null); }
          }}
          className="text-sm text-slate-800 border border-indigo-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-w-0"
        />
      ) : (
        <span
          onClick={startEdit("title")}
          className={`text-sm min-w-0 truncate cursor-text rounded px-1 -mx-1 hover:bg-slate-100/70 ${isDone ? "line-through text-slate-400" : "text-slate-700"}`}
          title="Click to edit · double-click row for details"
        >
          {task.title}
          {task._count?.subtasks ? (
            <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-slate-400 align-middle">
              <ChevronRight size={11} />{task._count.subtasks}
            </span>
          ) : null}
        </span>
      )}

      {/* Col: labels (pane-only edit) */}
      {columns.labels && (
        <span className="flex items-center gap-1 justify-end overflow-hidden">
          {task.labels.slice(0, 2).map((l) => (
            <span
              key={l.id}
              className="text-[13px] px-2 py-0.5 rounded-full font-medium truncate max-w-[70px]"
              style={{ backgroundColor: l.color + "1a", color: l.color }}
            >
              {l.name}
            </span>
          ))}
        </span>
      )}

      {/* Col: project/list (pane-only edit) */}
      {columns.project && (
        <span className="flex justify-end min-w-0">
          {task.project && (
            <span className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-100 rounded-md px-1.5 py-0.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.project.color }} />
              <span className="truncate">{task.project.name}</span>
            </span>
          )}
        </span>
      )}

      {/* Col: due date (inline editable) */}
      {columns.dueDate && (
        <span className="flex justify-end min-w-0">
          {editing === "dueDate" ? (
            <input
              type="date"
              autoFocus
              defaultValue={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => setEditing(null)}
              onChange={async (e) => {
                await updateTask(task.id, { dueDate: e.target.value || null });
                setEditing(null);
              }}
              className={cellSelect}
            />
          ) : (
            <button
              onClick={startEdit("dueDate")}
              className={`text-xs flex items-center gap-1 tabular-nums rounded px-1 py-0.5 hover:bg-slate-100 ${duePast ? "text-red-500 font-medium" : task.dueDate ? "text-slate-400" : "text-slate-300"}`}
              title="Click to set due date"
            >
              {task.dueDate ? (<><Calendar size={11} />{formatDue(task.dueDate)}</>) : <Calendar size={11} />}
            </button>
          )}
        </span>
      )}

      {/* Col: priority (inline editable) */}
      {columns.priority && (
        <span className="flex justify-end min-w-0">
          {editing === "priority" ? (
            <select
              autoFocus
              defaultValue={task.priority}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => setEditing(null)}
              onChange={async (e) => {
                await updateTask(task.id, { priority: Number(e.target.value) as Priority });
                setEditing(null);
              }}
              className={cellSelect}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          ) : (
            <button
              onClick={startEdit("priority")}
              className={`flex items-center gap-1 text-xs font-medium rounded px-1 py-0.5 hover:bg-slate-100 ${task.priority < 4 ? prio.text : "text-slate-300"}`}
              title="Click to set priority"
            >
              {task.priority < 4 ? (<><Flag size={12} className="fill-current" />{prio.label}</>) : <Flag size={12} />}
            </button>
          )}
        </span>
      )}

      {/* Col: status (inline editable) */}
      {columns.status && (
        <span className="flex justify-end min-w-0">
          {editing === "status" ? (
            <select
              autoFocus
              defaultValue={task.status}
              onClick={(e) => e.stopPropagation()}
              onBlur={() => setEditing(null)}
              onChange={async (e) => {
                await updateTask(task.id, { status: e.target.value as Status });
                setEditing(null);
              }}
              className={cellSelect}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          ) : (
            <button
              onClick={startEdit("status")}
              className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full hover:ring-2 hover:ring-slate-200 ${stat.pill}`}
              title="Click to change status"
            >
              {stat.label}
            </button>
          )}
        </span>
      )}
    </div>
  );
}
