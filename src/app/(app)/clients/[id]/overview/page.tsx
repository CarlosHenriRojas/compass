import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { ClientHealthBadge } from "@/components/shared/client-health-badge";
import { ClientTabs } from "@/features/clients/components/client-tabs";
import {
  AddClientMemberForm,
  RemoveClientMemberButton,
} from "@/features/clients/components/client-team-controls";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getClientHealthVisualStatus,
  getClientStatusLabel,
} from "@/features/clients/constants";
import { formatMetricValue } from "@/features/metrics/format";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

function formatCnpj(value: string | null) {
  if (!value || value.length !== 14) return value ?? "Não informado";
  return value.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

export default async function ClientOverviewPage({
  params,
}: PageProps<"/clients/[id]/overview">) {
  const { id } = await params;
  const currentProfile = await requireCurrentProfile();
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();

  if (error || !client) notFound();

  const [membersResult, servicesResult, contactsResult, sellerResult, profilesResult, featuredMetricsResult] =
    await Promise.all([
      supabase
        .from("client_members")
        .select("id, responsibility, is_primary, profiles(id, full_name, email)")
        .eq("client_id", id)
        .order("is_primary", { ascending: false }),
      supabase
        .from("client_services")
        .select("id, scope_description, services(id, name)")
        .eq("client_id", id),
      supabase
        .from("client_contacts")
        .select("id, name, position, phone, email, is_primary")
        .eq("client_id", id)
        .order("is_primary", { ascending: false }),
      client.sold_by_user_id
        ? supabase
            .from("profiles")
            .select("full_name")
            .eq("id", client.sold_by_user_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("active", true)
        .order("full_name"),
      supabase
        .from("metrics")
        .select("id, name, category, baseline_value, default_direction, metric_units(key, name, symbol, format)")
        .eq("client_id", id)
        .eq("featured", true)
        .is("archived_at", null)
        .order("name"),
    ]);

  const featuredMetrics = featuredMetricsResult.data ?? [];
  const featuredMetricIds = featuredMetrics.map((metric) => metric.id);
  const latestMetricsResult = featuredMetricIds.length
    ? await supabase
        .from("latest_metric_entries")
        .select("metric_id, value, observed_at")
        .in("metric_id", featuredMetricIds)
    : { data: [] };
  const latestByMetric = new Map(
    (latestMetricsResult.data ?? []).map((entry) => [entry.metric_id, entry]),
  );

  const primaryMember = (membersResult.data ?? []).find(
    (member) => member.is_primary,
  );
  const primaryContact = (contactsResult.data ?? []).find(
    (contact) => contact.is_primary,
  );
  const location = [client.city, client.state].filter(Boolean).join(" · ");
  const assignedUserIds = new Set(
    (membersResult.data ?? []).map((member) => member.profiles?.id),
  );
  const availableProfiles = (profilesResult.data ?? []).filter(
    (profile) => !assignedUserIds.has(profile.id),
  );

  return (
    <div className="space-y-6 lg:space-y-7">
      <Link
        href="/clients"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft aria-hidden="true" />
        Voltar para clientes
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light shadow-card">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-compass-purple-light">
              Visão geral do cliente
            </p>
            <h1 className="truncate text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-[2.1rem]">
              {client.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {client.segment ?? "Segmento não informado"}
              {location ? ` · ${location}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {currentProfile.role === "ADMIN" ? (
            <Link
              href={`/clients/${id}/edit`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <Pencil aria-hidden="true" />
              Editar cliente
            </Link>
          ) : null}
          <Badge variant="outline">{getClientStatusLabel(client.status)}</Badge>
          <ClientHealthBadge
            status={getClientHealthVisualStatus(
              client.status,
              client.health_status,
            )}
          />
        </div>
      </div>

      <ClientTabs clientId={id} active="overview" />

      {featuredMetrics.length ? (
        <Card className="gap-0 py-0">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border px-5 py-5 sm:px-6">
            <div>
              <CardTitle>Indicadores em destaque</CardTitle>
              <CardDescription>Ponto de partida comparado aos números mais recentes.</CardDescription>
            </div>
            <Link href={`/clients/${id}/metrics`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Ver métricas
            </Link>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {featuredMetrics.map((metric) => {
              const latest = latestByMetric.get(metric.id);
              const unit = metric.metric_units;
              const delta = metric.baseline_value != null && latest?.value != null
                ? latest.value - metric.baseline_value
                : null;
              const improved = delta == null || metric.default_direction === "NEUTRAL"
                ? null
                : metric.default_direction === "INCREASE"
                  ? delta >= 0
                  : delta <= 0;
              return (
                <div key={metric.id} className="rounded-2xl border border-border bg-background-elevated/45 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{metric.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{metric.category ?? unit?.name ?? "Indicador"}</p>
                    </div>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light">
                      <BarChart3 className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Atual</p>
                      <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">{formatMetricValue(latest?.value, unit)}</p>
                    </div>
                    {delta != null ? (
                      <span className={cn("flex items-center gap-1 text-xs font-semibold", improved === true ? "text-status-healthy" : improved === false ? "text-status-critical" : "text-text-secondary")}>
                        {delta >= 0 ? <TrendingUp className="size-3.5" aria-hidden="true" /> : <TrendingDown className="size-3.5" aria-hidden="true" />}
                        {delta >= 0 ? "+" : "−"}{formatMetricValue(Math.abs(delta), unit)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>Ponto de partida</span>
                    <span className="font-medium text-text-secondary">{formatMetricValue(metric.baseline_value, unit)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-5">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
              <CardTitle>Serviços contratados</CardTitle>
              <CardDescription>Escopo operacional atual da Compass.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border px-0">
              {(servicesResult.data ?? []).length ? (
                (servicesResult.data ?? []).map((item) => (
                  <div key={item.id} className="px-5 py-4 sm:px-6">
                    <p className="font-semibold text-text-primary">
                      {item.services?.name ?? "Serviço"}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-text-secondary">
                      {item.scope_description ?? "Escopo específico ainda não informado."}
                    </p>
                  </div>
                ))
              ) : (
                <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">Nenhum serviço cadastrado.</p>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
              <CardTitle>Contexto</CardTitle>
              <CardDescription>Observações registradas no cadastro.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Observações gerais</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{client.general_notes ?? "Nenhuma observação registrada."}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Observações internas</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{client.internal_notes ?? "Nenhuma observação interna registrada."}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border px-5 py-5">
              <CardTitle>Relacionamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5 text-sm">
              <div className="flex gap-3">
                <UserRound className="mt-0.5 size-4 shrink-0 text-compass-purple-light" aria-hidden="true" />
                <div><p className="text-xs text-muted-foreground">Responsável principal</p><p className="mt-1 font-medium text-text-primary">{primaryMember?.profiles?.full_name ?? "Não definido"}</p></div>
              </div>
              <div className="flex gap-3">
                <Building2 className="mt-0.5 size-4 shrink-0 text-compass-purple-light" aria-hidden="true" />
                <div><p className="text-xs text-muted-foreground">Cliente desde</p><p className="mt-1 font-medium text-text-primary">{formatDate(client.joined_at)}</p></div>
              </div>
              <div className="flex gap-3">
                <UserRound className="mt-0.5 size-4 shrink-0 text-compass-purple-light" aria-hidden="true" />
                <div><p className="text-xs text-muted-foreground">Quem vendeu</p><p className="mt-1 font-medium text-text-primary">{sellerResult.data?.full_name ?? "Não informado"}</p></div>
              </div>
              <div><p className="text-xs text-muted-foreground">Origem</p><p className="mt-1 font-medium text-text-primary">{client.acquisition_source ?? "Não informada"}</p></div>
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border px-5 py-5">
              <CardTitle>Contato principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5 text-sm">
              {primaryContact ? (
                <>
                  <div><p className="font-semibold text-text-primary">{primaryContact.name}</p><p className="mt-1 text-xs text-muted-foreground">{primaryContact.position ?? "Cargo não informado"}</p></div>
                  {primaryContact.phone ? <p className="flex items-center gap-2 text-text-secondary"><Phone className="size-4 text-compass-purple-light" aria-hidden="true" />{primaryContact.phone}</p> : null}
                  {primaryContact.email ? <a href={`mailto:${primaryContact.email}`} className="flex items-center gap-2 text-text-secondary hover:text-foreground"><Mail className="size-4 text-compass-purple-light" aria-hidden="true" />{primaryContact.email}</a> : null}
                </>
              ) : <p className="text-muted-foreground">Nenhum contato cadastrado.</p>}
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border px-5 py-5">
              <CardTitle>Equipe responsável</CardTitle>
              <CardDescription>
                Pessoas da Compass vinculadas a este cliente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                {(membersResult.data ?? []).map((member) => {
                  const memberName =
                    member.profiles?.full_name ?? "Usuário indisponível";
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background-elevated/45 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">
                          {memberName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {member.is_primary
                            ? "Responsável principal"
                            : member.responsibility ?? "Responsável secundário"}
                        </p>
                      </div>
                      {currentProfile.role === "ADMIN" && !member.is_primary ? (
                        <RemoveClientMemberButton
                          clientId={id}
                          memberId={member.id}
                          memberName={memberName}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {currentProfile.role === "ADMIN" ? (
                <AddClientMemberForm
                  clientId={id}
                  profiles={availableProfiles.map((profile) => ({
                    id: profile.id,
                    fullName: profile.full_name,
                  }))}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card className="gap-0 py-0">
            <CardHeader className="border-b border-border px-5 py-5"><CardTitle>Dados da empresa</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-5 text-sm">
              <div><p className="text-xs text-muted-foreground">Razão social</p><p className="mt-1 text-text-primary">{client.legal_name ?? "Não informada"}</p></div>
              <div><p className="text-xs text-muted-foreground">CNPJ</p><p className="mt-1 text-text-primary">{formatCnpj(client.cnpj)}</p></div>
              {location ? <p className="flex items-center gap-2 text-text-secondary"><MapPin className="size-4 text-compass-purple-light" aria-hidden="true" />{location}</p> : null}
              {[client.website_url, client.instagram_url, client.google_business_url].filter((url): url is string => Boolean(url)).map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 truncate text-compass-purple-light hover:text-foreground"><ExternalLink className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{new URL(url).hostname}</span></a>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
