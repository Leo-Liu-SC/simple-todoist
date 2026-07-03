import useSWR, { mutate } from "swr";
import { Project } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProjects() {
  const { data, error, isLoading } = useSWR<Project[]>("/api/projects", fetcher);
  return { projects: data ?? [], error, isLoading };
}

export async function createProject(name: string, color: string, parentId?: number | null) {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color, parentId: parentId ?? null }),
  });
  await mutate("/api/projects");
  return res.json();
}

export async function updateProject(id: number, data: Partial<Pick<Project, "name" | "color" | "order" | "parentId">>) {
  await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await mutate("/api/projects");
}

export async function deleteProject(id: number) {
  await fetch(`/api/projects/${id}`, { method: "DELETE" });
  await mutate("/api/projects");
}
