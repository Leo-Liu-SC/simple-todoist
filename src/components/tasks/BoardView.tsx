"use client";
import { useState, useEffect } from "react";
import {
  DndContext, closestCorners, PointerSensor, useSensor, useSensors,
  useDroppable, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTasks, updateTask } from "@/hooks/useTasks";
import { TaskFilters, Task, Status } from "@/lib/types";
import TaskCard from "./TaskCard";

const COLUMNS: { status: Status; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "done", label: "Done" },
];

function Column({ status, label, tasks }: { status: Status; label: string; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });
  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className="flex items-center gap-2 px-2 pb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 space-y-2 min-h-24 transition-colors ${
          isOver ? "bg-indigo-50" : "bg-gray-50"
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-xs text-gray-300 text-center py-6">Drop here</div>
        )}
      </div>
    </div>
  );
}

export default function BoardView({ filters }: { filters: TaskFilters }) {
  // Board shows all statuses regardless of the view's status filter.
  const { tasks, isLoading } = useTasks({ ...filters, status: undefined });
  const [local, setLocal] = useState<Task[]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setLocal(tasks);
  }, [tasks]);

  function columnTasks(status: Status) {
    return local.filter((t) => t.status === status);
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeId = Number(active.id);
    const task = local.find((t) => t.id === activeId);
    if (!task) return;

    // Determine target status: dropped on a column droppable or on another card.
    let targetStatus: Status | null = null;
    const overId = String(over.id);
    if (overId.startsWith("col-")) {
      targetStatus = overId.replace("col-", "") as Status;
    } else {
      const overTask = local.find((t) => t.id === Number(over.id));
      if (overTask) targetStatus = overTask.status;
    }
    if (!targetStatus || targetStatus === task.status) return;

    // Optimistic update
    setLocal((prev) => prev.map((t) => (t.id === activeId ? { ...t, status: targetStatus! } : t)));
    await updateTask(activeId, { status: targetStatus });
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-16 text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 h-full">
          {COLUMNS.map((c) => (
            <Column key={c.status} status={c.status} label={c.label} tasks={columnTasks(c.status)} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
