import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Flag,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
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
import {
  CreateGoalForm,
  EditGoalForm,
  GoalUpdateForm,
} from "@/features/goals/components/goal-forms";
import {
  calculateGoalProgress,
  formatMetricValue,
} from "@/features/metrics/format";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

const statusLabels: Record<Enums<"goal_status">, string> = {
  NOT_STARTED: "Não iniciado",
  IN_PROGRESS: "Em andamento",
  ACHIEVED: "Atingido",
  PAUSED: "Pausado",
  CANCELLED: "Cancelado",
};

const statusStyles: Record<Enums<"goal_status">, string> = {
  NOT_STARTED: "border-border-strong/70 bg-background-elevated/55 text-text-secondary",
  IN_PROGRESS: "border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light",
  ACHIEVED: "border-status-healthy/25 bg-status-healthy/10 text-status-healthy",
  PAUSED: "border-status-attention/25 bg-status-attention/10 text-status-attention",
  CANCELLED: "border-status-critical/25 bg-status-critical/10 text-status-critical",
};

function getToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

function isGoalOverdue(
  deadline: string | null,
  status: Enums<"goal_status">,
  today: string,
) {
  return Boolean(
    deadline &&
      deadline < today &&
      (status === "NOT_STARTED" || status === "IN_PROGRESS"),
  );
}

