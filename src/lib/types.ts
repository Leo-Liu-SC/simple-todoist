export type Priority = 1 | 2 | 3 | 4;
export type Status = "new" | "onme" | "delegated" | "blocked" | "notime" | "resultback" | "done";
export type SortMode = "manual" | "dueDate" | "priority";

export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface Project {
  id: number;
  name: string;
  color: string;
  order: number;
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number };
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: Priority;
  status: Status;
  order: number;
  projectId?: number | null;
  parentId?: number | null;
  project?: Pick<Project, "id" | "name" | "color"> | null;
  labels: Label[];
  subtasks?: Task[];
  _count?: { subtasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  projectId?: number;
  labelId?: number;
  status?: Status;
  view?: "today" | "upcoming" | "all";
  q?: string;
  parentId?: number | null;
}

export interface ColumnConfig {
  priority: boolean;
  dueDate: boolean;
  labels: boolean;
  project: boolean;
  status: boolean;
}
