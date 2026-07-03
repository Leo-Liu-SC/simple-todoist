"use client";
import { createContext, useContext, useState } from "react";
import { Task } from "./types";

interface TaskContextValue {
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
}

const TaskContext = createContext<TaskContextValue>({
  selectedTask: null,
  setSelectedTask: () => {},
});

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  return (
    <TaskContext.Provider value={{ selectedTask, setSelectedTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  return useContext(TaskContext);
}
