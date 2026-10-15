import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  History,
  ListChecks,
  Settings2,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { TaskArchiveButton } from "@/features/tasks/components/task-archive-button";
import {
  TaskAttachmentList,
  TaskAttachmentUploadForm,
} from "@/features/tasks/components/task-attachments";
import { EditTaskForm } from "@/features/tasks/components/task-form";
import { SubtaskSection } from "@/features/tasks/components/subtask-section";
import { taskPriorityLabels, taskStatusLabels } from "@/features/tasks/constants";
import { getTaskFormOptions } from "@/features/tasks/data";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    includeTime
      ? { dateStyle: "short", timeStyle: "short" }
      : { timeZone: "UTC" },
  ).format(includeTime ? new Date(value) : new Date(`${value}T12:00:00Z`));
}

const priorityStyles: Record<Enums<"task_priority">, string> = {
  LOW: "border-border bg-background-elevated text-muted-foreground",
  MEDIUM:
    "border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light",
  HIGH: "border-status-attention/25 bg-status-attention/10 text-status-attention",
  URGENT: "border-status-critical/25 bg-status-critical/10 text-status-critical",
};

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-compass-purple-soft text-compass-purple-light">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-base font-semibold tracking-tight text-text-primary">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export async function TaskDetails({
  taskId,
  presentation,
}: {
  taskId: string;
  presentation: "page" | "modal";
}) {
  await requireCurrentProfile();
  const supabase = await createClient();
  const [
    taskResult,
    assigneesResult,
    historyResult,
    attachmentsResult,
    subtasksResult,
    options,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "*, clients(id, name), services(id, name), profiles!tasks_created_by_fkey(id, full_name)",
      )
      .eq("id", taskId)
      .is("archived_at", null)
      .maybeSingle(),
    supabase
      .from("task_assignees")
      .select("user_id, profiles!task_assignees_user_id_fkey(id, full_name)")
      .eq("task_id", taskId),
    supabase
      .from("task_status_history")
      .select(
        "id, from_status, to_status, changed_at, profiles!task_status_history_changed_by_fkey(full_name)",
      )
      .eq("task_id", taskId)
      .order("changed_at", { ascending: false }),
    supabase
      .from("task_attachments")
      .select(
        "id, name, mime_type, size_bytes, created_at, profiles!task_attachments_uploaded_by_fkey(full_name)",
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select(
        "id, title, description, status, priority, due_date, task_assignees(user_id, profiles!task_assignees_user_id_fkey(id, full_name))",
      )
      .eq("parent_task_id", taskId)
      .is("archived_at", null)
      .order("sort_order")
      .order("due_date", { ascending: true, nullsFirst: false }),
    getTaskFormOptions(),
  ]);

  const task = taskResult.data;
  if (!task) notFound();

  const assignees = (assigneesResult.data ?? []).map((item) => ({
    id: item.user_id,
    name: item.profiles?.full_name ?? "Usuário",
  }));
  const parent = task.parent_task_id
    ? (
        await supabase
          .from("tasks")
          .select("id, title")
          .eq("id", task.parent_task_id)
          .maybeSingle()
      ).data
    : null;
  const subtasks = (subtasksResult.data ?? []).map((subtask) => ({
    id: subtask.id,
    title: subtask.title,
    description: subtask.description,
    status: subtask.status,
    priority: subtask.priority,
    dueDate: subtask.due_date,
    assignees: subtask.task_assignees.flatMap((assignment) =>
      assignment.profiles
        ? [
            {
              id: assignment.profiles.id,
              name: assignment.profiles.full_name,
            },
          ]
        : [],
    ),
  }));
  const attachments = (attachmentsResult.data ?? []).map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    mimeType: attachment.mime_type,
    sizeBytes: attachment.size_bytes,
    createdAt: attachment.created_at,
    uploaderName: attachment.profiles?.full_name ?? "Usuário",
  }));

  return (
    <article
      className={cn(
        "overflow-hidden bg-background",
        presentation === "page" &&
          "rounded-2xl border border-border bg-card shadow-card",
      )}
    >
      <header className="border-b border-border px-5 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6 lg:px-9 lg:pb-8 lg:pt-8">
        {presentation === "page" ? (
          <Link
            href={parent ? `/tasks/${parent.id}` : "/tasks"}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-5",
            )}
          >
            <ArrowLeft aria-hidden="true" />
            {parent ? "Voltar para tarefa principal" : "Voltar para tarefas"}
          </Link>
        ) : null}

        <div className={cn(presentation === "modal" && "pr-12 sm:pr-14")}>
          {parent ? (
            <Link
              href={`/tasks/${parent.id}`}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-compass-purple-light hover:underline"
            >
              <ListChecks className="size-3.5" aria-hidden="true" />
              Subtarefa de {parent.title}
              <ChevronRight className="size-3" aria-hidden="true" />
            </Link>
          ) : null}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge className={priorityStyles[task.priority]}>
              {taskPriorityLabels[task.priority]}
            </Badge>
            <Badge variant="outline">{taskStatusLabels[task.status]}</Badge>
            {parent ? <Badge variant="outline">Subtarefa</Badge> : null}
            {task.status === "DONE" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-healthy">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Concluída
              </span>
            ) : null}
          </div>
          <h1 className="max-w-5xl text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl lg:text-[2.15rem]">
            {task.title}
          </h1>
        </div>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 divide-y divide-border px-5 sm:px-7 lg:px-9">
          <section className="py-7 lg:py-8">
            <SectionHeading icon={FileText} title="Descrição" />
            <p className="max-w-4xl whitespace-pre-wrap text-sm leading-7 text-text-secondary">
              {task.description ?? "Nenhuma descrição adicionada."}
            </p>
          </section>

          {!task.parent_task_id ? (
            <section className="py-7 lg:py-8">
              <SectionHeading
                icon={ListChecks}
                title="Subtarefas"
                description="Entregas menores com responsáveis, prazos e etapas independentes."
              />
              <SubtaskSection
                parentTaskId={task.id}
                subtasks={subtasks}
                profiles={options.profiles}
              />
            </section>
          ) : null}

          <section className="py-7 lg:py-8">
            <SectionHeading
              icon={FileText}
              title="Anexos"
              description="Referências de arte, briefings e arquivos relacionados à execução."
            />
            <div className="space-y-4">
              <TaskAttachmentList taskId={task.id} attachments={attachments} />
              <details className="rounded-xl border border-border">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-text-secondary hover:text-foreground">
                  Adicionar arquivo
                </summary>
                <div className="border-t border-border p-4">
                  <TaskAttachmentUploadForm taskId={task.id} />
                </div>
              </details>
            </div>
          </section>

          <section className="py-7 lg:py-8">
            <details>
              <summary className="group cursor-pointer list-none">
                <div className="flex items-center justify-between gap-4">
                  <SectionHeading
                    icon={History}
                    title="Histórico de etapas"
                    description="Movimentações registradas automaticamente."
                  />
                  <ChevronRight className="mb-5 size-4 text-text-muted transition-transform group-open:rotate-90" />
                </div>
              </summary>
              <div className="divide-y divide-border border-t border-border">
                {historyResult.data?.length ? (
                  historyResult.data.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-1 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="text-text-secondary">
                        {entry.from_status
                          ? taskStatusLabels[entry.from_status]
                          : "Criação"}{" "}
                        →{" "}
                        <span className="font-semibold text-text-primary">
                          {taskStatusLabels[entry.to_status]}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.profiles?.full_name ?? "Sistema"} ·{" "}
                        {formatDate(entry.changed_at, true)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="py-5 text-sm text-muted-foreground">
                    Nenhuma movimentação registrada ainda.
                  </p>
                )}
              </div>
            </details>
          </section>
        </div>

        <aside className="border-t border-border bg-background-elevated/30 px-5 py-7 sm:px-7 xl:border-l xl:border-t-0 xl:px-6 xl:py-8">
          <div className="space-y-7 xl:sticky xl:top-6">
            <div>
              <p className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-muted">
                Informações
              </p>
              <dl className="space-y-5">
                <div>
                  <dt className="text-xs text-muted-foreground">Cliente</dt>
                  <dd className="mt-1.5 text-sm font-semibold text-text-primary">
                    {task.clients ? (
                      <Link
                        href={`/clients/${task.clients.id}/tasks`}
                        className="inline-flex items-center gap-1 hover:text-compass-purple-light"
                      >
                        {task.clients.name}
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    ) : (
                      "Compass · tarefa interna"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Serviço</dt>
                  <dd className="mt-1.5 text-sm font-semibold text-text-primary">
                    {task.services?.name ?? "Não definido"}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" aria-hidden="true" />
                    Prazo
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold text-text-primary">
                    {task.due_date ? formatDate(task.due_date) : "Sem prazo"}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserRound className="size-3.5" aria-hidden="true" />
                    Responsáveis
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold leading-6 text-text-primary">
                    {assignees.length
                      ? assignees.map((item) => item.name).join(", ")
                      : "Não definidos"}
                  </dd>
                </div>
              </dl>
            </div>

            <details className="group border-t border-border pt-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-text-primary">
                <span className="flex items-center gap-2">
                  <Settings2
                    className="size-4 text-compass-purple-light"
                    aria-hidden="true"
                  />
                  {parent ? "Editar subtarefa" : "Editar tarefa"}
                </span>
                <ChevronRight className="size-4 text-text-muted transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-5">
                <EditTaskForm
                  task={{
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    clientId: task.client_id,
                    serviceId: task.service_id,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.due_date,
                    assigneeIds: assignees.map((item) => item.id),
                  }}
                  clients={options.clients}
                  services={options.services}
                  profiles={options.profiles}
                  fixedClientId={parent ? task.client_id : undefined}
                />
              </div>
            </details>

            <div className="border-t border-border pt-5">
              <TaskArchiveButton taskId={task.id} />
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
