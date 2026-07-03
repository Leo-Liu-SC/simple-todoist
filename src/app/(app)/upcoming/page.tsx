import TaskList from "@/components/tasks/TaskList";

export default function UpcomingPage() {
  return <TaskList title="Upcoming" filters={{ view: "upcoming" }} />;
}
