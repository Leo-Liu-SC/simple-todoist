import useSWR, { mutate as globalMutate } from "swr";
import { Task, TaskFilters } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function buildUrl(filters: TaskFilters) {
  const params = new URLSearchParams();
  if (filters.view) params.set("view", filters.view);
  if (filters.projectId) params.set("projectId", String(filters.projectId));
  if (filters.labelId) params.set("labelId", String(filters.labelId));
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  return `/api/tasks?${params.toString()}`;
}

export function useTasks(filters: TaskFilters = {}) {
  const url = buildUrl(filters);
  const { data, error, isLoading, mutate } = useSWR<Task[]>(url, fetcher);
  return { tasks: data ?? [], error, isLoading, mutate };
}

export function useTask(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<Task>(
    id ? `/api/tasks/${id}` : null,
    fetcher
  );
  return { task: data, error, isLoading, mutate };
}

export async function createTask(data: Partial<Task> & { title: string; labelIds?: number[] }) {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await globalMutate((key: string) => typeof key === "string" && key.startsWith("/api/tasks"), undefined, { revalidate: true });
  await globalMutate("/api/projects");
  return res.json();
}

export async function updateTask(id: number, data: Partial<Task> & { labelIds?: number[] }) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await globalMutate((key: string) => typeof key === "string" && key.startsWith("/api/tasks"), undefined, { revalidate: true });
  await globalMutate("/api/projects");
  return res.json();
}

export async function deleteTask(id: number) {
  await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  await globalMutate((key: string) => typeof key === "string" && key.startsWith("/api/tasks"), undefined, { revalidate: true });
  await globalMutate("/api/projects");
}

export async function reorderTasks(orderedIds: number[]) {
  const items = orderedIds.map((id, index) => ({ id, order: index }));
  await fetch("/api/tasks/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  await globalMutate((key: string) => typeof key === "string" && key.startsWith("/api/tasks"), undefined, { revalidate: true });
}
