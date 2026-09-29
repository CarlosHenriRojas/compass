import { Filter, RefreshCw } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WeeklyUpdateCard } from "@/features/updates/components/weekly-update-card";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type UpdatesSearchParams = Promise<{
  client?: string;
  responsible?: string;
  from?: string;
  to?: string;
}>;

const selectClassName =
  "h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20";

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: UpdatesSearchParams;
}) {
  await requireCurrentProfile();
  const filters = await searchParams;
  const supabase = await createClient();

  let updatesQuery = supabase
    .from("weekly_updates")
    .select(
      "*, clients!weekly_updates_client_id_fkey(id, name), profiles!weekly_updates_user_id_fkey(id, full_name), weekly_update_results(id, label, value, description, sort_order)",
    )
    .order("week_end", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.client) updatesQuery = updatesQuery.eq("client_id", filters.client);
  if (filters.responsible) updatesQuery = updatesQuery.eq("user_id", filters.responsible);
  if (filters.from) updatesQuery = updatesQuery.gte("week_end", filters.from);
  if (filters.to) updatesQuery = updatesQuery.lte("week_start", filters.to);

  const [updatesResult, clientsResult, profilesResult] = await Promise.all([
    updatesQuery,
    supabase
      .from("clients")
      .select("id, name")
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("active", true)
      .order("full_name"),
  ]);

  const updates = updatesResult.data ?? [];

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        eyebrow="Acompanhamento"
        title="Atualizações"
        description="Feed cronológico do contexto e da evolução de toda a carteira."
      />

      <Card className="gap-0 py-0">
        <CardContent className="p-4 sm:p-5">
          <form
            method="get"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_170px_170px_auto]"
          >
            <select
              name="client"
              defaultValue={filters.client ?? ""}
              className={selectClassName}
              aria-label="Filtrar por cliente"
            >
              <option value="">Todos os clientes</option>
              {(clientsResult.data ?? []).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <select
              name="responsible"
              defaultValue={filters.responsible ?? ""}
              className={selectClassName}
              aria-label="Filtrar por autor"
            >
              <option value="">Todos que atualizaram</option>
              {(profilesResult.data ?? []).map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </select>
            <Input
              type="date"
              name="from"
              defaultValue={filters.from}
              aria-label="Período inicial"
            />
            <Input
              type="date"
              name="to"
              defaultValue={filters.to}
              aria-label="Período final"
            />
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

      {updates.length ? (
        <div className="mx-auto max-w-5xl space-y-5">
          {updates.map((update) => (
            <WeeklyUpdateCard
              key={update.id}
              showClient
              update={{
                id: update.id,
                clientId: update.client_id,
                clientName: update.clients?.name ?? "Cliente",
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
          ))}
        </div>
      ) : (
        <EmptyState
          icon={RefreshCw}
          title="Nenhuma atualização encontrada"
          description="Registre uma atualização dentro do cliente ou ajuste os filtros deste feed."
        />
      )}
    </div>
  );
}
