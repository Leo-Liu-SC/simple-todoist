"use client";
import { use } from "react";
import { useProjects } from "@/hooks/useProjects";
import TaskList from "@/components/tasks/TaskList";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { projects } = useProjects();
  const project = projects.find((p) => p.id === Number(id));
  return (
    <TaskList
      title={project?.name ?? "Project"}
      filters={{ projectId: Number(id) }}
      projectId={Number(id)}
    />
  );
}
