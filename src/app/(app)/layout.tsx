import { TaskProvider } from "@/lib/TaskContext";
import { ToastProvider } from "@/lib/ToastContext";
import AppShell from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <TaskProvider>
        <AppShell>{children}</AppShell>
      </TaskProvider>
    </ToastProvider>
  );
}
