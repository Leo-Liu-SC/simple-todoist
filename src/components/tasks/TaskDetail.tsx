"use client";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { X, Trash2, Plus } from "lucide-react";
import { useTask, updateTask, deleteTask, createTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useLabels } from "@/hooks/useLabels";
import RichTextEditor from "@/components/editor/RichTextEditor";
import QuickAdd from "./QuickAdd";
import SubtaskTree from "./SubtaskTree";
import { useTaskContext } from "@/lib/TaskContext";

const PRIORITY_OPTIONS = [
  { value: 1, label: "Urgent", color: "text-red-500" },
  { value: 2, label: "High", color: "text-orange-500" },
  { value: 3, label: "Medium", color: "text-blue-500" },
  { value: 4, label: "No priority", color: "text-gray-400" },
];

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
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
    }
  }

  async function handleDelete() {
    if (confirm("Delete this task?")) {
      await deleteTask(taskId);
      onDeleted();
    }
  }

  async function toggleLabel(labelId: number) {
    if (!task) return;
    const current = task.labels.map((l) => l.id);
    const next = current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId];
    await save({ labelIds: next });
  }

  if (!task) return (
    <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
        <span className="text-xs text-gray-400">{saving ? "Saving…" : "Task detail"}</span>
        <div className="flex items-center gap-1">
          <button onClick={handleDelete} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
            <Trash2 size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full text-base font-medium text-gray-900 focus:outline-none border-b border-transparent focus:border-indigo-300 pb-1 transition-colors"
        />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Project</label>
            <select
              value={task.projectId ?? ""}
              onChange={(e) => save({ projectId: e.target.value ? Number(e.target.value) : null })}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Priority</label>
            <select
              value={task.priority}
              onChange={(e) => save({ priority: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Due date</label>
            <input
              type="date"
              value={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
              onChange={(e) => save({ dueDate: e.target.value || null })}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              value={task.status}
              onChange={(e) => save({ status: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="todo">To do</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        {labels.length > 0 && (
          <div>
            <label className="block text-xs text-gray-400 mb-2">Labels</label>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((l) => {
                const active = task.labels.some((tl) => tl.id === l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLabel(l.id)}
                    className={`text-xs px-2 py-1 rounded-full border transition-all ${
                      active ? "border-transparent" : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
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
          <label className="block text-xs text-gray-400 mb-2">Description</label>
          <div onBlur={handleDescriptionBlur}>
            <RichTextEditor content={description} onChange={handleDescriptionChange} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">Subtasks</label>
            <button
              onClick={() => setShowSubtaskAdd(!showSubtaskAdd)}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {showSubtaskAdd && (
            <div className="mb-2">
              <QuickAdd
                projectId={task.projectId ?? undefined}
                parentId={task.id}
                onClose={() => setShowSubtaskAdd(false)}
                onCreated={() => { setShowSubtaskAdd(false); mutate(); }}
              />
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <SubtaskTree tasks={task.subtasks} onChanged={() => mutate()} />
          )}
        </div>
      </div>
    </div>
  );
}
