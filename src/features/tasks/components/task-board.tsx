"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarClock, GripVertical, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { updateTaskStatusAction } from "@/features/tasks/actions";
import { taskPriorityLabels, taskStatuses } from "@/features/tasks/constants";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: Enums<"task_status">;
  priority: Enums<"task_priority">;
  dueDate: string | null;
  client: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
  assignees: Array<{ id: string; name: string }>;
};

const columnStyles: Record<Enums<"task_status">, string> = {
  TODO: "bg-text-muted",
  IN_PROGRESS: "bg-compass-purple-light",
  REVIEW: "bg-status-attention",
  DONE: "bg-status-healthy",
};

const priorityStyles: Record<Enums<"task_priority">, string> = {
  LOW: "border-border bg-background-elevated text-muted-foreground",
  MEDIUM: "border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light",
  HIGH: "border-status-attention/25 bg-status-attention/10 text-status-attention",
  URGENT: "border-status-critical/25 bg-status-critical/10 text-status-critical",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function TaskCard({ task, onMove, moving }: { task: BoardTask; onMove: (id: string, status: Enums<"task_status">) => void; moving: boolean }) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const overdue = Boolean(task.dueDate && task.dueDate < today && task.status !== "DONE");
  return <article draggable onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)} className={cn("rounded-xl border border-border bg-card p-4 shadow-card transition-[border-color,transform,opacity] hover:-translate-y-0.5 hover:border-border-strong", moving && "opacity-55")}>
    <div className="mb-3 flex items-start justify-between gap-3"><Badge className={priorityStyles[task.priority]}>{taskPriorityLabels[task.priority]}</Badge><GripVertical className="size-4 cursor-grab text-text-muted" aria-hidden="true" /></div>
    <Link href={`/tasks/${task.id}`} className="block text-sm font-semibold leading-5 text-text-primary hover:text-compass-purple-light">{task.title}</Link>
    {task.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description}</p> : null}
    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
      {task.client ? <Link href={`/clients/${task.client.id}/overview`} className="block truncate font-medium text-text-secondary hover:text-compass-purple-light">{task.client.name}</Link> : <span className="block text-text-muted">Compass · tarefa interna</span>}
      {task.service ? <span className="block truncate">{task.service.name}</span> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn("flex items-center gap-1.5", overdue && "font-semibold text-status-critical")}><CalendarClock className="size-3.5" aria-hidden="true" />{task.dueDate ? formatDate(task.dueDate) : "Sem prazo"}</span>
        <span className="flex items-center gap-1.5"><UserRound className="size-3.5" aria-hidden="true" />{task.assignees.length || "—"}</span>
      </div>
    </div>
    <label className="mt-4 block border-t border-border pt-3"><span className="sr-only">Mover tarefa</span><select value={task.status} onChange={(event) => onMove(task.id, event.target.value as Enums<"task_status">)} disabled={moving} className="h-8 w-full rounded-lg border border-border bg-background-elevated px-2 text-xs text-text-secondary outline-none focus:border-compass-purple-light">{taskStatuses.map((status) => <option key={status.value} value={status.value}>{status.shortLabel}</option>)}</select></label>
  </article>;
}

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  const router = useRouter();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [, startMoveTransition] = useTransition();
  function move(taskId: string, status: Enums<"task_status">) {
    setMovingId(taskId); setMessage("");
    startMoveTransition(async () => {
      const result = await updateTaskStatusAction(taskId, status);
      if (!result.ok) setMessage(result.message);
      setMovingId(null);
      router.refresh();
    });
  }
  function drop(event: React.DragEvent, status: Enums<"task_status">) {
    event.preventDefault(); const taskId = event.dataTransfer.getData("text/task-id");
    if (taskId) move(taskId, status);
  }
  return <div className="space-y-3">
    {message ? <div role="alert" className="rounded-xl border border-status-critical/25 bg-status-critical/8 px-4 py-3 text-sm text-status-critical">{message}</div> : null}
    <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {taskStatuses.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.value);
        return <section key={column.value} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, column.value)} className="min-h-48 rounded-2xl border border-border bg-background-elevated/35 p-3">
          <header className="mb-3 flex items-center justify-between px-1 py-1"><div className="flex items-center gap-2"><span className={cn("size-2 rounded-full", columnStyles[column.value])} /><h2 className="text-sm font-semibold text-text-primary">{column.label}</h2></div><Badge variant="outline">{columnTasks.length}</Badge></header>
          <div className="space-y-3">{columnTasks.map((task) => <TaskCard key={task.id} task={task} onMove={move} moving={movingId === task.id} />)}{columnTasks.length === 0 ? <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-text-muted">Arraste uma tarefa para cá</div> : null}</div>
        </section>;
      })}
    </div>
  </div>;
}

