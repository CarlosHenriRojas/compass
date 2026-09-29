import Link from "next/link";
import { Archive, Filter, Plus, Search, UsersRound } from "lucide-react";

import { ClientHealthBadge } from "@/components/shared/client-health-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClientLifecycleButton } from "@/features/clients/components/client-lifecycle-button";
import {
  clientStatusOptions,
  getClientHealthVisualStatus,
  getClientStatusLabel,
  healthStatusOptions,
} from "@/features/clients/constants";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type ClientsSearchParams = Promise<{
  q?: string;
  status?: string;
  health?: string;
  responsible?: string;
  service?: string;
  archived?: string;
}>;

const selectClassName =
  "h-10 rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20";

function formatDate(value: string | null) {
  if (!value) return "Sem atualização";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: ClientsSearchParams;
}) {
  const filters = await searchParams;
  const currentProfile = await requireCurrentProfile();
  const supabase = await createClient();
  const showArchived = currentProfile.role === "ADMIN" && filters.archived === "1";
  let clientsQuery = supabase
    .from("clients")
    .select(
      "id, name, segment, status, health_status, joined_at, archived_at, client_members(is_primary, profiles(id, full_name)), client_services(services(id, name))",
    )
    .order("name");
  clientsQuery = showArchived
    ? clientsQuery.not("archived_at", "is", null)
    : clientsQuery.is("archived_at", null);

  const [clientsResult, updatesResult, profilesResult, servicesResult] =
    await Promise.all([
      clientsQuery,
      supabase.from("client_last_updates").select("*"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("active", true)
        .order("full_name"),
      supabase
        .from("services")
        .select("id, name")
        .eq("active", true)
        .order("sort_order")
        .order("name"),
    ]);

  const lastUpdateByClient = new Map(
    (updatesResult.data ?? []).map((update) => [update.client_id, update]),
  );
  const query = filters.q?.trim().toLocaleLowerCase("pt-BR") ?? "";

  const clients = (clientsResult.data ?? []).filter((client) => {
    const primaryMember = client.client_members.find(
      (member) => member.is_primary,
    );
    const serviceIds = client.client_services
      .map((item) => item.services?.id)
      .filter(Boolean);

    return (
      (!query || client.name.toLocaleLowerCase("pt-BR").includes(query)) &&
      (!filters.status || client.status === filters.status) &&
      (!filters.health || client.health_status === filters.health) &&
      (!filters.responsible ||
        primaryMember?.profiles?.id === filters.responsible) &&
      (!filters.service || serviceIds.includes(filters.service))
    );
  });

  const pageActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={showArchived ? "/clients" : "/clients?archived=1"}
        className={buttonVariants({ variant: "secondary", size: "lg" })}
      >
        <Archive aria-hidden="true" />
        {showArchived ? "Ver carteira ativa" : "Ver arquivados"}
      </Link>
      {!showArchived ? (
        <Link href="/clients/new" className={buttonVariants({ size: "lg" })}>
          <Plus aria-hidden="true" />
          Novo cliente
        </Link>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        eyebrow="Carteira"
        title={showArchived ? "Clientes arquivados" : "Clientes"}
        description={showArchived ? "Consulte e reative clientes preservados fora da carteira operacional." : "Consulte responsáveis, serviços e situação operacional da carteira."}
        action={currentProfile.role === "ADMIN" ? pageActions : undefined}
      />

      <Card className="gap-0 py-0">
        <CardContent className="p-4 sm:p-5">
          <form
            className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_repeat(4,minmax(150px,auto))_auto]"
            method="get"
          >
            {showArchived ? <input type="hidden" name="archived" value="1" /> : null}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                aria-hidden="true"
              />
              <Input
                name="q"
                defaultValue={filters.q}
                placeholder="Buscar cliente..."
                className="pl-9"
              />
            </div>
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className={selectClassName}
              aria-label="Filtrar por status"
            >
              <option value="">Todos os status</option>
              {clientStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              name="health"
              defaultValue={filters.health ?? ""}
              className={selectClassName}
              aria-label="Filtrar por saúde"
            >
              <option value="">Todas as saúdes</option>
              {healthStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              name="responsible"
              defaultValue={filters.responsible ?? ""}
              className={selectClassName}
              aria-label="Filtrar por responsável"
            >
              <option value="">Todos os responsáveis</option>
              {(profilesResult.data ?? []).map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </select>
            <select
              name="service"
              defaultValue={filters.service ?? ""}
              className={selectClassName}
              aria-label="Filtrar por serviço"
            >
              <option value="">Todos os serviços</option>
              {(servicesResult.data ?? []).map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              <Filter aria-hidden="true" />
              Filtrar
            </button>
          </form>
        </CardContent>
      </Card>

      {clients.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title={
            clientsResult.data?.length
              ? "Nenhum cliente encontrado"
              : showArchived ? "Nenhum cliente arquivado" : "A carteira ainda está vazia"
          }
          description={
            clientsResult.data?.length
              ? "Ajuste os filtros para encontrar outros clientes."
              : showArchived ? "Clientes arquivados aparecerão aqui e poderão ser reativados." : "Cadastre o primeiro cliente para iniciar a central de acompanhamento da Compass."
          }
          action={
            currentProfile.role === "ADMIN" && !clientsResult.data?.length
              ? pageActions
              : undefined
          }
        />
      ) : (
        <Card className="gap-0 py-0">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background-elevated/55 text-[0.68rem] uppercase tracking-[0.16em] text-text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Cliente</th>
                  <th className="px-5 py-3.5 font-semibold">Responsável</th>
                  <th className="px-5 py-3.5 font-semibold">Serviços</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Saúde</th>
                  <th className="px-5 py-3.5 font-semibold">
                    Última atualização
                  </th>
                  {showArchived ? <th className="px-5 py-3.5 font-semibold">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => {
                  const primaryMember = client.client_members.find(
                    (member) => member.is_primary,
                  );
                  const serviceNames = client.client_services
                    .map((item) => item.services?.name)
                    .filter((name): name is string => Boolean(name));
                  const update = lastUpdateByClient.get(client.id);

                  return (
                    <tr
                      key={client.id}
                      className="transition-colors hover:bg-card-hover"
                    >
                      <td className="px-5 py-4">
                        {showArchived ? (
                          <span className="font-semibold text-text-primary">{client.name}</span>
                        ) : (
                          <Link
                            href={`/clients/${client.id}/overview`}
                            className="font-semibold text-text-primary transition-colors hover:text-compass-purple-light"
                          >
                            {client.name}
                          </Link>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {client.segment ?? "Segmento não informado"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-text-secondary">
                        {primaryMember?.profiles?.full_name ?? "Não definido"}
                      </td>
                      <td className="max-w-xs px-5 py-4 text-text-secondary">
                        {serviceNames.slice(0, 2).join(" · ")}
                        {serviceNames.length > 2
                          ? ` +${serviceNames.length - 2}`
                          : ""}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="outline">
                          {getClientStatusLabel(client.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <ClientHealthBadge
                          status={getClientHealthVisualStatus(
                            client.status,
                            client.health_status,
                          )}
                        />
                      </td>
                      <td className="px-5 py-4 text-text-secondary">
                        {formatDate(update?.last_update_date ?? null)}
                      </td>
                      {showArchived ? (
                        <td className="px-5 py-4">
                          <ClientLifecycleButton
                            clientId={client.id}
                            clientName={client.name}
                            mode="restore"
                          />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {clients.map((client) => {
              const primaryMember = client.client_members.find(
                (member) => member.is_primary,
              );
              const serviceNames = client.client_services
                .map((item) => item.services?.name)
                .filter((name): name is string => Boolean(name));
              const update = lastUpdateByClient.get(client.id);

              return (
                <div
                  key={client.id}
                  className="space-y-3 p-5 transition-colors hover:bg-card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {showArchived ? (
                        <p className="font-semibold text-text-primary">{client.name}</p>
                      ) : (
                        <Link
                          href={`/clients/${client.id}/overview`}
                          className="font-semibold text-text-primary transition-colors hover:text-compass-purple-light"
                        >
                          {client.name}
                        </Link>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {client.segment ?? "Segmento não informado"}
                      </p>
                    </div>
                    <ClientHealthBadge
                      status={getClientHealthVisualStatus(
                        client.status,
                        client.health_status,
                      )}
                    />
                  </div>
                  <p className="text-sm text-text-secondary">
                    {serviceNames.join(" · ") || "Sem serviços"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {primaryMember?.profiles?.full_name ?? "Sem responsável"}
                    </span>
                    <span>{formatDate(update?.last_update_date ?? null)}</span>
                  </div>
                  {showArchived ? (
                    <ClientLifecycleButton
                      clientId={client.id}
                      clientName={client.name}
                      mode="restore"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {clients.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {clients.length} cliente(s) exibido(s).
        </p>
      ) : null}
    </div>
  );
}
