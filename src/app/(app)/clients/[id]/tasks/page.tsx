import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ClientTabs } from "@/features/clients/components/client-tabs";
import { CreateTaskForm } from "@/features/tasks/components/task-form";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { getTaskBoardData, getTaskFormOptions } from "@/features/tasks/data";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function ClientTasksPage({ params }: PageProps<"/clients/[id]/tasks">) {
  const { id } = await params;
  await requireCurrentProfile();
  const supabase = await createClient();
  const [{ data: client }, tasks, options] = await Promise.all([
    supabase.from("clients").select("id, name").eq("id", id).is("archived_at", null).maybeSingle(),
    getTaskBoardData(id),
    getTaskFormOptions(),
  ]);
  if (!client) notFound();
  return <div className="space-y-6 lg:space-y-7">
    <Link href={`/clients/${id}/overview`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}><ArrowLeft aria-hidden="true" />Voltar para visão geral</Link>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-compass-purple-light">Tarefas</p><h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-[2.1rem]">{client.name}</h1><p className="mt-2 text-sm text-muted-foreground">Execução operacional vinculada a este cliente.</p></div><Badge variant="outline">{tasks.length} tarefa(s)</Badge></div>
    <ClientTabs clientId={id} active="tasks" />
    <TaskBoard tasks={tasks} />
    <details className="group rounded-xl border border-border bg-card"><summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4"><span className="flex size-9 items-center justify-center rounded-xl border border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light"><ClipboardList className="size-4" aria-hidden="true" /></span><div><p className="text-sm font-semibold text-text-primary">Nova tarefa para {client.name}</p><p className="text-xs text-muted-foreground">A tarefa também aparecerá automaticamente no Kanban geral.</p></div></summary><div className="border-t border-border p-5"><CreateTaskForm fixedClientId={id} clients={options.clients} services={options.services} profiles={options.profiles} /></div></details>
  </div>;
}

