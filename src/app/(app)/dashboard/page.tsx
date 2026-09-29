import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CircleAlert,
  Clock3,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import { ClientHealthBadge } from "@/components/shared/client-health-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getClientHealthVisualStatus } from "@/features/clients/constants";
import { getPortfolioData, getPortfolioDates } from "@/features/dashboard/data";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { requireCurrentProfile } from "@/lib/auth/session";

export default async function DashboardPage() {
  const profile = await requireCurrentProfile();
  const firstName = profile.fullName.split(/\s+/)[0];
  const { clients, updates, contracts, goals } = await getPortfolioData({
    profileId: profile.id,
    role: profile.role,
  });
  const { today, inThirtyDays } = getPortfolioDates();
  const updateByClient = new Map(updates.map((update) => [update.client_id, update]));

  const openClients = clients.filter((client) => client.status !== "CLOSED");
  const activeCount = clients.filter((client) => client.status === "ACTIVE").length;
  const onboardingCount = clients.filter((client) => client.status === "ONBOARDING").length;
  const attentionClients = openClients.filter(
    (client) => client.health_status === "ATTENTION" || client.health_status === "CRITICAL",
  );
  const expiringContracts = contracts.filter(
    (contract) => contract.end_date && contract.end_date >= today && contract.end_date <= inThirtyDays,
  );
  const pendingUpdates = openClients.filter(
    (client) => (updateByClient.get(client.id)?.days_without_update ?? 0) > 7,
  );
  const overdueGoals = goals.filter((goal) => goal.deadline && goal.deadline < today);

  const focusClients = [...openClients]
    .sort((a, b) => {
      const score = (client: (typeof openClients)[number]) =>
        (client.health_status === "CRITICAL" ? 100 : client.health_status === "ATTENTION" ? 60 : 0) +
        Math.min(updateByClient.get(client.id)?.days_without_update ?? 0, 30) +
        (client.status === "ONBOARDING" ? 15 : 0);
      return score(b) - score(a);
    })
    .slice(0, 6);

  const clientById = new Map(clients.map((client) => [client.id, client]));
  const priorities = [
    ...pendingUpdates.map((client) => ({
      key: `update-${client.id}`,
      name: client.name,
      detail: `Sem acompanhamento há ${updateByClient.get(client.id)?.days_without_update ?? 0} dias`,
      href: `/clients/${client.id}/updates`,
      weight: (updateByClient.get(client.id)?.days_without_update ?? 0) > 14 ? 100 : 70,
    })),
    ...expiringContracts.map((contract) => {
      const client = clientById.get(contract.client_id);
      const days = Math.max(0, Math.ceil((new Date(`${contract.end_date}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) / 86400000));
      return { key: `contract-${contract.id}`, name: client?.name ?? "Cliente", detail: `Contrato vence em ${days} dia(s)`, href: `/clients/${contract.client_id}/contract`, weight: 80 - days };
    }),
    ...overdueGoals.map((goal) => ({ key: `goal-${goal.id}`, name: clientById.get(goal.client_id)?.name ?? "Cliente", detail: `Objetivo atrasado: ${goal.title}`, href: `/clients/${goal.client_id}/goals`, weight: 85 })),
    ...attentionClients.map((client) => ({ key: `health-${client.id}`, name: client.name, detail: client.health_status === "CRITICAL" ? "Saúde marcada como crítica" : "Saúde requer atenção", href: `/clients/${client.id}/overview`, weight: client.health_status === "CRITICAL" ? 95 : 65 })),
  ].sort((a, b) => b.weight - a.weight).slice(0, 5);

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        eyebrow="Visão geral"
        title={`Bom dia, ${firstName}.`}
        description="Acompanhe a saúde da carteira e veja o que pede atenção hoje."
        action={<Badge variant="outline" className="h-8 border-compass-purple-light/35 bg-compass-purple-soft/65 px-3 text-compass-purple-light">{profile.role === "ADMIN" ? "Carteira completa" : "Meus clientes"}</Badge>}
      />

      <section aria-label="Indicadores da carteira" className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Clientes ativos" value={String(activeCount)} helper="Carteira atual" icon={UsersRound} />
        <KpiCard label="Em onboarding" value={String(onboardingCount)} helper="Em fase inicial" icon={RefreshCw} tone="primary" />
        <KpiCard label="Precisam de atenção" value={String(attentionClients.length)} helper={`${attentionClients.filter((client) => client.health_status === "ATTENTION").length} atenção · ${attentionClients.filter((client) => client.health_status === "CRITICAL").length} crítico`} icon={CircleAlert} tone="critical" />
        <KpiCard label="Contratos vencendo" value={String(expiringContracts.length)} helper="Nos próximos 30 dias" icon={CalendarClock} tone="support" />
        <KpiCard label="Atualizações pendentes" value={String(pendingUpdates.length)} helper="Mais de 7 dias" icon={Clock3} tone="primary" />
      </section>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.82fr)]">
        <Card className="gap-0 border-none bg-card py-0 shadow-card ring-1 ring-border">
          <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
            <CardTitle className="text-[1.05rem] font-semibold">Carteira em foco</CardTitle>
            <CardDescription>Clientes priorizados por saúde e tempo sem acompanhamento.</CardDescription>
            <CardAction><Link href="/clients" className={buttonVariants({ variant: "ghost", size: "sm" })}>Ver clientes<ArrowUpRight aria-hidden="true" /></Link></CardAction>
          </CardHeader>
          <CardContent className="divide-y divide-border px-0">
            {focusClients.length ? focusClients.map((client) => {
              const services = client.client_services.map((item) => item.services?.name).filter((name): name is string => Boolean(name));
              const update = updateByClient.get(client.id);
              return (
                <Link key={client.id} href={`/clients/${client.id}/overview`} className="grid gap-3 px-5 py-[1.075rem] transition-colors hover:bg-card-hover sm:grid-cols-[minmax(0,1fr)_auto_minmax(190px,0.9fr)] sm:items-center sm:px-6">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-text-primary">{client.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{services.slice(0, 2).join(" · ") || client.segment || "Sem serviços"}</p></div>
                  <ClientHealthBadge status={getClientHealthVisualStatus(client.status, client.health_status)} />
                  <div className="min-w-0 sm:text-right"><p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-text-muted">Próximo foco</p><p className="mt-1 truncate text-xs text-text-secondary">{update?.priority_next_action ?? (update?.days_without_update ? `${update.days_without_update} dias sem atualização` : "Sem foco registrado")}</p></div>
                </Link>
              );
            }) : <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">Nenhum cliente disponível nesta carteira.</p>}
          </CardContent>
        </Card>

        <Card className="relative isolate gap-0 border-none bg-[linear-gradient(145deg,color-mix(in_srgb,var(--compass-brown)_24%,var(--background-elevated)),color-mix(in_srgb,var(--compass-purple)_20%,var(--background-soft)))] py-0 text-text-primary shadow-soft ring-1 ring-compass-purple-light/40">
          <CardHeader className="border-b border-white/[0.09] px-5 py-5"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-compass-purple-light">Prioridades</p><CardTitle className="text-[1.05rem] font-semibold text-text-primary">O que pede atenção</CardTitle><CardDescription className="text-text-secondary">Alertas calculados a partir dos dados reais.</CardDescription></CardHeader>
          <CardContent className="space-y-1 px-3 py-3.5">
            {priorities.length ? priorities.map((item, index) => (
              <Link key={item.key} href={item.href} className="flex gap-3.5 rounded-xl px-3 py-3.5 transition-colors hover:bg-foreground/[0.035]">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-compass-purple-soft text-xs font-semibold text-compass-purple-light ring-1 ring-compass-purple-light/15">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0"><p className="text-sm font-medium text-text-primary">{item.name}</p><p className="mt-1 text-xs leading-5 text-text-secondary">{item.detail}</p></div>
              </Link>
            )) : <p className="px-3 py-6 text-sm leading-6 text-text-secondary">Nenhum alerta estratégico no momento.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