export default async function ClientGoalsPage({
  params,
}: PageProps<"/clients/[id]/goals">) {
  const { id } = await params;
  const currentProfile = await requireCurrentProfile();
  const supabase = await createClient();
  const today = getToday();

  const [clientResult, goalsResult, metricsResult, profilesResult] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name")
        .eq("id", id)
        .is("archived_at", null)
        .maybeSingle(),
      supabase
        .from("goals")
        .select(
          "*, metrics(id, name, metric_units(key, name, symbol, format)), profiles!goals_responsible_user_id_fkey(id, full_name)",
        )
        .eq("client_id", id)
        .order("status")
        .order("deadline", { ascending: true, nullsFirst: false }),
      supabase
        .from("metrics")
        .select("id, name")
        .eq("client_id", id)
        .is("archived_at", null)
        .order("name"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("active", true)
        .order("full_name"),
    ]);

  const client = clientResult.data;
  if (!client) notFound();

  const goals = goalsResult.data ?? [];
  const metricIds = goals
    .map((goal) => goal.metric_id)
    .filter((metricId): metricId is string => Boolean(metricId));
  const latestResult = metricIds.length
    ? await supabase
        .from("latest_metric_entries")
        .select("metric_id, value, observed_at")
        .in("metric_id", metricIds)
    : { data: [] };
  const latestByMetric = new Map(
    (latestResult.data ?? []).map((entry) => [entry.metric_id, entry]),
  );

  const achievedCount = goals.filter((goal) => goal.status === "ACHIEVED").length;
  const overdueCount = goals.filter((goal) =>
    isGoalOverdue(goal.deadline, goal.status, today),
  ).length;

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
            Objetivos
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-[2.1rem]">
            {client.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Metas, responsáveis, prazos e progresso em um só lugar.
          </p>
        </div>
        {goals.length ? (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">{goals.length} objetivo(s)</Badge>
            <Badge className="border-status-healthy/25 bg-status-healthy/10 text-status-healthy">
              {achievedCount} atingido(s)
            </Badge>
            {overdueCount ? (
              <Badge variant="destructive">{overdueCount} atrasado(s)</Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      <ClientTabs clientId={id} active="goals" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div className="space-y-5">
          {goals.length ? (
            goals.map((goal) => {
              const latest = goal.metric_id
                ? latestByMetric.get(goal.metric_id)
                : undefined;
              const currentValue = goal.metric_id
                ? (latest?.value ?? null)
                : goal.manual_current_value;
              const unit = goal.metrics?.metric_units ?? null;
              const progress = calculateGoalProgress({
                initial: goal.initial_value,
                target: goal.target_value,
                current: currentValue,
                direction: goal.direction,
              });
              const overdue = isGoalOverdue(goal.deadline, goal.status, today);

              return (
                <Card
                  key={goal.id}
                  className={cn(
                    "gap-0 overflow-hidden py-0",
                    overdue && "border-status-critical/35",
                  )}
                >
                  <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle>{goal.title}</CardTitle>
                          <Badge className={statusStyles[goal.status]}>
                            {statusLabels[goal.status]}
                          </Badge>
                          {overdue ? <Badge variant="destructive">Prazo vencido</Badge> : null}
                        </div>
                        <CardDescription>
                          {goal.description ?? goal.category ?? "Objetivo do cliente"}
                        </CardDescription>
                      </div>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light">
                        {goal.status === "ACHIEVED" ? (
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        ) : (
                          <Target className="size-4" aria-hidden="true" />
                        )}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-border bg-background-elevated/45 p-4">
                        <p className="text-xs text-muted-foreground">Valor inicial</p>
                        <p className="mt-2 text-xl font-semibold text-text-primary">
                          {formatMetricValue(goal.initial_value, unit)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-compass-purple-light/20 bg-compass-purple-soft p-4">
                        <p className="text-xs text-muted-foreground">Valor atual</p>
                        <p className="mt-2 text-xl font-semibold text-text-primary">
                          {formatMetricValue(currentValue, unit)}
                        </p>
                        {latest?.observed_at ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Medido em {formatDate(latest.observed_at)}
                          </p>
                        ) : null}
                      </div>
                      <div className="rounded-xl border border-border bg-background-elevated/45 p-4">
                        <p className="text-xs text-muted-foreground">Meta</p>
                        <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-text-primary">
                          {goal.direction === "DECREASE" ? (
                            <TrendingDown className="size-5 text-compass-purple-light" aria-hidden="true" />
                          ) : (
                            <TrendingUp className="size-5 text-compass-purple-light" aria-hidden="true" />
                          )}
                          {formatMetricValue(goal.target_value, unit)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-text-secondary">Progresso</span>
                        <span className="font-semibold text-text-primary">
                          {progress == null ? "Sem dados suficientes" : `${Math.round(progress)}%`}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-background-elevated">
                        <div
                          className={cn(
                            "h-full rounded-full transition-[width]",
                            goal.status === "ACHIEVED"
                              ? "bg-status-healthy"
                              : overdue
                                ? "bg-status-critical"
                                : "bg-compass-purple-light",
                          )}
                          style={{ width: `${progress ?? 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <CalendarClock className="size-3.5" aria-hidden="true" />
                        {goal.deadline
                          ? `Prazo: ${formatDate(goal.deadline)}`
                          : "Sem prazo definido"}
                      </span>
                      <span className="flex items-center gap-2">
                        <UserRound className="size-3.5" aria-hidden="true" />
                        {goal.profiles?.full_name ?? "Sem responsável"}
                      </span>
                      <span className="flex items-center gap-2">
                        <Flag className="size-3.5" aria-hidden="true" />
                        {goal.metrics?.name ?? "Acompanhamento manual"}
                      </span>
                    </div>

                    {currentProfile.role === "ADMIN" ? (
                      <>
                        <GoalUpdateForm
                          clientId={id}
                          goalId={goal.id}
                          linkedMetric={Boolean(goal.metric_id)}
                          currentValue={currentValue}
                          status={goal.status}
                        />
                        <details className="group mt-4 border-t border-border pt-4">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Editar ou excluir objetivo</summary>
                          <div className="mt-4 rounded-xl border border-border bg-background-elevated/35 p-4">
                            <EditGoalForm
                              clientId={id}
                              goal={{
                                id: goal.id,
                                title: goal.title,
                                description: goal.description,
                                category: goal.category,
                                metricId: goal.metric_id,
                                initialValue: goal.initial_value,
                                targetValue: goal.target_value,
                                manualCurrentValue: goal.manual_current_value,
                                direction: goal.direction,
                                startDate: goal.start_date,
                                deadline: goal.deadline,
                                responsibleUserId: goal.responsible_user_id,
                                status: goal.status,
                              }}
                              metrics={[
                                ...(metricsResult.data ?? []),
                                ...(goal.metrics && !(metricsResult.data ?? []).some((metric) => metric.id === goal.metrics?.id)
                                  ? [{ id: goal.metrics.id, name: `${goal.metrics.name} (arquivada)` }]
                                  : []),
                              ]}
                              profiles={(profilesResult.data ?? []).map((profile) => ({ id: profile.id, name: profile.full_name }))}
                            />
                          </div>
                        </details>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon={Target}
              title="Nenhum objetivo cadastrado"
              description="Defina as metas do cliente e acompanhe o progresso a partir das métricas registradas."
            />
          )}
        </div>

        {currentProfile.role === "ADMIN" ? (
          <Card className="h-fit gap-0 py-0 xl:sticky xl:top-24">
            <CardHeader className="border-b border-border px-5 py-5">
              <CardTitle>Novo objetivo</CardTitle>
              <CardDescription>
                Relacione uma métrica ou acompanhe o valor manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <CreateGoalForm
                clientId={id}
                defaultDate={today}
                metrics={metricsResult.data ?? []}
                profiles={(profilesResult.data ?? []).map((profile) => ({
                  id: profile.id,
                  name: profile.full_name,
                }))}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
