import "server-only";

import { createClient } from "@/lib/supabase/server";

export { getPortfolioDates } from "@/features/dashboard/dates";

export async function getPortfolioData({
  profileId,
  role,
}: {
  profileId: string;
  role: "ADMIN" | "COLLABORATOR";
}) {
  const supabase = await createClient();
  const [clientsResult, updatesResult, contractsResult, goalsResult] =
    await Promise.all([
      supabase
        .from("clients")
        .select(
          "id, name, segment, status, health_status, client_members(user_id, is_primary, profiles(full_name)), client_services(services(name))",
        )
        .is("archived_at", null)
        .order("name"),
      supabase.from("client_last_updates").select("*"),
      supabase
        .from("contracts")
        .select("id, client_id, end_date, status")
        .in("status", ["ACTIVE", "IN_RENEWAL"]),
      supabase
        .from("goals")
        .select("id, client_id, title, deadline, status")
        .in("status", ["NOT_STARTED", "IN_PROGRESS"]),
    ]);

  const clients = (clientsResult.data ?? []).filter(
    (client) =>
      role === "ADMIN" ||
      client.client_members.some((member) => member.user_id === profileId),
  );
  const clientIds = new Set(clients.map((client) => client.id));

  return {
    clients,
    updates: (updatesResult.data ?? []).filter(
      (update) => update.client_id && clientIds.has(update.client_id),
    ),
    contracts: (contractsResult.data ?? []).filter((contract) =>
      clientIds.has(contract.client_id),
    ),
    goals: (goalsResult.data ?? []).filter((goal) =>
      clientIds.has(goal.client_id),
    ),
  };
}
