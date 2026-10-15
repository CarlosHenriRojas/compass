"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database";

export type TaskActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const optionalUuid = z
  .uuid("Selecione uma opção válida.")
  .or(z.literal(""))
  .transform((value) => value || null);

const optionalDate = z
  .iso.date("Informe uma data válida.")
  .or(z.literal(""))
  .transform((value) => value || null);

const taskSchema = z.object({
  taskId: z.uuid().optional(),
  title: z.string().trim().min(2, "Informe o título da tarefa.").max(180, "Use no máximo 180 caracteres."),
  description: z.string().trim().max(5000, "Use no máximo 5.000 caracteres.").transform((value) => value || null),
  clientId: optionalUuid,
  serviceId: optionalUuid,
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  dueDate: optionalDate,
  assigneeIds: z.array(z.uuid()).max(20, "Selecione no máximo 20 responsáveis."),
});

function parseTaskForm(formData: FormData, includeTaskId = false) {
  return taskSchema.safeParse({
    taskId: includeTaskId ? formData.get("taskId") : undefined,
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    clientId: formData.get("clientId") ?? "",
    serviceId: formData.get("serviceId") ?? "",
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate") ?? "",
    assigneeIds: formData.getAll("assigneeIds"),
  });
}

function revalidateTaskPaths(taskId?: string, clientId?: string | null) {
  revalidatePath("/tasks");
  if (taskId) revalidatePath(`/tasks/${taskId}`);
  if (clientId) revalidatePath(`/clients/${clientId}/tasks`);
}

export async function createTaskAction(
  _previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const profile = await requireCurrentProfile();
  const parsed = parseTaskForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      client_id: parsed.data.clientId,
      service_id: parsed.data.serviceId,
      status: parsed.data.status,
      priority: parsed.data.priority,
      due_date: parsed.data.dueDate,
      completed_at: parsed.data.status === "DONE" ? new Date().toISOString() : null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !task) {
    return { status: "error", message: "Não foi possível criar a tarefa. Verifique suas permissões e tente novamente." };
  }

  const uniqueAssignees = [...new Set(parsed.data.assigneeIds)];
  if (uniqueAssignees.length) {
    const { error: assigneeError } = await supabase.from("task_assignees").insert(
      uniqueAssignees.map((userId) => ({
        task_id: task.id,
        user_id: userId,
        assigned_by: profile.id,
      })),
    );
    if (assigneeError) {
      await supabase.from("tasks").delete().eq("id", task.id);
      return { status: "error", message: "A tarefa não foi criada porque os responsáveis não puderam ser vinculados." };
    }
  }

  revalidateTaskPaths(task.id, parsed.data.clientId);
  return { status: "success", message: "Tarefa criada com sucesso." };
}

export async function updateTaskAction(
  _previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const profile = await requireCurrentProfile();
  const parsed = parseTaskForm(formData, true);
  if (!parsed.success || !parsed.data.taskId) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: previous } = await supabase
    .from("tasks")
    .select("id, client_id")
    .eq("id", parsed.data.taskId)
    .maybeSingle();
  if (!previous) return { status: "error", message: "Tarefa não encontrada ou acesso não autorizado." };

  const { error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      client_id: parsed.data.clientId,
      service_id: parsed.data.serviceId,
      status: parsed.data.status,
      priority: parsed.data.priority,
      due_date: parsed.data.dueDate,
      completed_at: parsed.data.status === "DONE" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.taskId);
  if (error) return { status: "error", message: "Não foi possível atualizar a tarefa." };

  const { error: clearError } = await supabase.from("task_assignees").delete().eq("task_id", parsed.data.taskId);
  if (clearError) return { status: "error", message: "A tarefa foi atualizada, mas os responsáveis não puderam ser alterados." };

  const uniqueAssignees = [...new Set(parsed.data.assigneeIds)];
  if (uniqueAssignees.length) {
    const { error: assigneeError } = await supabase.from("task_assignees").insert(
      uniqueAssignees.map((userId) => ({ task_id: parsed.data.taskId!, user_id: userId, assigned_by: profile.id })),
    );
    if (assigneeError) return { status: "error", message: "A tarefa foi atualizada, mas os responsáveis não puderam ser vinculados." };
  }

  revalidateTaskPaths(parsed.data.taskId, previous.client_id);
  if (parsed.data.clientId !== previous.client_id) revalidateTaskPaths(parsed.data.taskId, parsed.data.clientId);
  return { status: "success", message: "Tarefa atualizada com sucesso." };
}

export async function updateTaskStatusAction(taskId: string, status: Enums<"task_status">) {
  await requireCurrentProfile();
  const parsed = z.object({ taskId: z.uuid(), status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]) }).safeParse({ taskId, status });
  if (!parsed.success) return { ok: false, message: "Movimentação inválida." };

  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("id, client_id, status").eq("id", taskId).maybeSingle();
  if (!task) return { ok: false, message: "Tarefa não encontrada ou acesso não autorizado." };
  if (task.status === status) return { ok: true, message: "Tarefa já está nesta etapa." };

  const { error } = await supabase.from("tasks").update({
    status: parsed.data.status,
    completed_at: parsed.data.status === "DONE" ? new Date().toISOString() : null,
  }).eq("id", parsed.data.taskId);
  if (error) return { ok: false, message: "Não foi possível mover a tarefa." };

  revalidateTaskPaths(task.id, task.client_id);
  return { ok: true, message: "Tarefa movida." };
}

export async function archiveTaskAction(taskId: string) {
  await requireCurrentProfile();
  const parsed = z.uuid().safeParse(taskId);
  if (!parsed.success) return { ok: false, message: "Tarefa inválida." };

  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("id, client_id").eq("id", parsed.data).maybeSingle();
  if (!task) return { ok: false, message: "Tarefa não encontrada ou acesso não autorizado." };
  const { error } = await supabase.from("tasks").update({ archived_at: new Date().toISOString() }).eq("id", parsed.data);
  if (error) return { ok: false, message: "Não foi possível arquivar a tarefa." };
  revalidateTaskPaths(task.id, task.client_id);
  return { ok: true, message: "Tarefa arquivada." };
}

