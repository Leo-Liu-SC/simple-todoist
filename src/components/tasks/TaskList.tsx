"use client";
import { useState, useEffect } from "react";
import { Plus, Settings2, List as ListIcon, Columns3, Search, ArrowUpDown, Check } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { useTasks, reorderTasks } from "@/hooks/useTasks";
import { TaskFilters, Task, ColumnConfig, SortMode } from "@/lib/types";
import { useTaskContext } from "@/lib/TaskContext";
import TaskItem from "./TaskItem";
import QuickAdd from "./QuickAdd";
import BoardView from "./BoardView";
import { PRIORITIES } from "@/lib/taskMeta";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "manual", label: "Manual (drag)" },
  { value: "dueDate", label: "Due date" },
  { value: "priority", label: "Priority" },
];

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
  const [showSortMenu, setShowSortMenu] = useState(false);
  const scopeKey = `${projectId ?? filters.view ?? "all"}`;
  const viewKey = `viewmode-${scopeKey}`;
  const sortKey = `sort-${scopeKey}`;
  const completedKey = `showCompleted-${scopeKey}`;
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [showCompleted, setShowCompleted] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(viewKey);
    if (stored === "board" || stored === "list") setViewMode(stored);
    const s = localStorage.getItem(sortKey);
    if (s === "manual" || s === "dueDate" || s === "priority") setSortMode(s);
    const c = localStorage.getItem(completedKey);
    if (c === "false") setShowCompleted(false);
  }, [viewKey, sortKey, completedKey]);

  function setView(mode: "list" | "board") {
    setViewMode(mode);
    localStorage.setItem(viewKey, mode);
  }
  function setSort(mode: SortMode) {
    setSortMode(mode);
    localStorage.setItem(sortKey, mode);
    setShowSortMenu(false);
  }
  function toggleCompleted() {
    setShowCompleted((v) => {
      localStorage.setItem(completedKey, String(!v));
      return !v;
    });
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Keep a local ordering synced with fetched tasks (for optimistic drag reorder).
  useEffect(() => {
    setOrderedIds(tasks.map((t) => t.id));
  }, [tasks]);

  const byId = new Map(tasks.map((t) => [t.id, t]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as Task[];
  const baseList = ordered.length === tasks.length ? ordered : tasks;

  const searched = search
    ? baseList.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : baseList;

  // Hide or keep completed tasks, then apply the chosen sort. Completed
  // tasks always sink to the bottom regardless of sort mode.
  const visible = showCompleted ? searched : searched.filter((t) => t.status !== "done");
  const completedCount = searched.filter((t) => t.status === "done").length;

  const filtered = [...visible].sort((a, b) => {
    const aDone = a.status === "done" ? 1 : 0;
    const bDone = b.status === "done" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    if (sortMode === "dueDate") {
      const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return at - bt;
    }
    if (sortMode === "priority") {
      return a.priority - b.priority;
    }
    return 0; // manual: keep baseList order
  });

  // Reordering allowed only in manual sort with no active search.
  const canReorder = !search && sortMode === "manual";

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

  const activeCount = searched.filter((t) => t.status !== "done").length;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-4 border-b border-slate-200/80 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-[19px] font-semibold text-slate-900 tracking-tight truncate">{title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeCount} {activeCount === 1 ? "task" : "tasks"}
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="text-sm bg-slate-100/70 border border-transparent rounded-lg pl-8 pr-3 py-1.5 w-40 text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:w-56 transition-all"
          />
        </div>
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white shadow-sm text-slate-700" : "text-slate-400 hover:text-slate-600"}`}
            title="List view"
          >
            <ListIcon size={15} />
          </button>
          <button
            onClick={() => setView("board")}
            className={`p-1.5 rounded-md transition-all ${viewMode === "board" ? "bg-white shadow-sm text-slate-700" : "text-slate-400 hover:text-slate-600"}`}
            title="Board view"
          >
            <Columns3 size={15} />
          </button>
        </div>
        {viewMode === "list" && (
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`p-1.5 rounded-lg transition-colors ${sortMode !== "manual" ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
              title="Sort tasks"
            >
              <ArrowUpDown size={16} />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-9 z-20 bg-white border border-slate-200 rounded-xl shadow-[var(--shadow-pop)] py-2 w-52">
                  <p className="px-3 pb-1.5 text-[13px] font-semibold text-slate-400 uppercase tracking-wider">Sort by</p>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSort(opt.value)}
                      className="flex items-center justify-between w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {opt.label}
                      {sortMode === opt.value && <Check size={14} className="text-indigo-600" />}
                    </button>
                  ))}
                  <div className="my-1.5 border-t border-slate-100" />
                  <button
                    onClick={toggleCompleted}
                    className="flex items-center justify-between w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Show completed
                    <span className={`w-8 h-4.5 rounded-full relative transition-colors ${showCompleted ? "bg-indigo-500" : "bg-slate-300"}`}>
                      <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${showCompleted ? "left-4" : "left-0.5"}`} />
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${viewMode === "board" ? "opacity-40 pointer-events-none" : ""}`}
            title="Configure columns"
          >
            <Settings2 size={16} />
          </button>
          {showColumnMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(false)} />
              <div className="absolute right-0 top-9 z-20 bg-white border border-slate-200 rounded-xl shadow-[var(--shadow-pop)] py-2 w-48">
                <p className="px-3 pb-1.5 text-[13px] font-semibold text-slate-400 uppercase tracking-wider">Columns</p>
                {(Object.keys(columns) as (keyof ColumnConfig)[]).map((col) => (
                  <label key={col} className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={columns[col]}
                      onChange={(e) => setColumns({ ...columns, [col]: e.target.checked })}
                      className="rounded"
                    />
                    {col === "dueDate" ? "Due date" : col.charAt(0).toUpperCase() + col.slice(1)}
                  </label>
                ))}
                <div className="my-1.5 border-t border-slate-100" />
                <p className="px-3 pb-1 text-[13px] font-semibold text-slate-400 uppercase tracking-wider">Priority</p>
                {PRIORITIES.filter((p) => p.value < 4).map((p) => (
                  <div key={p.value} className="flex items-center gap-2.5 px-3 py-1 text-xs text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                    {p.label}
                  </div>
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
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">Loading…</div>
        )}
        {!isLoading && filtered.length === 0 && !showQuickAdd && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-300">
              <ListIcon size={22} />
            </div>
            <p className="text-sm font-medium text-slate-500">No tasks yet</p>
            <p className="text-xs text-slate-400 -mt-1">Add one below to get started</p>
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
            />
          </div>
        ) : (
          <div className="px-4 py-3">
            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-2 w-full text-sm text-slate-400 hover:text-indigo-600 px-2 py-2 rounded-lg hover:bg-indigo-50/50 transition-colors"
            >
              <Plus size={16} /> Add task
            </button>
          </div>
        )}

        {!showCompleted && completedCount > 0 && (
          <button
            onClick={toggleCompleted}
            className="mx-4 mb-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            {completedCount} completed {completedCount === 1 ? "task" : "tasks"} hidden — show
          </button>
        )}
      </div>
      )}
    </div>
  );
}
