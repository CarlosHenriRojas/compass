import { TaskDetails } from "@/features/tasks/components/task-details";
import { TaskModalShell } from "@/features/tasks/components/task-modal-shell";

export default async function TaskModalPage({ params }: PageProps<"/tasks/[id]">) {
  const { id } = await params;

  return (
    <TaskModalShell>
      <TaskDetails taskId={id} presentation="modal" />
    </TaskModalShell>
  );
}
