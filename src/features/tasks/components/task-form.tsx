"use client";

import { startTransition, type FormEvent, useActionState, useEffect, useRef } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTaskAction, updateTaskAction } from "@/features/tasks/actions";
import { taskPriorityLabels, taskStatuses } from "@/features/tasks/constants";
import { initialTaskActionState } from "@/features/tasks/task-state";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

const selectClassName = "h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive/70";

type Option = { id: string; name: string };

type EditableTask = {
  id: string;
  title: string;
  description: string | null;
  clientId: string | null;
  serviceId: string | null;
  status: Enums<"task_status">;
  priority: Enums<"task_priority">;
  dueDate: string | null;
  assigneeIds: string[];
};

function Message({ status, message }: { status: string; message: string }) {
  if (!message) return null;
  const success = status === "success";
  return <div role={success ? "status" : "alert"} className={cn("flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm", success ? "border-status-healthy/25 bg-status-healthy/8 text-status-healthy" : "border-status-critical/25 bg-status-critical/8 text-status-critical")}>{success ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}<span>{message}</span></div>;
}

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label htmlFor={name} className="text-sm font-medium text-text-primary">{label}</label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}

function TaskFields({
  prefix,
  clients,
  services,
  profiles,
  fixedClientId,
  task,
  error,
}: {
  prefix: string;
  clients: Option[];
  services: Option[];
  profiles: Option[];
  fixedClientId?: string;
  task?: EditableTask;
  error: (field: string) => string | undefined;
}) {
  return <>
    {task ? <input type="hidden" name="taskId" value={task.id} /> : null}
    {fixedClientId ? <input type="hidden" name="clientId" value={fixedClientId} /> : (
      <Field label="Cliente" name={`${prefix}-client`} error={error("clientId")}>
        <select id={`${prefix}-client`} name="clientId" defaultValue={task?.clientId ?? ""} className={selectClassName}>
          <option value="">Tarefa interna da Compass</option>
          {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
      </Field>
    )}
    <Field label="Título" name={`${prefix}-title`} error={error("title")}>
      <Input id={`${prefix}-title`} name="title" defaultValue={task?.title ?? ""} placeholder="Ex.: Criar campanha de lançamento" required aria-invalid={Boolean(error("title"))} />
    </Field>
    <Field label="Descrição" name={`${prefix}-description`} error={error("description")}>
      <Textarea id={`${prefix}-description`} name="description" defaultValue={task?.description ?? ""} className="min-h-28" placeholder="Contexto, orientações e resultado esperado..." aria-invalid={Boolean(error("description"))} />
    </Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Etapa" name={`${prefix}-status`} error={error("status")}>
        <select id={`${prefix}-status`} name="status" defaultValue={task?.status ?? "TODO"} className={selectClassName}>{taskStatuses.map((status) => <option key={status.value} value={status.value}>{status.shortLabel}</option>)}</select>
      </Field>
      <Field label="Prioridade" name={`${prefix}-priority`} error={error("priority")}>
        <select id={`${prefix}-priority`} name="priority" defaultValue={task?.priority ?? "MEDIUM"} className={selectClassName}>{(Object.entries(taskPriorityLabels) as Array<[Enums<"task_priority">, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </Field>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Serviço" name={`${prefix}-service`} error={error("serviceId")}>
        <select id={`${prefix}-service`} name="serviceId" defaultValue={task?.serviceId ?? ""} className={selectClassName}><option value="">Não definido</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select>
      </Field>
      <Field label="Prazo" name={`${prefix}-due`} error={error("dueDate")}>
        <Input id={`${prefix}-due`} name="dueDate" type="date" defaultValue={task?.dueDate ?? ""} aria-invalid={Boolean(error("dueDate"))} />
      </Field>
    </div>
    <Field label="Responsáveis" name={`${prefix}-assignees`} error={error("assigneeIds")}>
      <select id={`${prefix}-assignees`} name="assigneeIds" multiple defaultValue={task?.assigneeIds ?? []} className={cn(selectClassName, "h-28 py-2")}>
        {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
      </select>
      <p className="text-xs text-muted-foreground">Use Ctrl (Windows) ou Command (Mac) para selecionar mais de uma pessoa.</p>
    </Field>
  </>;
}

export function CreateTaskForm({ clients, services, profiles, fixedClientId }: { clients: Option[]; services: Option[]; profiles: Option[]; fixedClientId?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatchAction, pending] = useActionState(createTaskAction, initialTaskActionState);
  useEffect(() => { if (state.status === "success") { formRef.current?.reset(); router.refresh(); } }, [router, state]);
  const error = (field: string) => state.fieldErrors?.[field]?.[0];
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => dispatchAction(data)); }
  return <form ref={formRef} onSubmit={submit} className="space-y-4" noValidate>
    <TaskFields prefix="new-task" clients={clients} services={services} profiles={profiles} fixedClientId={fixedClientId} error={error} />
    <Message status={state.status} message={state.message} />
    <Button type="submit" className="w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}Criar tarefa</Button>
  </form>;
}

export function EditTaskForm({ task, clients, services, profiles }: { task: EditableTask; clients: Option[]; services: Option[]; profiles: Option[] }) {
  const router = useRouter();
  const [state, dispatchAction, pending] = useActionState(updateTaskAction, initialTaskActionState);
  useEffect(() => { if (state.status === "success") router.refresh(); }, [router, state]);
  const error = (field: string) => state.fieldErrors?.[field]?.[0];
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => dispatchAction(data)); }
  return <form onSubmit={submit} className="space-y-4" noValidate>
    <TaskFields prefix={`edit-task-${task.id}`} task={task} clients={clients} services={services} profiles={profiles} error={error} />
    <Message status={state.status} message={state.message} />
    <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}Salvar alterações</Button>
  </form>;
}

