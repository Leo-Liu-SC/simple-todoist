"use client";
import { use } from "react";
import { useLabels } from "@/hooks/useLabels";
import TaskList from "@/components/tasks/TaskList";

export default function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { labels } = useLabels();
  const label = labels.find((l) => l.id === Number(id));

  return (
    <TaskList
      title={label?.name ?? "Label"}
      filters={{ labelId: Number(id) }}
    />
  );
}
