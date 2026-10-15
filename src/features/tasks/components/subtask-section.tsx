"use client";

import Link from "next/link";
import { startTransition, type FormEvent, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { CalendarClock, CheckCircle2, CircleAlert, CircleCheck, ListChecks, LoaderCircle, Plus, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSubtaskAction, updateTaskStatusAction } from "@/features/tasks/actions";
import { taskPriorityLabels, taskStatuses, taskStatusLabels } from "@/features/tasks/constants";
import { initialTaskActionState } from "@/features/tasks/task-state";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

export type SubtaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: Enums<"task_status">;
  priority: Enums<"task_priority">;
  dueDate: string | null;
  assignees: Array<{ id: string; name: string }>;
};

const selectClassName = "h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20";
const priorityStyles: Record<Enums<"task_priority">, string> = {
  LOW: "border-border bg-background-elevated text-muted-foreground",
  MEDIUM: "border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light",
  HIGH: "border-status-attention/25 bg-status-attention/10 text-status-attention",
  URGENT: "border-status-critical/25 bg-status-critical/10 text-status-critical",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function SubtaskStatusSelect({ subtask }: { subtask: SubtaskItem }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startMove] = useTransition();
  function move(status: Enums<"task_status">) {
    setMessage("");
    startMove(async () => {
      const result = await updateTaskStatusAction(subtask.id, status);
      if (!result.ok) setMessage(result.message);
      router.refresh();
    });
  }
  return <div><select value={subtask.status} onChange={(event) => move(event.target.value as Enums<"task_status">)} disabled={pending} className="h-8 rounded-lg border border-border bg-background-elevated px-2 text-xs text-text-secondary outline-none focus:border-compass-purple-light">{taskStatuses.map((status) => <option key={status.value} value={status.value}>{status.shortLabel}</option>)}</select>{message ? <p role="alert" className="mt-1 text-xs text-destructive">{message}</p> : null}</div>;
}

function CreateSubtaskForm({ parentTaskId, profiles }: { parentTaskId: string; profiles: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatchAction, pending] = useActionState(createSubtaskAction, initialTaskActionState);
  useEffect(() => { if (state.status === "success") { formRef.current?.reset(); router.refresh(); } }, [router, state]);
  const error = (field: string) => state.fieldErrors?.[field]?.[0];
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => dispatchAction(data)); }
  return <form ref={formRef} onSubmit={submit} className="space-y-4" noValidate>
    <input type="hidden" name="parentTaskId" value={parentTaskId} />
    <div className="space-y-2"><label htmlFor="subtask-title" className="text-sm font-medium text-text-primary">Título</label><Input id="subtask-title" name="title" placeholder="Ex.: Arte 01 — formato feed" required aria-invalid={Boolean(error("title"))} />{error("title") ? <p className="text-xs text-destructive">{error("title")}</p> : null}</div>
    <div className="space-y-2"><label htmlFor="subtask-description" className="text-sm font-medium text-text-primary">Descrição</label><Textarea id="subtask-description" name="description" className="min-h-24" placeholder="Orientações específicas desta entrega..." /></div>
    <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><label htmlFor="subtask-status" className="text-sm font-medium text-text-primary">Etapa</label><select id="subtask-status" name="status" defaultValue="TODO" className={selectClassName}>{taskStatuses.map((status) => <option key={status.value} value={status.value}>{status.shortLabel}</option>)}</select></div><div className="space-y-2"><label htmlFor="subtask-priority" className="text-sm font-medium text-text-primary">Prioridade</label><select id="subtask-priority" name="priority" defaultValue="MEDIUM" className={selectClassName}>{(Object.entries(taskPriorityLabels) as Array<[Enums<"task_priority">, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="space-y-2"><label htmlFor="subtask-due" className="text-sm font-medium text-text-primary">Prazo</label><Input id="subtask-due" name="dueDate" type="date" /></div></div>
    <div className="space-y-2"><label htmlFor="subtask-assignees" className="text-sm font-medium text-text-primary">Responsáveis</label><select id="subtask-assignees" name="assigneeIds" multiple className={cn(selectClassName, "h-28 py-2")}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select><p className="text-xs text-muted-foreground">Use Ctrl (Windows) ou Command (Mac) para selecionar mais de uma pessoa.</p></div>
    {state.message ? <div role={state.status === "success" ? "status" : "alert"} className={cn("flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm", state.status === "success" ? "border-status-healthy/25 bg-status-healthy/8 text-status-healthy" : "border-status-critical/25 bg-status-critical/8 text-status-critical")}>{state.status === "success" ? <CircleCheck className="mt-0.5 size-4 shrink-0" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" />}<span>{state.message}</span></div> : null}
    <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <Plus />}Criar subtarefa</Button>
  </form>;
}

export function SubtaskSection({ parentTaskId, subtasks, profiles }: { parentTaskId: string; subtasks: SubtaskItem[]; profiles: Array<{ id: string; name: string }> }) {
  const completed = subtasks.filter((subtask) => subtask.status === "DONE").length;
  const progress = subtasks.length ? Math.round((completed / subtasks.length) * 100) : 0;
  return <div className="space-y-5">
    {subtasks.length ? <><div><div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-text-secondary">Progresso das entregas</span><span className="font-semibold text-text-primary">{completed}/{subtasks.length} · {progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-background-elevated"><div className="h-full rounded-full bg-status-healthy transition-[width]" style={{ width: `${progress}%` }} /></div></div><div className="space-y-3">{subtasks.map((subtask) => <article key={subtask.id} className={cn("rounded-xl border border-border bg-background-elevated/35 p-4", subtask.status === "DONE" && "border-status-healthy/20")}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{subtask.status === "DONE" ? <CheckCircle2 className="size-4 text-status-healthy" aria-hidden="true" /> : <ListChecks className="size-4 text-compass-purple-light" aria-hidden="true" />}<Link href={`/tasks/${subtask.id}`} className="font-semibold text-text-primary hover:text-compass-purple-light">{subtask.title}</Link><Badge className={priorityStyles[subtask.priority]}>{taskPriorityLabels[subtask.priority]}</Badge></div>{subtask.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{subtask.description}</p> : null}<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><CalendarClock className="size-3.5" />{subtask.dueDate ? formatDate(subtask.dueDate) : "Sem prazo"}</span><span className="flex items-center gap-1.5"><UserRound className="size-3.5" />{subtask.assignees.length ? subtask.assignees.map((item) => item.name).join(", ") : "Sem responsável"}</span></div></div><div className="shrink-0"><SubtaskStatusSelect subtask={subtask} /><p className="mt-1 text-right text-[0.65rem] text-text-muted">{taskStatusLabels[subtask.status]}</p></div></div></article>)}</div></> : <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center"><ListChecks className="mx-auto size-5 text-text-muted" aria-hidden="true" /><p className="mt-3 text-sm font-medium text-text-secondary">Nenhuma subtarefa criada</p><p className="mt-1 text-xs text-muted-foreground">Divida esta demanda em entregas menores e independentes.</p></div>}
    <details className="rounded-xl border border-border bg-background-elevated/35"><summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-text-secondary">Adicionar subtarefa</summary><div className="border-t border-border p-4"><CreateSubtaskForm parentTaskId={parentTaskId} profiles={profiles} /></div></details>
  </div>;
}

