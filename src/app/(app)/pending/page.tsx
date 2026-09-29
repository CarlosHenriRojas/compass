import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  HeartPulse,
  Target,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPortfolioData, getPortfolioDates } from "@/features/dashboard/data";
import { requireCurrentProfile } from "@/lib/auth/session";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function AlertRow({ href, title, detail, badge }: { href: string; title: string; detail: string; badge?: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-card-hover sm:px-6">
      <div className="min-w-0"><p className="truncate text-sm font-semibold text-text-primary">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>
      <div className="flex shrink-0 items-center gap-2">{badge ? <Badge variant="outline">{badge}</Badge> : null}<ChevronRight className="size-4 text-text-muted" aria-hidden="true" /></div>
    </Link>
  );
}

export default async function PendingPage() {
  const profile = await requireCurrentProfile();
  const { clients, updates, contracts, goals } = await getPortfolioData({ profileId: profile.id, role: profile.role });
  const { today, inThirtyDays } = getPortfolioDates();
  const updateByClient = new Map(updates.map((update) => [update.client_id, update]));
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const openClients = clients.filter((client) => client.status !== "CLOSED");

  const staleUpdates = openClients
    .filter((client) => (updateByClient.get(client.id)?.days_without_update ?? 0) > 7)
    .sort((a, b) => (updateByClient.get(b.id)?.days_without_update ?? 0) - (updateByClient.get(a.id)?.days_without_update ?? 0));
  const expiringContracts = contracts
    .filter((contract) => contract.end_date && contract.end_date >= today && contract.end_date <= inThirtyDays)
    .sort((a, b) => (a.end_date ?? "").localeCompare(b.end_date ?? ""));
  const overdueGoals = goals.filter((goal) => goal.deadline && goal.deadline < today).sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));
  const healthAlerts = openClients.filter((client) => client.health_status === "ATTENTION" || client.health_status === "CRITICAL").sort((a, b) => (a.health_status === "CRITICAL" ? -1 : b.health_status === "CRITICAL" ? 1 : 0));
  const total = staleUpdates.length + expiringContracts.length + overdueGoals.length + healthAlerts.length;

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader eyebrow="Atenção" title="Pendências" description="Alertas estratégicos calculados automaticamente — sem transformar o Hub em um gerenciador de tarefas." action={<Badge variant={total ? "destructive" : "outline"}>{total} alerta(s)</Badge>} />

      {total === 0 ? (
        <EmptyState icon={CheckCircle2} title="Tudo em dia" description="Não existem atualizações atrasadas, contratos próximos do vencimento, objetivos vencidos ou clientes em atenção." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border px-5 py-5 sm:px-6"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl border border-status-attention/20 bg-status-attention/10 text-status-attention"><Clock3 className="size-4" aria-hidden="true" /></span><div><CardTitle>Atualizações pendentes</CardTitle><CardDescription>Clientes sem acompanhamento há mais de 7 dias.</CardDescription></div></div></CardHeader>
            <CardContent className="divide-y divide-border px-0">{staleUpdates.length ? staleUpdates.map((client) => { const days = updateByClient.get(client.id)?.days_without_update ?? 0; return <AlertRow key={client.id} href={`/clients/${client.id}/updates`} title={client.name} detail={days > 14 ? `Sem acompanhamento há ${days} dias — alerta crítico` : `Sem acompanhamento há ${days} dias`} badge={`${days} dias`} />; }) : <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">Nenhuma atualização pendente.</p>}</CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border px-5 py-5 sm:px-6"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl border border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light"><CalendarClock className="size-4" aria-hidden="true" /></span><div><CardTitle>Contratos vencendo</CardTitle><CardDescription>Término previsto nos próximos 30 dias.</CardDescription></div></div></CardHeader>
            <CardContent className="divide-y divide-border px-0">{expiringContracts.length ? expiringContracts.map((contract) => <AlertRow key={contract.id} href={`/clients/${contract.client_id}/contract`} title={clientById.get(contract.client_id)?.name ?? "Cliente"} detail={`Contrato com término em ${formatDate(contract.end_date!)}`} badge={contract.status === "IN_RENEWAL" ? "Em renovação" : "Ativo"} />) : <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">Nenhum contrato vencendo.</p>}</CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border px-5 py-5 sm:px-6"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl border border-status-critical/20 bg-status-critical/10 text-status-critical"><Target className="size-4" aria-hidden="true" /></span><div><CardTitle>Objetivos atrasados</CardTitle><CardDescription>Metas em aberto cujo prazo já terminou.</CardDescription></div></div></CardHeader>
            <CardContent className="divide-y divide-border px-0">{overdueGoals.length ? overdueGoals.map((goal) => <AlertRow key={goal.id} href={`/clients/${goal.client_id}/goals`} title={clientById.get(goal.client_id)?.name ?? "Cliente"} detail={goal.title} badge={formatDate(goal.deadline!)} />) : <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">Nenhum objetivo atrasado.</p>}</CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border px-5 py-5 sm:px-6"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl border border-status-critical/20 bg-status-critical/10 text-status-critical"><HeartPulse className="size-4" aria-hidden="true" /></span><div><CardTitle>Saúde da carteira</CardTitle><CardDescription>Clientes marcados manualmente como atenção ou crítico.</CardDescription></div></div></CardHeader>
            <CardContent className="divide-y divide-border px-0">{healthAlerts.length ? healthAlerts.map((client) => <AlertRow key={client.id} href={`/clients/${client.id}/overview`} title={client.name} detail={client.health_status === "CRITICAL" ? "Saúde crítica — requer análise da diretoria" : "Saúde em atenção"} badge={client.health_status === "CRITICAL" ? "Crítico" : "Atenção"} />) : <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">Nenhum cliente em atenção.</p>}</CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-border bg-background-elevated/35 p-4 text-sm leading-6 text-muted-foreground"><CircleAlert className="mt-0.5 size-4 shrink-0 text-compass-purple-light" aria-hidden="true" /><p>Esses alertas são derivados dos dados do cliente e não criam tarefas. A execução operacional continua sendo gerenciada no ClickUp.</p></div>
    </div>
  );
}
