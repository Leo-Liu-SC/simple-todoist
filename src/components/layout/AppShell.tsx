"use client";
import { useState, useEffect, useRef } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import TaskDetail from "@/components/tasks/TaskDetail";
import QuickAdd from "@/components/tasks/QuickAdd";
import { useTaskContext } from "@/lib/TaskContext";

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 420;
const SIDEBAR_DEFAULT = 240; // matches the previous w-60

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalQuickAdd, setGlobalQuickAdd] = useState(false);
  const { selectedTask, setSelectedTask } = useTaskContext();
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [resizing, setResizing] = useState(false);

  // Restore persisted sidebar width on mount.
  useEffect(() => {
    const saved = Number(localStorage.getItem("sidebarWidth"));
    if (saved >= SIDEBAR_MIN && saved <= SIDEBAR_MAX) setSidebarWidth(saved);
  }, []);

  // Drag-to-resize: track pointer while the handle is held.
  useEffect(() => {
    if (!resizing) return;
    function onMove(e: MouseEvent) {
      const w = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX));
      setSidebarWidth(w);
    }
    function onUp() {
      setResizing(false);
      setSidebarWidth((w) => {
        localStorage.setItem("sidebarWidth", String(w));
        return w;
      });
    }
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable;
      if (e.key === "q" && !isInput && !e.metaKey && !e.ctrlKey && !selectedTask) {
        e.preventDefault();
        setGlobalQuickAdd(true);
      }
      if (e.key === "Escape" && !selectedTask) {
        setGlobalQuickAdd(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedTask]);

  // Modal focus lifecycle: remember the trigger, move focus into the dialog on
  // open, restore focus to the trigger on close.
  useEffect(() => {
    if (selectedTask) {
      triggerRef.current = document.activeElement as HTMLElement;
      // Focus the dialog container after it mounts.
      requestAnimationFrame(() => dialogRef.current?.focus());
    } else if (triggerRef.current) {
      triggerRef.current.focus?.();
      triggerRef.current = null;
    }
  }, [selectedTask]);

  // Trap Tab within the dialog and close on Escape (scoped so popovers inside
  // can intercept Escape first via stopPropagation).
  function onDialogKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setSelectedTask(null);
      return;
    }
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* App content — made inert while the task modal is open so background
          controls are neither focusable nor announced to assistive tech. */}
      <div className="flex flex-1 h-full overflow-hidden" inert={!!selectedTask}>
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div
          style={{ ["--sidebar-w" as string]: `${sidebarWidth}px` }}
          className={`fixed inset-y-0 left-0 z-40 w-60 lg:w-[var(--sidebar-w)] lg:static lg:translate-x-0 lg:z-auto ${
            resizing ? "" : "transition-transform duration-200"
          } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <div className="relative h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
            {/* Drag handle to resize the sidebar (desktop only). */}
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              onMouseDown={(e) => { e.preventDefault(); setResizing(true); }}
              className="hidden lg:block absolute top-0 right-0 h-full w-1 cursor-col-resize group"
            >
              <div className={`absolute inset-y-0 right-0 w-0.5 transition-colors ${resizing ? "bg-indigo-400" : "bg-transparent group-hover:bg-indigo-300"}`} />
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-w-0">
          <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-500 hover:text-slate-900" aria-label="Open menu">
              <Menu size={20} />
            </button>
            <span className="font-semibold text-slate-900 tracking-tight">Tasks</span>
          </div>

          <div className="flex-1 overflow-hidden pt-12 lg:pt-0 min-w-0 flex flex-col">
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
        </div>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedTask(null)}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-title"
            tabIndex={-1}
            onKeyDown={onDialogKeyDown}
            className="relative bg-white rounded-2xl shadow-[0_24px_64px_-12px_rgb(15_23_42/0.35)] w-full max-w-4xl min-h-[580px] max-h-[90vh] overflow-hidden flex flex-col focus:outline-none animate-[modalIn_0.15s_ease-out]"
          >
            <TaskDetail
              taskId={selectedTask.id}
              onClose={() => setSelectedTask(null)}
              onDeleted={() => setSelectedTask(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
