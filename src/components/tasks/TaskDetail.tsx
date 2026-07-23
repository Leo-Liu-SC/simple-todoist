"use client";
import { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfWeek, addWeeks, isToday, isTomorrow, isPast } from "date-fns";
import { X, Trash2, Check, Square, Flag, Calendar, Folder, Tag, ChevronDown, Plus } from "lucide-react";
import { useTask, updateTask, deleteTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useLabels } from "@/hooks/useLabels";
import RichTextEditor from "@/components/editor/RichTextEditor";
import QuickAdd from "./QuickAdd";
import SubtaskTree from "./SubtaskTree";
import PropertyPopover from "./PropertyPopover";
import { useTaskContext } from "@/lib/TaskContext";
import { useToast } from "@/lib/ToastContext";
import { PRIORITIES, PRIORITY_BY_VALUE, STATUSES, statusMeta } from "@/lib/taskMeta";

function formatDue(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d, yyyy");
}

type Popover = null | "status" | "priority" | "due" | "project" | "labels";

const MENUITEM = "flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-100 focus:outline-none";

export default function TaskDetail({
  taskId,
  onClose,
  onDeleted,
}: {
  taskId: number;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { task, mutate } = useTask(taskId);
  const { projects } = useProjects();
  const { labels } = useLabels();
  const { setSelectedTask } = useTaskContext();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [showSubtaskAdd, setShowSubtaskAdd] = useState(false);
  const [open, setOpen] = useState<Popover>(null);
  const [dueDraft, setDueDraft] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNextAction(task.nextAction ?? "");
      setDescription(task.description ?? "");
      setDueDraft(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
    }
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async (patch: Record<string, unknown>) => {
    setSaving(true);
    await updateTask(taskId, patch as Parameters<typeof updateTask>[1]);
    await mutate();
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }, [taskId, mutate]);

  async function handleTitleBlur() {
    if (task && title !== task.title) await save({ title });
  }

  async function handleNextActionBlur() {
    if (task && nextAction !== (task.nextAction ?? "")) await save({ nextAction: nextAction || null });
  }

  async function handleDescriptionBlur() {
    if (task && description !== (task.description ?? "")) await save({ description });
  }

  async function handleDelete() {
    if (!task) return;
    const snapshot = {
      title: task.title,
      description: task.description ?? undefined,
      dueDate: task.dueDate ?? undefined,
      priority: task.priority,
      status: task.status,
      projectId: task.projectId ?? null,
      labelIds: task.labels.map((l) => l.id),
    };
    await deleteTask(taskId);
    onDeleted();
    toast.show("Task deleted", {
      actionLabel: "Undo",
      onAction: async () => {
        const { createTask } = await import("@/hooks/useTasks");
        await createTask({ ...snapshot } as never);
      },
    });
  }

  async function toggleComplete() {
    if (!task) return;
    const prev = task.status;
    const next = task.status === "done" ? "new" : "done";
    await save({ status: next });
    if (next === "done") {
      toast.show("Task completed", { actionLabel: "Undo", onAction: () => save({ status: prev }) });
    }
  }

  async function toggleLabel(labelId: number) {
    if (!task) return;
    const current = task.labels.map((l) => l.id);
    const next = current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId];
    await save({ labelIds: next });
  }

  function closePopover() { setOpen(null); }

  if (!task) return (
    <div className="flex items-center justify-center h-64 text-sm text-slate-500">Loading…</div>
  );

  const prio = PRIORITY_BY_VALUE[task.priority];
  const stat = statusMeta(task.status);
  const duePast = task.dueDate && task.status !== "done" && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
  const today = new Date();
  const dueChips = [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "Next week", date: addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1) },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-b border-slate-200/80 flex-shrink-0">
        <div className="mr-auto flex items-center gap-2 min-w-0">
          {task.project ? (
            <span className="text-xs text-slate-600 flex items-center gap-1.5 bg-slate-100 rounded-md px-2 py-1 truncate max-w-[220px]">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.project.color }} aria-hidden="true" />
              <span className="truncate">{task.project.name}</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-medium">Task</span>
          )}
          <span role="status" aria-live="polite" className={`text-xs font-medium flex items-center gap-1.5 transition-opacity ${saving || savedFlash ? "opacity-100" : "opacity-0"} ${saving ? "text-indigo-600" : "text-emerald-600"}`}>
            {saving ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" aria-hidden="true" />Saving…</>
            ) : (
              <><Check size={12} aria-hidden="true" />Saved</>
            )}
          </span>
        </div>
        <button
          onClick={toggleComplete}
          aria-pressed={task.status === "done"}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
            task.status === "done"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
          }`}
        >
          {task.status === "done" ? <Check size={14} aria-hidden="true" /> : <Square size={14} aria-hidden="true" />}
          {task.status === "done" ? "Completed" : "Mark complete"}
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleDelete} aria-label="Delete task" className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:outline-none transition-colors">
            <Trash2 size={15} aria-hidden="true" />
          </button>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:outline-none transition-colors">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: title + description + subtasks */}
        <div className="flex-1 min-w-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <input
            id="task-detail-title"
            aria-label="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className={`w-full text-xl font-semibold tracking-tight focus:outline-none border-b-2 border-transparent focus:border-indigo-400 pb-1 transition-colors ${task.status === "done" ? "line-through text-slate-500" : "text-slate-900"}`}
            placeholder="Task title"
          />

          <input
            aria-label="Next action"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            onBlur={handleNextActionBlur}
            className="w-full text-sm text-slate-700 focus:outline-none border-b border-transparent focus:border-indigo-400 pb-1 transition-colors placeholder:text-slate-400"
            placeholder="What's the next action?"
          />

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
            <div onBlur={handleDescriptionBlur}>
              <RichTextEditor content={description} onChange={setDescription} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Subtasks
              {task.subtasks && task.subtasks.length > 0 && (
                <span className="ml-2 text-[10px] font-bold bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5">
                  {task.subtasks.filter((s) => s.status === "done").length}/{task.subtasks.length}
                </span>
              )}
            </label>
            {task.subtasks && task.subtasks.length > 0 && (
              <SubtaskTree tasks={task.subtasks} onChanged={() => mutate()} />
            )}
            {showSubtaskAdd ? (
              <div className="mt-2">
                <QuickAdd
                  projectId={task.projectId ?? undefined}
                  parentId={task.id}
                  onClose={() => setShowSubtaskAdd(false)}
                  onCreated={() => mutate()}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowSubtaskAdd(true)}
                className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus size={12} /> Add subtask
              </button>
            )}
          </div>
        </div>

        {/* Right: properties sidebar */}
        <div className="w-64 flex-shrink-0 border-l border-slate-200/80 bg-slate-50 overflow-y-auto px-4 py-5 flex flex-col gap-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Properties</p>

          {/* Status */}
          <PropertyPopover
            open={open === "status"}
            onOpenChange={(o) => setOpen(o ? "status" : null)}
            label="Status"
            menuLabel="Set status"
            trigger={<>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stat.dot}`} aria-hidden="true" />
              <span className="flex-1 text-left font-medium text-slate-700">{stat.label}</span>
              <ChevronDown size={13} className="text-slate-500 group-hover:text-slate-700" aria-hidden="true" />
            </>}
          >
            {STATUSES.map((s) => (
              <button key={s.value} role="menuitem" tabIndex={-1}
                onClick={() => { closePopover(); save({ status: s.value }); }} className={MENUITEM}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} aria-hidden="true" />
                <span className="flex-1 text-left">{s.label}</span>
                {task.status === s.value && <Check size={13} className="text-indigo-600" aria-hidden="true" />}
              </button>
            ))}
          </PropertyPopover>

          {/* Priority */}
          <PropertyPopover
            open={open === "priority"}
            onOpenChange={(o) => setOpen(o ? "priority" : null)}
            label="Priority"
            menuLabel="Set priority"
            menuWidthClass="w-44"
            trigger={<>
              <Flag size={13} className={`flex-shrink-0 fill-current ${task.priority < 4 ? prio.text : "text-slate-400"}`} aria-hidden="true" />
              <span className={`flex-1 text-left font-medium ${task.priority < 4 ? prio.text : "text-slate-600"}`}>{prio.label}</span>
              <ChevronDown size={13} className="text-slate-500 group-hover:text-slate-700" aria-hidden="true" />
            </>}
          >
            {PRIORITIES.map((p) => (
              <button key={p.value} role="menuitem" tabIndex={-1}
                onClick={() => { closePopover(); save({ priority: p.value }); }} className={MENUITEM}>
                <Flag size={12} className={`flex-shrink-0 fill-current ${p.text}`} aria-hidden="true" />
                <span className="flex-1 text-left">{p.label}</span>
                {task.priority === p.value && <Check size={13} className="text-indigo-600" aria-hidden="true" />}
              </button>
            ))}
          </PropertyPopover>

          {/* Due date */}
          <PropertyPopover
            open={open === "due"}
            onOpenChange={(o) => setOpen(o ? "due" : null)}
            label="Due date"
            menuLabel="Set due date"
            menuWidthClass="w-56"
            trigger={<>
              <Calendar size={13} className={`flex-shrink-0 ${duePast ? "text-red-600" : task.dueDate ? "text-slate-600" : "text-slate-400"}`} aria-hidden="true" />
              <span className={`flex-1 text-left font-medium ${duePast ? "text-red-600" : task.dueDate ? "text-slate-700" : "text-slate-500"}`}>
                {task.dueDate ? formatDue(task.dueDate) : "No due date"}
              </span>
              <ChevronDown size={13} className="text-slate-500 group-hover:text-slate-700" aria-hidden="true" />
            </>}
          >
            <div className="px-3 pt-1">
              <input
                type="date"
                aria-label="Due date"
                value={dueDraft}
                onChange={(e) => setDueDraft(e.target.value)}
                onBlur={() => { if (dueDraft) { closePopover(); save({ dueDate: dueDraft }); } }}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 mb-2"
              />
            </div>
            {dueChips.map((c) => (
              <button key={c.label} role="menuitem" tabIndex={-1}
                onClick={() => { closePopover(); save({ dueDate: c.date.toISOString() }); }}
                className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-100 focus:outline-none">
                <Calendar size={12} className="text-slate-400 flex-shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">{c.label}</span>
              </button>
            ))}
            {task.dueDate && (
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button role="menuitem" tabIndex={-1}
                  onClick={() => { closePopover(); save({ dueDate: null }); }}
                  className="w-full text-left text-sm px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 focus-visible:bg-red-50 focus:outline-none">
                  Clear date
                </button>
              </div>
            )}
          </PropertyPopover>

          {/* Project */}
          <PropertyPopover
            open={open === "project"}
            onOpenChange={(o) => setOpen(o ? "project" : null)}
            label="Project"
            menuLabel="Set project"
            menuWidthClass="w-52"
            trigger={<>
              {task.project ? (
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: task.project.color }} aria-hidden="true" />
              ) : (
                <Folder size={13} className="flex-shrink-0 text-slate-400" aria-hidden="true" />
              )}
              <span className={`flex-1 text-left font-medium truncate ${task.project ? "text-slate-700" : "text-slate-500"}`}>
                {task.project?.name ?? "No project"}
              </span>
              <ChevronDown size={13} className="text-slate-500 group-hover:text-slate-700" aria-hidden="true" />
            </>}
          >
            <button role="menuitem" tabIndex={-1}
              onClick={() => { closePopover(); save({ projectId: null }); }}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 focus-visible:bg-slate-100 focus:outline-none">
              <Folder size={12} className="flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 text-left">No project</span>
              {!task.projectId && <Check size={13} className="text-indigo-600" aria-hidden="true" />}
            </button>
            {projects.map((p) => (
              <button key={p.id} role="menuitem" tabIndex={-1}
                onClick={() => { closePopover(); save({ projectId: p.id }); }} className={MENUITEM}>
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} aria-hidden="true" />
                <span className="flex-1 text-left truncate">{p.name}</span>
                {task.projectId === p.id && <Check size={13} className="text-indigo-600" aria-hidden="true" />}
              </button>
            ))}
          </PropertyPopover>

          {/* Labels */}
          {labels.length > 0 && (
            <PropertyPopover
              open={open === "labels"}
              onOpenChange={(o) => setOpen(o ? "labels" : null)}
              label="Labels"
              menuLabel="Toggle labels"
              trigger={<>
                <Tag size={13} className={`flex-shrink-0 ${task.labels.length ? "text-slate-600" : "text-slate-400"}`} aria-hidden="true" />
                <span className="flex-1 text-left min-w-0 overflow-hidden">
                  {task.labels.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {task.labels.slice(0, 3).map((l) => (
                        <span key={l.id} className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: l.color + "22", color: l.color }}>
                          {l.name}
                        </span>
                      ))}
                      {task.labels.length > 3 && (
                        <span className="text-[11px] text-slate-500">+{task.labels.length - 3}</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-medium">No labels</span>
                  )}
                </span>
                <ChevronDown size={13} className="text-slate-500 group-hover:text-slate-700 flex-shrink-0" aria-hidden="true" />
              </>}
            >
              {labels.map((l) => {
                const active = task.labels.some((tl) => tl.id === l.id);
                return (
                  <button key={l.id} role="menuitemcheckbox" aria-checked={active} tabIndex={-1}
                    onClick={() => toggleLabel(l.id)} className={MENUITEM}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} aria-hidden="true" />
                    <span className="flex-1 text-left">{l.name}</span>
                    {active && <Check size={13} className="text-indigo-600" aria-hidden="true" />}
                  </button>
                );
              })}
            </PropertyPopover>
          )}
        </div>
      </div>
    </div>
  );
}
