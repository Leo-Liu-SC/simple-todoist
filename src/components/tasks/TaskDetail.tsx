"use client";
import { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { X, Trash2, Plus, Check, Circle } from "lucide-react";
import { useTask, updateTask, deleteTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useLabels } from "@/hooks/useLabels";
import RichTextEditor from "@/components/editor/RichTextEditor";
import QuickAdd from "./QuickAdd";
import SubtaskTree from "./SubtaskTree";
import { useTaskContext } from "@/lib/TaskContext";
import { useToast } from "@/lib/ToastContext";
import { PRIORITIES, STATUSES } from "@/lib/taskMeta";

// Quick due-date chips for the detail panel.
function dueChips() {
  const today = new Date();
  return [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "Next week", date: addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1) },
  ];
}

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
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [descSaved, setDescSaved] = useState(false);
  const [showSubtaskAdd, setShowSubtaskAdd] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
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
    if (task && title !== task.title) {
      await save({ title });
    }
  }

  async function handleDescriptionChange(html: string) {
    setDescription(html);
  }

  async function handleDescriptionBlur() {
    if (task && description !== (task.description ?? "")) {
      await save({ description });
      setDescSaved(true);
      setTimeout(() => setDescSaved(false), 2000);
    }
  }

  async function handleDelete() {
    // Optimistic delete with an undo toast instead of a blocking confirm().
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
    const next = task.status === "done" ? "todo" : "done";
    await save({ status: next });
    if (next === "done") {
      toast.show("Task completed", {
        actionLabel: "Undo",
        onAction: () => save({ status: prev }),
      });
    }
  }

  async function toggleLabel(labelId: number) {
    if (!task) return;
    const current = task.labels.map((l) => l.id);
    const next = current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId];
    await save({ labelIds: next });
  }

  if (!task) return (
    <div className="flex items-center justify-center h-full text-sm text-slate-400">Loading…</div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/80">
        <button
          onClick={toggleComplete}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
            task.status === "done"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
          }`}
        >
          {task.status === "done" ? <Check size={14} /> : <Circle size={14} />}
          {task.status === "done" ? "Completed" : "Mark complete"}
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium flex items-center gap-1.5 transition-opacity ${saving || savedFlash ? "opacity-100" : "opacity-0"} ${saving ? "text-indigo-500" : "text-emerald-500"}`}>
            {saving ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />Saving…</>
            ) : (
              <><Check size={12} />Saved</>
            )}
          </span>
          <button onClick={handleDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full text-lg font-semibold text-slate-900 tracking-tight focus:outline-none border-b-2 border-transparent focus:border-indigo-400 pb-1 transition-colors"
        />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project</label>
            <select
              value={task.projectId ?? ""}
              onChange={(e) => save({ projectId: e.target.value ? Number(e.target.value) : null })}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
            <select
              value={task.priority}
              onChange={(e) => save({ priority: Number(e.target.value) })}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={task.status}
              onChange={(e) => save({ status: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Due date</label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
              onChange={(e) => save({ dueDate: e.target.value || null })}
              className="border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-700 bg-slate-50/50 focus:outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            />
            {dueChips().map((c) => (
              <button
                key={c.label}
                onClick={() => save({ dueDate: c.date.toISOString() })}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
              >
                {c.label}
              </button>
            ))}
            {task.dueDate && (
              <button
                onClick={() => save({ dueDate: null })}
                className="text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {labels.length > 0 && (
          <div>
            <label className="block text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Labels</label>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((l) => {
                const active = task.labels.some((tl) => tl.id === l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLabel(l.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                      active ? "border-transparent" : "border-slate-200 text-slate-500 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    style={active ? { backgroundColor: l.color + "22", color: l.color, borderColor: l.color + "44" } : {}}
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider">Description</label>
            <span className={`text-[13px] font-medium flex items-center gap-1 text-emerald-500 transition-opacity ${descSaved ? "opacity-100" : "opacity-0"}`}>
              <Check size={11} /> Saved
            </span>
          </div>
          <div onBlur={handleDescriptionBlur}>
            <RichTextEditor content={description} onChange={handleDescriptionChange} />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Subtasks</label>

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
    </div>
  );
}
