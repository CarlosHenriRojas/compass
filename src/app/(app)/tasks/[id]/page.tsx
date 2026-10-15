import { TaskDetails } from "@/features/tasks/components/task-details";

export default async function TaskDetailPage({ params }: PageProps<"/tasks/[id]">) {
  const { id } = await params;

  return <TaskDetails taskId={id} presentation="page" />;
}

