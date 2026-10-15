import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, History, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskArchiveButton } from "@/features/tasks/components/task-archive-button";
import { TaskAttachmentList, TaskAttachmentUploadForm } from "@/features/tasks/components/task-attachments";
import { EditTaskForm } from "@/features/tasks/components/task-form";
import { taskPriorityLabels, taskStatusLabels } from "@/features/tasks/constants";
import { getTaskFormOptions } from "@/features/tasks/data";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("pt-BR", includeTime ? { dateStyle: "short", timeStyle: "short" } : { timeZone: "UTC" }).format(includeTime ? new Date(value) : new Date(`${value}T12:00:00Z`));
}

const priorityStyles: Record<Enums<"task_priority">, string> = {
  LOW: "border-border bg-background-elevated text-muted-foreground",
  MEDIUM: "border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light",
  HIGH: "border-status-attention/25 bg-status-attention/10 text-status-attention",
  URGENT: "border-status-critical/25 bg-status-critical/10 text-status-critical",
};

export default async function TaskDetailPage({ params }: PageProps<"/tasks/[id]">) {
  const { id } = await params;
  await requireCurrentProfile();
  const supabase = await createClient();
  const [taskResult, assigneesResult, historyResult, attachmentsResult, options] = await Promise.all([
    supabase.from("tasks").select("*, clients(id, name), services(id, name), profiles!tasks_created_by_fkey(id, full_name)").eq("id", id).is("archived_at", null).maybeSingle(),
    supabase.from("task_assignees").select("user_id, profiles!task_assignees_user_id_fkey(id, full_name)").eq("task_id", id),
    supabase.from("task_status_history").select("id, from_status, to_status, changed_at, profiles!task_status_history_changed_by_fkey(full_name)").eq("task_id", id).order("changed_at", { ascending: false }),
    supabase.from("task_attachments").select("id, name, mime_type, size_bytes, created_at, profiles!task_attachments_uploaded_by_fkey(full_name)").eq("task_id", id).order("created_at", { ascending: false }),
    getTaskFormOptions(),
  ]);
  const task = taskResult.data;
  if (!task) notFound();
  const assignees = (assigneesResult.data ?? []).map((item) => ({ id: item.user_id, name: item.profiles?.full_name ?? "Usuário" }));

  return <div className="space-y-6 lg:space-y-7">
    <Link href="/tasks" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}><ArrowLeft aria-hidden="true" />Voltar para tarefas</Link>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="mb-3 flex flex-wrap gap-2"><Badge className={priorityStyles[task.priority]}>{taskPriorityLabels[task.priority]}</Badge><Badge variant="outline">{taskStatusLabels[task.status]}</Badge></div><h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-[2.1rem]">{task.title}</h1><p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{task.description ?? "Sem descrição."}</p></div>{task.status === "DONE" ? <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-status-healthy/25 bg-status-healthy/10 text-status-healthy"><CheckCircle2 className="size-5" aria-hidden="true" /></span> : null}</div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <div className="space-y-5">
        <Card className="gap-0 py-0"><CardHeader className="border-b border-border px-5 py-5"><CardTitle>Contexto da tarefa</CardTitle><CardDescription>Relacionamentos e responsáveis pela execução.</CardDescription></CardHeader><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background-elevated/45 p-4"><p className="text-xs text-muted-foreground">Cliente</p>{task.clients ? <Link href={`/clients/${task.clients.id}/tasks`} className="mt-2 block font-semibold text-text-primary hover:text-compass-purple-light">{task.clients.name}</Link> : <p className="mt-2 font-semibold text-text-primary">Compass · tarefa interna</p>}</div>
          <div className="rounded-xl border border-border bg-background-elevated/45 p-4"><p className="text-xs text-muted-foreground">Serviço</p><p className="mt-2 font-semibold text-text-primary">{task.services?.name ?? "Não definido"}</p></div>
          <div className="rounded-xl border border-border bg-background-elevated/45 p-4"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" aria-hidden="true" />Prazo</p><p className="mt-2 font-semibold text-text-primary">{task.due_date ? formatDate(task.due_date) : "Sem prazo"}</p></div>
          <div className="rounded-xl border border-border bg-background-elevated/45 p-4"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserRound className="size-3.5" aria-hidden="true" />Responsáveis</p><p className="mt-2 font-semibold text-text-primary">{assignees.length ? assignees.map((item) => item.name).join(", ") : "Não definidos"}</p></div>
        </CardContent></Card>

        <Card className="gap-0 py-0"><CardHeader className="border-b border-border px-5 py-5"><div className="flex items-center gap-3"><History className="size-4 text-compass-purple-light" aria-hidden="true" /><div><CardTitle>Histórico de etapas</CardTitle><CardDescription>Movimentações registradas automaticamente.</CardDescription></div></div></CardHeader><CardContent className="divide-y divide-border px-5">{historyResult.data?.length ? historyResult.data.map((entry) => <div key={entry.id} className="flex flex-col gap-1 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-text-secondary">{entry.from_status ? taskStatusLabels[entry.from_status] : "Criação"} → <span className="font-semibold text-text-primary">{taskStatusLabels[entry.to_status]}</span></p><p className="text-xs text-muted-foreground">{entry.profiles?.full_name ?? "Sistema"} · {formatDate(entry.changed_at, true)}</p></div>) : <p className="py-6 text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>}</CardContent></Card>

        <Card className="gap-0 py-0"><CardHeader className="border-b border-border px-5 py-5"><CardTitle>Anexos</CardTitle><CardDescription>Referências de arte, briefings e arquivos relacionados à execução.</CardDescription></CardHeader><CardContent className="space-y-5 p-5"><TaskAttachmentList taskId={task.id} attachments={(attachmentsResult.data ?? []).map((attachment) => ({ id: attachment.id, name: attachment.name, mimeType: attachment.mime_type, sizeBytes: attachment.size_bytes, createdAt: attachment.created_at, uploaderName: attachment.profiles?.full_name ?? "Usuário" }))} /><details className="rounded-xl border border-border bg-background-elevated/35"><summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-text-secondary">Adicionar arquivo</summary><div className="border-t border-border p-4"><TaskAttachmentUploadForm taskId={task.id} /></div></details></CardContent></Card>
      </div>

      <Card className="h-fit gap-0 py-0 xl:sticky xl:top-24"><CardHeader className="border-b border-border px-5 py-5"><CardTitle>Editar tarefa</CardTitle><CardDescription>Altere escopo, etapa, prazo e responsáveis.</CardDescription></CardHeader><CardContent className="space-y-5 p-5"><EditTaskForm task={{ id: task.id, title: task.title, description: task.description, clientId: task.client_id, serviceId: task.service_id, status: task.status, priority: task.priority, dueDate: task.due_date, assigneeIds: assignees.map((item) => item.id) }} clients={options.clients} services={options.services} profiles={options.profiles} /><div className="border-t border-border pt-5"><TaskArchiveButton taskId={task.id} /></div></CardContent></Card>
    </div>
  </div>;
}

