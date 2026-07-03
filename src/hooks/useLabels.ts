import useSWR, { mutate } from "swr";
import { Label } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLabels() {
  const { data, error, isLoading } = useSWR<Label[]>("/api/labels", fetcher);
  return { labels: data ?? [], error, isLoading };
}

export async function createLabel(name: string, color: string) {
  const res = await fetch("/api/labels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color }),
  });
  await mutate("/api/labels");
  return res.json();
}

export async function updateLabel(id: number, data: Partial<Label>) {
  await fetch(`/api/labels/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await mutate("/api/labels");
}

export async function deleteLabel(id: number) {
  await fetch(`/api/labels/${id}`, { method: "DELETE" });
  await mutate("/api/labels");
}
