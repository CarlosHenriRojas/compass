import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BoardTask } from "@/features/tasks/components/task-board";

type TaskQueryRow = {
  id: string;
  title: string;
  description: string | null;
  status: BoardTask["status"];
  priority: BoardTask["priority"];
  due_date: string | null;
  clients: { id: string; name: string; archived_at: string | null } | null;
  services: { id: string; name: string } | null;
  task_assignees: Array<{ profiles: { id: string; full_name: string } | null }>;
};

export async function getTaskBoardData(clientId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("id, title, description, status, priority, due_date, clients(id, name, archived_at), services(id, name), task_assignees(profiles!task_assignees_user_id_fkey(id, full_name))")
    .is("archived_at", null)
    .is("parent_task_id", null)
    .order("sort_order")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível carregar as tarefas.");

  return ((data ?? []) as unknown as TaskQueryRow[])
    .filter((task) => !task.clients || task.clients.archived_at === null)
    .map((task): BoardTask => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      client: task.clients ? { id: task.clients.id, name: task.clients.name } : null,
      service: task.services,
      assignees: task.task_assignees.flatMap((assignment) => assignment.profiles ? [{ id: assignment.profiles.id, name: assignment.profiles.full_name }] : []),
    }));
}

export async function getTaskFormOptions() {
  const supabase = await createClient();
  const [clientsResult, servicesResult, profilesResult] = await Promise.all([
    supabase.from("clients").select("id, name").is("archived_at", null).order("name"),
    supabase.from("services").select("id, name").eq("active", true).order("sort_order").order("name"),
    supabase.from("profiles").select("id, full_name").eq("active", true).order("full_name"),
  ]);
  return {
    clients: (clientsResult.data ?? []).map((item) => ({ id: item.id, name: item.name })),
    services: (servicesResult.data ?? []).map((item) => ({ id: item.id, name: item.name })),
    profiles: (profilesResult.data ?? []).map((item) => ({ id: item.id, name: item.full_name })),
  };
}

