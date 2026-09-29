import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, CalendarDays, Target, TrendingDown, TrendingUp } from "lucide-react";

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
  AddMetricEntryForm,
  CreateMetricForm,
  EditMetricForm,
} from "@/features/metrics/components/metric-forms";
import { MetricTrendChart } from "@/features/metrics/components/metric-trend-chart";
import { formatMetricValue } from "@/features/metrics/format";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

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

export default async function ClientMetricsPage({
  params,
}: PageProps<"/clients/[id]/metrics">) {
  const { id } = await params;
  const currentProfile = await requireCurrentProfile();
  const supabase = await createClient();

  const [clientResult, metricsResult, unitsResult, membershipResult, goalsResult] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name")
        .eq("id", id)
        .is("archived_at", null)
        .maybeSingle(),
      supabase
        .from("metrics")
        .select("*, metric_units(id, key, name, symbol, format)")
        .eq("client_id", id)
        .is("archived_at", null)
        .order("featured", { ascending: false })
        .order("name"),
      supabase
        .from("metric_units")
        .select("id, name, symbol")
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("client_members")
        .select("id")
        .eq("client_id", id)
        .eq("user_id", currentProfile.id)
        .maybeSingle(),
      supabase
        .from("goals")
        .select("id, metric_id, title, target_value, status, deadline, created_at")
        .eq("client_id", id)
        .not("metric_id", "is", null)
        .in("status", ["NOT_STARTED", "IN_PROGRESS", "ACHIEVED"])
        .order("created_at", { ascending: false }),
    ]);

  const client = clientResult.data;
  if (!client) notFound();

  const metrics = metricsResult.data ?? [];
  const metricIds = metrics.map((metric) => metric.id);
  const [latestResult, entriesResult] = metricIds.length
    ? await Promise.all([
        supabase
          .from("latest_metric_entries")
          .select("metric_id, value, observed_at")
          .in("metric_id", metricIds),
        supabase
          .from("metric_entries")
          .select("id, metric_id, value, observed_at, source, notes")
          .in("metric_id", metricIds)
          .order("observed_at", { ascending: false })
          .limit(500),
      ])
    : [{ data: [] }, { data: [] }];

  const latestByMetric = new Map(
    (latestResult.data ?? []).map((entry) => [entry.metric_id, entry]),
  );
  const entriesByMetric = new Map<
    string,
    Array<
      Pick<
        Tables<"metric_entries">,
        "id" | "metric_id" | "value" | "observed_at" | "source" | "notes"
      >
    >
  >();
  const chartEntriesByMetric = new Map<string, Array<{ value: number; observed_at: string }>>();
  for (const entry of entriesResult.data ?? []) {
    const current = entriesByMetric.get(entry.metric_id) ?? [];
    if (current.length < 4) current.push(entry);
    entriesByMetric.set(entry.metric_id, current);

    const chartEntries = chartEntriesByMetric.get(entry.metric_id) ?? [];
    chartEntries.push({ value: entry.value, observed_at: entry.observed_at });
    chartEntriesByMetric.set(entry.metric_id, chartEntries);
  }

  const goalsByMetric = new Map<string, NonNullable<typeof goalsResult.data>[number]>();
  for (const goal of goalsResult.data ?? []) {
    if (!goal.metric_id) continue;
    const current = goalsByMetric.get(goal.metric_id);
    const currentIsActive = current?.status === "NOT_STARTED" || current?.status === "IN_PROGRESS";
    const goalIsActive = goal.status === "NOT_STARTED" || goal.status === "IN_PROGRESS";
    if (!current || (goalIsActive && !currentIsActive)) goalsByMetric.set(goal.metric_id, goal);
  }

  const canUpdate =
    currentProfile.role === "ADMIN" || Boolean(membershipResult.data);

  return (
    <div className="space-y-6 lg:space-y-7">
      <Link href={`/clients/${id}/overview`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}>
        <ArrowLeft aria-hidden="true" /> Voltar para visão geral
      </Link>
      <div>
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-compass-purple-light">Métricas e ponto de partida</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-[2.1rem]">{client.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Compare a situação inicial com as medições atuais do cliente.</p>
      </div>
      <ClientTabs clientId={id} active="metrics" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div className="space-y-5">
          {metrics.length ? metrics.map((metric) => {
            const latest = latestByMetric.get(metric.id);
            const entries = entriesByMetric.get(metric.id) ?? [];
            const goal = goalsByMetric.get(metric.id);
            const unit = metric.metric_units;
            const delta = metric.baseline_value != null && latest?.value != null
              ? latest.value - metric.baseline_value
              : null;
            const percentageChange = delta != null && metric.baseline_value != null && metric.baseline_value !== 0
              ? (delta / Math.abs(metric.baseline_value)) * 100
              : null;
            const improvement = delta == null || metric.default_direction === "NEUTRAL"
              ? null
              : metric.default_direction === "INCREASE"
                ? delta >= 0
                : delta <= 0;
            const chartPoints = [
              ...(metric.baseline_value != null && metric.baseline_date
                ? [{ value: metric.baseline_value, observedAt: metric.baseline_date }]
                : []),
              ...(chartEntriesByMetric.get(metric.id) ?? [])
                .filter((entry) => entry.observed_at !== metric.baseline_date)
                .sort((a, b) => a.observed_at.localeCompare(b.observed_at))
                .map((entry) => ({ value: entry.value, observedAt: entry.observed_at })),
            ];
            return (
              <Card key={metric.id} className="gap-0 py-0">
                <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{metric.name}</CardTitle>
                        {metric.featured ? <Badge variant="outline">Destaque</Badge> : null}
                      </div>
                      <CardDescription>{metric.category ?? unit?.name ?? "Indicador"}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      {metric.default_direction === "INCREASE" ? "Aumentar" : metric.default_direction === "DECREASE" ? "Diminuir" : "Acompanhar"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-border bg-background-elevated/45 p-4">
                      <p className="text-xs text-muted-foreground">Ponto de partida</p>
                      <p className="mt-2 text-xl font-semibold text-text-primary">{formatMetricValue(metric.baseline_value, unit)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{metric.baseline_date ? formatDate(metric.baseline_date) : "Sem data"}</p>
                    </div>
                    <div className="rounded-xl border border-compass-purple-light/20 bg-compass-purple-soft p-4">
                      <p className="text-xs text-muted-foreground">Valor atual</p>
                      <p className="mt-2 text-xl font-semibold text-text-primary">{formatMetricValue(latest?.value, unit)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{latest?.observed_at ? formatDate(latest.observed_at) : "Sem medição"}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background-elevated/45 p-4">
                      <p className="text-xs text-muted-foreground">Variação</p>
                      <p className={cn(
                        "mt-2 flex items-center gap-2 text-xl font-semibold",
                        delta == null
                          ? "text-text-muted"
                          : improvement === true
                            ? "text-status-healthy"
                            : improvement === false
                              ? "text-status-critical"
                              : "text-text-secondary",
                      )}>
                        {delta == null ? "—" : delta >= 0 ? <TrendingUp className="size-5" aria-hidden="true" /> : <TrendingDown className="size-5" aria-hidden="true" />}
                        {delta == null ? "Sem dados" : formatMetricValue(Math.abs(delta), unit)}
                      </p>
                      {percentageChange != null ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {percentageChange >= 0 ? "+" : "−"}{Math.abs(percentageChange).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% desde o início
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-xl border border-border bg-background-elevated/45 p-4">
                      <p className="text-xs text-muted-foreground">Objetivo relacionado</p>
                      <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-text-primary">
                        <Target className="size-5 text-compass-purple-light" aria-hidden="true" />
                        {goal?.target_value != null ? formatMetricValue(goal.target_value, unit) : "Sem meta"}
                      </p>
                      {goal ? <p className="mt-1 truncate text-xs text-muted-foreground">{goal.title}</p> : null}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Evolução histórica</p>
                      {improvement != null ? (
                        <Badge className={improvement
                          ? "border-status-healthy/25 bg-status-healthy/10 text-status-healthy"
                          : "border-status-critical/25 bg-status-critical/10 text-status-critical"}
                        >
                          {improvement ? "Evolução positiva" : "Evolução abaixo do esperado"}
                        </Badge>
                      ) : null}
                    </div>
                    <MetricTrendChart
                      name={metric.name}
                      points={chartPoints}
                      target={goal?.target_value ?? null}
                      unit={unit}
                    />
                  </div>

                  {entries.length ? (
                    <div className="mt-5 border-t border-border pt-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Histórico recente</p>
                      <div className="space-y-2">
                        {entries.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-3.5" aria-hidden="true" />{formatDate(entry.observed_at)}{entry.source ? ` · ${entry.source}` : ""}</span>
                            <span className="font-semibold text-text-primary">{formatMetricValue(entry.value, unit)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {canUpdate ? <div className="mt-5"><AddMetricEntryForm clientId={id} metricId={metric.id} defaultDate={getToday()} /></div> : null}
                  {currentProfile.role === "ADMIN" ? (
                    <details className="group mt-4 border-t border-border pt-4">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Editar ou arquivar métrica</summary>
                      <div className="mt-4 rounded-xl border border-border bg-background-elevated/35 p-4">
                        <EditMetricForm
                          clientId={id}
                          metric={{
                            id: metric.id,
                            name: metric.name,
                            category: metric.category,
                            unitId: metric.unit_id,
                            direction: metric.default_direction,
                            baselineValue: metric.baseline_value,
                            baselineDate: metric.baseline_date,
                            featured: metric.featured,
                          }}
                          units={unitsResult.data ?? []}
                        />
                      </div>
                    </details>
                  ) : null}
                </CardContent>
              </Card>
            );
          }) : (
            <EmptyState icon={BarChart3} title="Nenhuma métrica cadastrada" description="Crie os indicadores que representam o ponto de partida e a evolução deste cliente." />
          )}
        </div>

        {currentProfile.role === "ADMIN" ? (
          <Card className="h-fit gap-0 py-0 xl:sticky xl:top-24">
            <CardHeader className="border-b border-border px-5 py-5">
              <CardTitle>Nova métrica</CardTitle>
              <CardDescription>Defina o indicador e, se disponível, seu ponto de partida.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <CreateMetricForm clientId={id} units={unitsResult.data ?? []} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
