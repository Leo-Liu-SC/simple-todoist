import TaskList from "@/components/tasks/TaskList";

export default function TodayPage() {
  return <TaskList title="Today" filters={{ view: "today" }} />;
}
