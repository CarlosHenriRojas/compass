import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Compass,
  Flag,
  UserRound,
} from "lucide-react";

import { ClientHealthBadge } from "@/components/shared/client-health-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Enums } from "@/types/database";

type WeeklyUpdateCardProps = {
  update: {
    id: string;
    clientId: string;
    clientName?: string;
    authorName: string;
    weekStart: string;
    weekEnd: string;
    summary: string;
    actionsCompleted: string | null;
    resultsSummary: string | null;
    blockers: string | null;
    nextSteps: string | null;
    priorityNextAction: string | null;
    healthStatus: Enums<"health_status"> | null;
    notes: string | null;
    createdAt: string;
    results: Array<{
      id: string;
      label: string;
      value: string;
      description: string | null;
    }>;
  };
  showClient?: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function healthVisualStatus(status: Enums<"health_status">) {
  if (status === "ATTENTION") return "attention" as const;
  if (status === "CRITICAL") return "critical" as const;
  return "healthy" as const;
}

export function WeeklyUpdateCard({
  update,
  showClient = false,
}: WeeklyUpdateCardProps) {
  const hasDetails = Boolean(
    update.actionsCompleted ||
      update.resultsSummary ||
      update.blockers ||
      update.nextSteps ||
      update.notes,
  );

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {showClient && update.clientName ? (
                  <Link
                    href={`/clients/${update.clientId}/updates`}
                    className="font-semibold text-text-primary transition-colors hover:text-compass-purple-light"
                  >
                    {update.clientName}
                  </Link>
                ) : (
                  <p className="font-semibold text-text-primary">Atualização semanal</p>
                )}
                {update.healthStatus ? (
                  <ClientHealthBadge status={healthVisualStatus(update.healthStatus)} />
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  {formatDate(update.weekStart)} a {formatDate(update.weekEnd)}
                </span>
                <span className="flex items-center gap-1.5">
                  <UserRound className="size-3.5" aria-hidden="true" />
                  {update.authorName}
                </span>
                <span>Registrada em {formatDateTime(update.createdAt)}</span>
              </div>
            </div>
            {showClient ? (
              <Link
                href={`/clients/${update.clientId}/updates`}
                className="flex items-center gap-1 text-xs font-semibold text-compass-purple-light transition-colors hover:text-foreground"
              >
                Abrir cliente
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
            {update.summary}
          </p>

          {update.results.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {update.results.map((result) => (
                <div
                  key={result.id}
                  className="rounded-xl border border-compass-purple-light/20 bg-compass-purple-soft p-4"
                >
                  <p className="text-xs text-muted-foreground">{result.label}</p>
                  <p className="mt-1 text-lg font-semibold text-text-primary">
                    {result.value}
                  </p>
                  {result.description ? (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {result.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {update.priorityNextAction ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-background-elevated/45 p-4">
              <Flag className="mt-0.5 size-4 shrink-0 text-compass-purple-light" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-text-muted">
                  Próximo foco
                </p>
                <p className="mt-1.5 text-sm text-text-primary">
                  {update.priorityNextAction}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {hasDetails ? (
          <details className="group border-t border-border">
            <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-semibold text-compass-purple-light transition-colors hover:bg-card-hover hover:text-foreground sm:px-6">
              Ver detalhes da atualização
            </summary>
            <div className="grid gap-5 border-t border-border bg-background-elevated/25 p-5 sm:grid-cols-2 sm:p-6">
              {update.actionsCompleted ? (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-text-muted">
                    <CheckCircle2 className="size-3.5 text-status-healthy" aria-hidden="true" />
                    O que foi feito
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                    {update.actionsCompleted}
                  </p>
                </section>
              ) : null}
              {update.resultsSummary ? (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-text-muted">
                    <Compass className="size-3.5 text-compass-purple-light" aria-hidden="true" />
                    Resultados relevantes
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                    {update.resultsSummary}
                  </p>
                </section>
              ) : null}
              {update.blockers ? (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-text-muted">
                    <AlertTriangle className="size-3.5 text-status-attention" aria-hidden="true" />
                    Problemas ou bloqueios
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                    {update.blockers}
                  </p>
                </section>
              ) : null}
              {update.nextSteps ? (
                <section>
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-text-muted">
                    <Flag className="size-3.5 text-compass-purple-light" aria-hidden="true" />
                    Próximos passos
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                    {update.nextSteps}
                  </p>
                </section>
              ) : null}
              {update.notes ? (
                <section className="sm:col-span-2">
                  <Badge variant="outline">Observação interna</Badge>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                    {update.notes}
                  </p>
                </section>
              ) : null}
            </div>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
