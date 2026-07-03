"use client";
import { useState, useEffect } from "react";
import { Plus, Settings2, List as ListIcon, Columns3 } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { useTasks, reorderTasks } from "@/hooks/useTasks";
import { TaskFilters, Task, ColumnConfig } from "@/lib/types";
import { useTaskContext } from "@/lib/TaskContext";
import TaskItem from "./TaskItem";
import QuickAdd from "./QuickAdd";
import BoardView from "./BoardView";

const DEFAULT_COLUMNS: ColumnConfig = { priority: true, dueDate: true, labels: true, project: false };

function useColumnConfig(key: string): [ColumnConfig, (c: ColumnConfig) => void] {
  const [config, setConfig] = useState<ColumnConfig>(DEFAULT_COLUMNS);
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) setConfig(JSON.parse(stored));
  }, [key]);
  function save(c: ColumnConfig) {
    setConfig(c);
    localStorage.setItem(key, JSON.stringify(c));
  }
  return [config, save];
}

export default function TaskList({
  title,
  filters,
  projectId,
}: {
  title: string;
  filters: TaskFilters;
  projectId?: number;
}) {
  const { tasks, isLoading } = useTasks(filters);
  const { selectedTask, setSelectedTask } = useTaskContext();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columns, setColumns] = useColumnConfig(`columns-${projectId ?? filters.view ?? "all"}`);
  const [search, setSearch] = useState("");
  const [orderedIds, setOrderedIds] = useState<number[]>([]);
  const viewKey = `viewmode-${projectId ?? filters.view ?? "all"}`;
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  useEffect(() => {
    const stored = localStorage.getItem(viewKey);
    if (stored === "board" || stored === "list") setViewMode(stored);
  }, [viewKey]);

  function setView(mode: "list" | "board") {
    setViewMode(mode);
    localStorage.setItem(viewKey, mode);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Keep a local ordering synced with fetched tasks (for optimistic drag reorder).
  useEffect(() => {
    setOrderedIds(tasks.map((t) => t.id));
  }, [tasks]);

  const byId = new Map(tasks.map((t) => [t.id, t]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as Task[];
  const baseList = ordered.length === tasks.length ? ordered : tasks;

  const filtered = search
    ? baseList.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : baseList;

  // Reordering allowed only when not filtering by search text.
  const canReorder = !search;

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(Number(active.id));
    const newIndex = orderedIds.indexOf(Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(next); // optimistic
    await reorderTasks(next);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-900 flex-1">{title}</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-36 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:w-52 transition-all"
        />
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView("list")}
            className={`p-1 rounded ${viewMode === "list" ? "bg-white shadow-sm text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
            title="List view"
          >
            <ListIcon size={15} />
          </button>
          <button
            onClick={() => setView("board")}
            className={`p-1 rounded ${viewMode === "board" ? "bg-white shadow-sm text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
            title="Board view"
          >
            <Columns3 size={15} />
          </button>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className={`p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 ${viewMode === "board" ? "opacity-40 pointer-events-none" : ""}`}
            title="Configure columns"
          >
            <Settings2 size={16} />
          </button>
          {showColumnMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-2 w-44">
                <p className="px-3 pb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Columns</p>
                {(Object.keys(columns) as (keyof ColumnConfig)[]).map((col) => (
                  <label key={col} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns[col]}
                      onChange={(e) => setColumns({ ...columns, [col]: e.target.checked })}
                      className="rounded"
                    />
                    {col === "dueDate" ? "Due date" : col.charAt(0).toUpperCase() + col.slice(1)}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {viewMode === "board" ? (
        <BoardView filters={filters} />
      ) : (
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">Loading…</div>
        )}
        {!isLoading && filtered.length === 0 && !showQuickAdd && (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-400">
            No tasks
          </div>
        )}
        {canReorder ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {filtered.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  selected={task.id === selectedTask?.id}
                  columns={columns}
                  onSelect={setSelectedTask}
                  sortable
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          filtered.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              selected={task.id === selectedTask?.id}
              columns={columns}
              onSelect={setSelectedTask}
            />
          ))
        )}

        {showQuickAdd ? (
          <div className="px-4 py-3">
            <QuickAdd
              projectId={projectId}
              onClose={() => setShowQuickAdd(false)}
              onCreated={() => setShowQuickAdd(false)}
            />
          </div>
        ) : (
          <div className="px-4 py-3">
            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <Plus size={16} /> Add task
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
