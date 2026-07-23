"use client";
import { useState, useMemo } from "react";
import useSWR from "swr";
import { format, isToday, isTomorrow, isPast, differenceInCalendarDays } from "date-fns";
import { ChevronRight, ChevronDown, Calendar, GripVertical, Flag, Check, ListTree, Folder, Hash } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, ColumnConfig, Priority, Status, Project } from "@/lib/types";
import { updateTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { PRIORITIES, PRIORITY_BY_VALUE, STATUSES, statusMeta, gridTemplate, type ColWidths } from "@/lib/taskMeta";
import { useToast } from "@/lib/ToastContext";
import { useTaskContext } from "@/lib/TaskContext";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatDue(date: string) {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d");
}

// Flatten projects into parent-before-children order, tagging each with its
// nesting depth so the project picker can indent sub-projects.
function flattenProjects(projects: Project[]): { project: Project; depth: number }[] {
  const byParent = new Map<number | null, Project[]>();
  for (const p of projects) {
    const key = p.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(p);
  }
  const out: { project: Project; depth: number }[] = [];
  const walk = (parentId: number | null, depth: number) => {
    for (const p of byParent.get(parentId) ?? []) {
      out.push({ project: p, depth });
      walk(p.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

type EditField = null | "priority" | "status" | "dueDate" | "project";

export default function TaskItem({
  task,
  selected,
  columns,
  colWidths,
  onSelect,
  sortable = false,
  depth = 0,
}: {
  task: Task;
  selected: boolean;
  columns: ColumnConfig;
  colWidths?: ColWidths;
  onSelect: (task: Task) => void;
  sortable?: boolean;
  depth?: number;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id, disabled: !sortable });
  const toast = useToast();
  const { selectedTask } = useTaskContext();
  const { projects } = useProjects();
  const projectTree = useMemo(() => flattenProjects(projects), [projects]);

  const [editing, setEditing] = useState<EditField>(null);
  const [subtaskExpanded, setSubtaskExpanded] = useState(false);

  const hasSubtasks = (task._count?.subtasks ?? 0) > 0;
  const { data: subtasks } = useSWR<Task[]>(
    subtaskExpanded ? `/api/tasks?parentId=${task.id}` : null,
    fetcher
  );

  const isDone = task.status === "done";
  const prio = PRIORITY_BY_VALUE[task.priority];
  const stat = statusMeta(task.status);
  const duePast = task.dueDate && !isDone && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

  // Color-code the due date by proximity (skipped for completed tasks):
  //   overdue → red · within a day → amber · within a week → green · beyond → gray
  const dueColor = (() => {
    if (!task.dueDate || isDone) return "text-slate-400";
    const days = differenceInCalendarDays(new Date(task.dueDate), new Date());
    if (days < 0) return "text-red-600 font-medium";
    if (days <= 1) return "text-amber-600 font-medium";
    if (days <= 7) return "text-emerald-600";
    return "text-slate-400";
  })();

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

  function startEdit(field: EditField) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditing(field);
    };
  }

  async function setStatus(value: Status) {
    setEditing(null);
    await updateTask(task.id, { status: value });
  }

  async function setProject(projectId: number | null) {
    setEditing(null);
    await updateTask(task.id, { projectId });
  }

  const cellSelect =
    "w-full text-xs border border-indigo-300 rounded-md px-1.5 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  const style = {
    gridTemplateColumns: gridTemplate(columns, colWidths),
    paddingLeft: "16px",
    paddingRight: "16px",
    ...(sortable
      ? { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
      : {}),
  };

  return (
    <>
      <div
        ref={sortable ? setNodeRef : undefined}
        style={style}
        onDoubleClick={() => onSelect(task)}
        className={`relative grid items-center gap-3 py-2.5 transition-colors border-b border-slate-200 last:border-0 group ${
          selected ? "bg-indigo-50/70" : duePast ? "bg-red-50/40 hover:bg-red-50/70" : "hover:bg-slate-50"
        }`}
      >
        {duePast && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-400" aria-hidden="true" />}
        {duePast && <span className="sr-only">Overdue: </span>}
        {sortable && depth === 0 && (
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </button>
        )}

        {/* Col: toggle + checkbox — toggle is always reserved width to keep checkbox aligned.
            Nesting depth is expressed by indenting the title cell, not this one, so the
            checkbox stays within its fixed 40px track and never overlaps the status pill. */}
        <span className="flex items-center gap-1 flex-shrink-0">
          {hasSubtasks ? (
            <button
              onClick={(e) => { e.stopPropagation(); setSubtaskExpanded(!subtaskExpanded); }}
              className="w-4 h-4 flex items-center justify-center flex-shrink-0 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors p-1 -m-1"
              aria-label={subtaskExpanded ? "Collapse subtasks" : "Expand subtasks"}
            >
              {subtaskExpanded ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronRight size={12} aria-hidden="true" />}
            </button>
          ) : (
            <span className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          )}
          <button
            onClick={toggleDone}
            aria-label={isDone ? "Mark as to-do" : "Mark as done"}
            className={`w-[16px] h-[16px] rounded border-2 transition-all flex items-center justify-center flex-shrink-0 p-1 -m-1 ${
              isDone ? "border-indigo-500 bg-indigo-500" : `bg-transparent ${prio.ring}`
            }`}
          >
            {isDone && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </span>

        {/* Col: status */}
        {columns.status && (
          <span className="relative flex justify-start min-w-0">
            <button
              onClick={startEdit("status")}
              className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full hover:ring-2 hover:ring-slate-200 ${stat.pill}`}
              title="Click to change status"
            >
              {stat.label}
            </button>
            {editing === "status" && (
              <>
                <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setEditing(null); }} />
                <div
                  className="absolute left-0 top-7 z-30 bg-white border border-slate-200 rounded-xl shadow-[var(--shadow-pop)] py-1.5 w-44"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="px-3 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Set status</p>
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStatus(s.value)}
                      className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                      <span className="flex-1 text-left">{s.label}</span>
                      {task.status === s.value && <Check size={14} className="text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </span>
        )}

        {/* Col: project */}
        {columns.project && (
          <span className="relative flex justify-start min-w-0">
            <button
              onClick={startEdit("project")}
              className={`text-xs flex items-center gap-1.5 rounded-md px-1.5 py-0.5 max-w-full hover:ring-2 hover:ring-slate-200 transition-shadow ${task.project ? "bg-slate-100 text-slate-500" : "text-slate-400 hover:bg-slate-100"}`}
              title="Click to change project"
            >
              {task.project ? (
                <>
                  <Hash size={12} className="flex-shrink-0" style={{ color: task.project.color }} />
                  <span className="truncate">{task.project.name}</span>
                </>
              ) : (
                <Folder size={12} className="flex-shrink-0" />
              )}
            </button>
            {editing === "project" && (
              <>
                <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setEditing(null); }} />
                <div
                  className="absolute left-0 top-7 z-30 bg-white border border-slate-200 rounded-xl shadow-[var(--shadow-pop)] py-1.5 w-52 max-h-72 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="px-3 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Set project</p>
                  <button
                    onClick={() => setProject(null)}
                    className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
                  >
                    <Folder size={12} className="flex-shrink-0" />
                    <span className="flex-1 text-left">No project</span>
                    {!task.projectId && <Check size={14} className="text-indigo-600" />}
                  </button>
                  {projectTree.map(({ project: p, depth: d }) => (
                    <button
                      key={p.id}
                      onClick={() => setProject(p.id)}
                      style={{ paddingLeft: 12 + d * 16 }}
                      className="flex items-center gap-2.5 w-full pr-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Hash size={13} className="flex-shrink-0" style={{ color: p.color }} />
                      <span className="flex-1 text-left truncate">{p.name}</span>
                      {task.projectId === p.id && <Check size={14} className="text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </span>
        )}

        {/* Col: title — indented by nesting depth so subtasks read as nested.
            Parent tasks show a subtask-count badge so they stand out in the list. */}
        <span className="flex items-start gap-2 min-w-0" style={{ paddingLeft: depth * 28 }}>
          {hasSubtasks && (
            <button
              onClick={(e) => { e.stopPropagation(); setSubtaskExpanded(!subtaskExpanded); }}
              className="flex items-center gap-0.5 text-[11px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200/80 rounded-full pl-1.5 pr-2 py-0.5 mt-0.5 flex-shrink-0 transition-colors tabular-nums"
              title={subtaskExpanded ? "Collapse subtasks" : "Expand subtasks"}
            >
              <ListTree size={11} aria-hidden="true" />
              {task._count?.subtasks ?? 0}
            </button>
          )}
          <span className="flex flex-col min-w-0">
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(task); }}
              className={`text-sm min-w-0 text-left rounded px-1 -mx-1 leading-snug line-clamp-2 hover:bg-slate-100/70 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:outline-none ${isDone ? "line-through text-slate-500" : "text-slate-800"} ${hasSubtasks ? "font-semibold" : ""}`}
              title={task.title}
            >
              {task.title}
            </button>
            {task.nextAction && (
              <span className="text-xs text-slate-400 truncate px-1">
                {task.nextAction}
              </span>
            )}
          </span>
        </span>

        {/* Col: due date */}
        {columns.dueDate && (
          <span className="flex justify-start min-w-0">
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
                className={`text-xs flex items-center gap-1 tabular-nums rounded px-1 py-0.5 hover:bg-slate-100 ${dueColor}`}
                title="Click to set due date"
              >
                {task.dueDate ? (<><Calendar size={11} />{formatDue(task.dueDate)}</>) : <Calendar size={11} />}
              </button>
            )}
          </span>
        )}

        {/* Col: priority */}
        {columns.priority && (
          <span className="relative flex justify-start min-w-0">
            <button
              onClick={startEdit("priority")}
              className={`flex items-center gap-1 text-xs font-medium rounded px-1 py-0.5 hover:ring-2 hover:ring-slate-200 hover:bg-slate-50 ${task.priority < 4 ? prio.text : "text-slate-400"}`}
              title="Click to set priority"
            >
              {task.priority < 4 ? (<><Flag size={12} className="fill-current" />{prio.label}</>) : <Flag size={12} />}
            </button>
            {editing === "priority" && (
              <>
                <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setEditing(null); }} />
                <div
                  className="absolute left-0 top-7 z-30 bg-white border border-slate-200 rounded-xl shadow-[var(--shadow-pop)] py-1.5 w-40"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="px-3 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Set priority</p>
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      onClick={async () => {
                        setEditing(null);
                        await updateTask(task.id, { priority: p.value });
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Flag size={12} className={`flex-shrink-0 fill-current ${p.text}`} />
                      <span className="flex-1 text-left">{p.label}</span>
                      {task.priority === p.value && <Check size={14} className="text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </span>
        )}

        {/* Col: labels */}
        {columns.labels && (
          <span className="flex items-center gap-1 justify-start overflow-hidden">
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

        {/* Trailing spacer */}
        <span />
      </div>

      {/* Inline subtasks */}
      {subtaskExpanded && subtasks && subtasks.map((sub) => (
        <TaskItem
          key={sub.id}
          task={sub}
          selected={sub.id === selectedTask?.id}
          columns={columns}
          colWidths={colWidths}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </>
  );
}
