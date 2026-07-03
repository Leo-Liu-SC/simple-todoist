import { TaskProvider } from "@/lib/TaskContext";
import AppShell from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TaskProvider>
      <AppShell>{children}</AppShell>
    </TaskProvider>
  );
}
