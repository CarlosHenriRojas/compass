import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History, RefreshCw } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { EntityDeleteButton } from "@/components/shared/entity-delete-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClientTabs } from "@/features/clients/components/client-tabs";
import { WeeklyUpdateCard } from "@/features/updates/components/weekly-update-card";
import { WeeklyUpdateForm } from "@/features/updates/components/weekly-update-form";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function getCurrentWeek() {
  const todayString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const today = new Date(`${todayString}T12:00:00Z`);
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - mondayOffset);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default async function ClientUpdatesPage({
  params,
}: PageProps<"/clients/[id]/updates">) {
  const { id } = await params;
  const currentProfile = await requireCurrentProfile();
  const supabase = await createClient();

  const [clientResult, updatesResult, membershipResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, health_status")
      .eq("id", id)
      .is("archived_at", null)
      .maybeSingle(),
    supabase
      .from("weekly_updates")
      .select(
        "*, profiles!weekly_updates_user_id_fkey(full_name), weekly_update_results(id, label, value, description, sort_order)",
      )
      .eq("client_id", id)
      .order("week_end", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("client_members")
      .select("id")
      .eq("client_id", id)
      .eq("user_id", currentProfile.id)
      .maybeSingle(),
  ]);

  const client = clientResult.data;
  if (!client) notFound();

  const updates = updatesResult.data ?? [];
  const canCreate =
    currentProfile.role === "ADMIN" || Boolean(membershipResult.data);
  const currentWeek = getCurrentWeek();

  return (
    <div className="space-y-6 lg:space-y-7">
      <Link
        href={`/clients/${id}/overview`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft aria-hidden="true" />
        Voltar para visão geral
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-compass-purple-light">
            Acompanhamento
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-[2.1rem]">
            {client.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Histórico semanal de contexto, resultados e evolução do cliente.
          </p>
        </div>
        {updates.length ? (
          <Badge variant="outline">{updates.length} atualização(ões)</Badge>
        ) : null}
      </div>

      <ClientTabs clientId={id} active="updates" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]">
        <div className="space-y-5">
          {updates.length ? (
            <div className="relative space-y-5 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-px before:bg-border sm:before:left-6">
              {updates.map((update) => (
                <div key={update.id} className="relative pl-10 sm:pl-12">
                  <span className="absolute left-[0.87rem] top-6 z-10 size-3 rounded-full border-2 border-background bg-compass-purple-light shadow-[0_0_0_3px_var(--border)] sm:left-[1.13rem]" />
                  <WeeklyUpdateCard
                    update={{
                      id: update.id,
                      clientId: update.client_id,
                      authorName: update.profiles?.full_name ?? "Usuário",
                      weekStart: update.week_start,
                      weekEnd: update.week_end,
                      summary: update.summary,
                      actionsCompleted: update.actions_completed,
                      resultsSummary: update.results_summary,
                      blockers: update.blockers,
                      nextSteps: update.next_steps,
                      priorityNextAction: update.priority_next_action,
                      healthStatus: update.health_status,
                      notes: update.notes,
                      createdAt: update.created_at,
                      results: [...update.weekly_update_results]
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((result) => ({
                          id: result.id,
                          label: result.label,
                          value: result.value,
                          description: result.description,
                        })),
                    }}
                  />
                  {canCreate ? (
                    <details className="group mt-3 rounded-xl border border-border bg-card px-4 py-3">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Editar atualização{currentProfile.role === "ADMIN" ? " ou excluir" : ""}</summary>
                      <div className="mt-4 border-t border-border pt-4">
                        <WeeklyUpdateForm
                          key={update.updated_at}
                          clientId={id}
                          defaultWeekStart={update.week_start}
                          defaultWeekEnd={update.week_end}
                          currentHealth={client.health_status}
                          initialValues={{
                            id: update.id,
                            weekStart: update.week_start,
                            weekEnd: update.week_end,
                            summary: update.summary,
                            actionsCompleted: update.actions_completed,
                            resultsSummary: update.results_summary,
                            blockers: update.blockers,
                            nextSteps: update.next_steps,
                            priorityNextAction: update.priority_next_action,
                            healthStatus: update.health_status,
                            notes: update.notes,
                            results: [...update.weekly_update_results]
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map((result) => ({ id: result.id, label: result.label, value: result.value, description: result.description })),
                          }}
                        />
                        {currentProfile.role === "ADMIN" ? (
                          <div className="mt-5 border-t border-border pt-4">
                            <EntityDeleteButton kind="update" clientId={id} entityId={update.id} label="esta atualização" />
                          </div>
                        ) : null}
                      </div>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="Nenhuma atualização registrada"
              description="Registre o primeiro acompanhamento para iniciar a linha do tempo deste cliente."
            />
          )}
        </div>

        <Card className="h-fit gap-0 py-0 xl:sticky xl:top-24">
          <CardHeader className="border-b border-border px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl border border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light">
                <RefreshCw className="size-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Atualização da semana</CardTitle>
                <CardDescription>Um registro rápido, sem gestão de tarefas.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {canCreate ? (
              <WeeklyUpdateForm
                clientId={id}
                defaultWeekStart={currentWeek.start}
                defaultWeekEnd={currentWeek.end}
                currentHealth={client.health_status}
              />
            ) : (
              <div className="rounded-xl border border-border bg-background-elevated/45 p-4 text-sm leading-6 text-muted-foreground">
                Você pode consultar o histórico, mas apenas a equipe vinculada a este cliente pode registrar atualizações.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
