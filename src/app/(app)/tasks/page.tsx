import Link from "next/link";
import { ClipboardList, Search, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreateTaskForm } from "@/features/tasks/components/task-form";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { getTaskBoardData, getTaskFormOptions } from "@/features/tasks/data";
import { taskPriorityLabels } from "@/features/tasks/constants";
import { requireCurrentProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

const selectClassName = "h-10 rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70";

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const profile = await requireCurrentProfile();
  const params = await searchParams;
  const [tasks, options] = await Promise.all([getTaskBoardData(), getTaskFormOptions()]);
  const search = typeof params.q === "string" ? params.q.trim().toLocaleLowerCase("pt-BR") : "";
  const clientId = typeof params.client === "string" ? params.client : "";
  const assigneeId = typeof params.assignee === "string" ? params.assignee : "";
  const priority = typeof params.priority === "string" ? params.priority : "";
  const mine = params.mine === "1";
  const filtered = tasks.filter((task) => {
    if (search && !`${task.title} ${task.description ?? ""} ${task.client?.name ?? ""}`.toLocaleLowerCase("pt-BR").includes(search)) return false;
    if (clientId && task.client?.id !== clientId) return false;
    if (assigneeId && !task.assignees.some((assignee) => assignee.id === assigneeId)) return false;
    if (mine && !task.assignees.some((assignee) => assignee.id === profile.id)) return false;
    if (priority && task.priority !== priority) return false;
    return true;
  });
  const overdue = filtered.filter((task) => task.dueDate && task.dueDate < new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()) && task.status !== "DONE").length;

  return <div className="space-y-6 lg:space-y-7">
    <PageHeader eyebrow="Operação" title="Tarefas" description="Acompanhe o trabalho da agência e de cada cliente em um único Kanban." action={<div className="flex gap-2"><Badge variant="outline">{filtered.length} tarefa(s)</Badge>{overdue ? <Badge variant="destructive">{overdue} atrasada(s)</Badge> : null}</div>} />

    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border px-5 py-4"><div className="flex items-center gap-2"><SlidersHorizontal className="size-4 text-compass-purple-light" aria-hidden="true" /><CardTitle>Filtros</CardTitle></div></CardHeader>
      <CardContent className="p-4">
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(150px,0.55fr))_auto_auto]">
          <label className="relative"><span className="sr-only">Buscar tarefa</span><Search className="pointer-events-none absolute left-3 top-3 size-4 text-text-muted" aria-hidden="true" /><Input name="q" defaultValue={typeof params.q === "string" ? params.q : ""} placeholder="Buscar tarefa..." className="pl-9" /></label>
          <select name="client" defaultValue={clientId} className={selectClassName}><option value="">Todos os clientes</option>{options.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
          <select name="assignee" defaultValue={assigneeId} className={selectClassName}><option value="">Todos os responsáveis</option>{options.profiles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select name="priority" defaultValue={priority} className={selectClassName}><option value="">Todas as prioridades</option>{(Object.entries(taskPriorityLabels) as Array<[Enums<"task_priority">, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <label className="flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm text-text-secondary"><input type="checkbox" name="mine" value="1" defaultChecked={mine} />Minhas</label>
          <button className={cn(buttonVariants(), "h-10")}>Filtrar</button>
        </form>
        {(search || clientId || assigneeId || priority || mine) ? <Link href="/tasks" className="mt-3 inline-block text-xs text-compass-purple-light hover:underline">Limpar filtros</Link> : null}
      </CardContent>
    </Card>

    <TaskBoard tasks={filtered} />

    <details className="group rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4"><span className="flex size-9 items-center justify-center rounded-xl border border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light"><ClipboardList className="size-4" aria-hidden="true" /></span><div><p className="text-sm font-semibold text-text-primary">Criar nova tarefa</p><p className="text-xs text-muted-foreground">Tarefa de cliente ou atividade interna da Compass.</p></div></summary>
      <div className="border-t border-border p-5"><CreateTaskForm clients={options.clients} services={options.services} profiles={options.profiles} /></div>
    </details>
  </div>;
}

