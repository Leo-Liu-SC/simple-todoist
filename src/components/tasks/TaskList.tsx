"use client";
import { useState, useEffect } from "react";
import { Plus, Settings2, List as ListIcon, Columns3, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { useTasks, reorderTasks } from "@/hooks/useTasks";
import { TaskFilters, Task, ColumnConfig, SortKey, SortRule } from "@/lib/types";
import { useTaskContext } from "@/lib/TaskContext";
import TaskItem from "./TaskItem";
import QuickAdd from "./QuickAdd";
import BoardView from "./BoardView";
import { gridTemplate, statusRank } from "@/lib/taskMeta";

const DEFAULT_COLUMNS: ColumnConfig = { priority: true, dueDate: true, labels: true, project: true, status: true };

// Clickable column header with sort direction + precedence indicator.
function SortHeader({
  label, sortKey, rules, onToggle, align,
}: {
  label: string;
  sortKey: SortKey;
  rules: SortRule[];
  onToggle: (k: SortKey) => void;
  align: "left" | "right";
}) {
  const idx = rules.findIndex((r) => r.key === sortKey);
  const rule = idx >= 0 ? rules[idx] : null;
  return (
    <button
      onClick={() => onToggle(sortKey)}
      className={`flex items-center gap-1 ${align === "right" ? "justify-end" : "justify-start"} hover:text-slate-700 transition-colors ${rule ? "text-indigo-600" : ""}`}
      title="Click to sort · click again to reverse · again to remove"
    >
      {label}
      {rule && (rule.dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      {rule && rules.length > 1 && <span className="text-[9px] font-bold">{idx + 1}</span>}
    </button>
  );
}

function useColumnConfig(key: string): [ColumnConfig, (c: ColumnConfig) => void] {
  const [config, setConfig] = useState<ColumnConfig>(DEFAULT_COLUMNS);
  useEffect(() => {
    const stored = localStorage.getItem(key);
    // Merge with defaults so newly-added columns (e.g. status) appear for
    // users who already have an older config saved.
    if (stored) setConfig({ ...DEFAULT_COLUMNS, ...JSON.parse(stored) });
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
  const sortKey = `sortrules-${scopeKey}`;
  const completedKey = `showCompleted-${scopeKey}`;
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [sortRules, setSortRules] = useState<SortRule[]>([]);
  const [showCompleted, setShowCompleted] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(viewKey);
    if (stored === "board" || stored === "list") setViewMode(stored);
    const s = localStorage.getItem(sortKey);
    if (s) { try { setSortRules(JSON.parse(s)); } catch { /* ignore */ } }
    const c = localStorage.getItem(completedKey);
    if (c === "false") setShowCompleted(false);
  }, [viewKey, sortKey, completedKey]);

  function setView(mode: "list" | "board") {
    setViewMode(mode);
    localStorage.setItem(viewKey, mode);
  }
  function persistSort(rules: SortRule[]) {
    setSortRules(rules);
    localStorage.setItem(sortKey, JSON.stringify(rules));
  }
  // Click a column header: asc → desc → remove. Stacks with existing keys
  // (later clicks append, so the first-clicked column is the primary sort).
  function toggleSort(key: SortKey) {
    const existing = sortRules.find((r) => r.key === key);
    if (!existing) {
      persistSort([...sortRules, { key, dir: "asc" }]);
    } else if (existing.dir === "asc") {
      persistSort(sortRules.map((r) => (r.key === key ? { ...r, dir: "desc" } : r)));
    } else {
      persistSort(sortRules.filter((r) => r.key !== key));
    }
  }
  function clearSort() {
    persistSort([]);
  }
  function toggleCompleted() {
    setShowCompleted((v) => {
      localStorage.setItem(completedKey, String(!v));
      return !v;
    });
  }

  function sortValue(t: Task, key: SortKey): number {
    if (key === "status") return statusRank(t.status);
    if (key === "priority") return t.priority;
    // dueDate: undated sinks to the end
    return t.dueDate ? new Date(t.dueDate).getTime() : Infinity;
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
    // Completed tasks always sink to the bottom regardless of sort keys.
    const aDone = a.status === "done" ? 1 : 0;
    const bDone = b.status === "done" ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    // Apply each sort rule in precedence order.
    for (const r of sortRules) {
      const av = sortValue(a, r.key);
      const bv = sortValue(b, r.key);
      if (av !== bv) return r.dir === "asc" ? av - bv : bv - av;
    }
    return 0; // no more keys: keep manual/base order
  });

  // Reordering allowed only when not searching and no active sort keys.
  const canReorder = !search && sortRules.length === 0;

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
              className={`p-1.5 rounded-lg transition-colors ${sortRules.length > 0 ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
              title="Sort & display options"
            >
              <ArrowUpDown size={16} />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-9 z-20 bg-white border border-slate-200 rounded-xl shadow-[var(--shadow-pop)] py-2 w-60">
                  <p className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sort</p>
                  {sortRules.length === 0 ? (
                    <p className="px-3 py-1 text-xs text-slate-400">Click a column header to sort. Click more headers to combine.</p>
                  ) : (
                    <div className="px-3 py-1 space-y-1">
                      {sortRules.map((r, i) => (
                        <div key={r.key} className="flex items-center gap-2 text-sm text-slate-600">
                          <span className="text-[11px] text-slate-400 w-3">{i + 1}</span>
                          <span className="flex-1 capitalize">{r.key === "dueDate" ? "Due date" : r.key}</span>
                          <span className="text-xs text-slate-400">{r.dir === "asc" ? "↑ asc" : "↓ desc"}</span>
                        </div>
                      ))}
                      <button onClick={clearSort} className="text-xs text-indigo-600 hover:text-indigo-800 pt-1">Clear sort</button>
                    </div>
                  )}
                  <div className="my-1.5 border-t border-slate-100" />
                  <button
                    onClick={toggleCompleted}
                    className="flex items-center justify-between w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Show completed
                    <span className={`w-8 h-[18px] rounded-full relative transition-colors ${showCompleted ? "bg-indigo-500" : "bg-slate-300"}`}>
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
              </div>
            </>
          )}
        </div>
      </div>

      {viewMode === "board" ? (
        <BoardView filters={filters} />
      ) : (
      <div className="flex-1 overflow-y-auto">
        {!isLoading && filtered.length > 0 && (
          <div
            className="grid items-center gap-3 px-4 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur z-[5]"
            style={{ gridTemplateColumns: gridTemplate(columns) }}
          >
            <span />
            {columns.status && <SortHeader label="Status" sortKey="status" rules={sortRules} onToggle={toggleSort} align="left" />}
            {columns.project && <span>Project</span>}
            <span>Task</span>
            {columns.dueDate && <SortHeader label="Due" sortKey="dueDate" rules={sortRules} onToggle={toggleSort} align="left" />}
            {columns.priority && <SortHeader label="Priority" sortKey="priority" rules={sortRules} onToggle={toggleSort} align="left" />}
            {columns.labels && <span>Labels</span>}
            <span />
          </div>
        )}
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
