"use client";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import TaskDetail from "@/components/tasks/TaskDetail";
import QuickAdd from "@/components/tasks/QuickAdd";
import { useTaskContext } from "@/lib/TaskContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalQuickAdd, setGlobalQuickAdd] = useState(false);
  const { selectedTask, setSelectedTask } = useTaskContext();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable;
      if (e.key === "q" && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setGlobalQuickAdd(true);
      }
      if (e.key === "Escape") {
        setGlobalQuickAdd(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 w-60 transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 overflow-hidden min-w-0">
        <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-900">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-slate-900 tracking-tight">Tasks</span>
        </div>

        <div className={`flex-1 overflow-hidden pt-12 lg:pt-0 min-w-0 ${selectedTask ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
          {globalQuickAdd && (
            <div className="px-4 pt-4">
              <QuickAdd
                onClose={() => setGlobalQuickAdd(false)}
                onCreated={() => setGlobalQuickAdd(false)}
              />
            </div>
          )}
          {children}
        </div>

        {selectedTask && (
          <div className="w-full md:w-[400px] border-l border-slate-200 bg-white flex-shrink-0 overflow-hidden flex flex-col shadow-[-8px_0_24px_-12px_rgb(15_23_42/0.08)]">
            <TaskDetail
              taskId={selectedTask.id}
              onClose={() => setSelectedTask(null)}
              onDeleted={() => setSelectedTask(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
