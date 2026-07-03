"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ColorPicker from "@/components/ui/ColorPicker";
import { useProjects, createProject, updateProject } from "@/hooks/useProjects";
import { Project } from "@/lib/types";

// Collect the ids of `project` and all its descendants — invalid parent choices.
function descendantIds(project: Project | undefined, all: Project[]): Set<number> {
  const blocked = new Set<number>();
  if (!project) return blocked;
  const stack = [project.id];
  while (stack.length) {
    const id = stack.pop()!;
    blocked.add(id);
    for (const p of all) {
      if (p.parentId === id && !blocked.has(p.id)) stack.push(p.id);
    }
  }
  return blocked;
}

export default function ProjectForm({
  project,
  onClose,
}: {
  project?: Project;
  onClose: () => void;
}) {
  const { projects } = useProjects();
  const [name, setName] = useState(project?.name ?? "");
  const [color, setColor] = useState(project?.color ?? "#6366f1");
  const [parentId, setParentId] = useState<number | null>(project?.parentId ?? null);
  const [loading, setLoading] = useState(false);

  const blocked = descendantIds(project, projects);
  const parentOptions = projects.filter((p) => !blocked.has(p.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    if (project) {
      await updateProject(project.id, { name, color, parentId });
    } else {
      await createProject(name, color, parentId);
    }
    onClose();
  }

  return (
    <Modal title={project ? "Edit project" : "New project"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
            placeholder="Project name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Parent project</label>
          <select
            value={parentId ?? ""}
            onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">None (top level)</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {project ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
