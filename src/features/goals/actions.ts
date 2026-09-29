"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type GoalActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const optionalNumber = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  z.coerce.number("Informe um número válido.").finite().nullable(),
);

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((value) => value || null);

const createGoalSchema = z
  .object({
    clientId: z.uuid(),
    title: z.string().trim().min(2, "Informe o título do objetivo.").max(160),
    description: optionalText(3000),
    category: optionalText(100),
    metricId: z.uuid().or(z.literal("")).transform((value) => value || null),
    initialValue: optionalNumber,
    targetValue: optionalNumber,
    manualCurrentValue: optionalNumber,
    direction: z.enum(["INCREASE", "DECREASE"]),
    startDate: z.iso.date("Informe a data inicial."),
    deadline: z.iso.date().or(z.literal("")).transform((value) => value || null),
    responsibleUserId: z.uuid().or(z.literal("")).transform((value) => value || null),
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ACHIEVED", "PAUSED", "CANCELLED"]),
  })
  .superRefine((data, context) => {
    if (data.deadline && data.deadline < data.startDate) {
      context.addIssue({ code: "custom", path: ["deadline"], message: "O prazo não pode ser anterior ao início." });
    }
    if ((data.initialValue == null) !== (data.targetValue == null)) {
      context.addIssue({ code: "custom", path: [data.initialValue == null ? "initialValue" : "targetValue"], message: "Informe o valor inicial e a meta." });
    }
  });

const editGoalSchema = createGoalSchema.and(z.object({ goalId: z.uuid() }));

export async function createGoalAction(
  _previousState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  const profile = await requireAdmin();
  const parsed = createGoalSchema.safeParse({
    clientId: formData.get("clientId"),
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    metricId: formData.get("metricId"),
    initialValue: formData.get("initialValue"),
    targetValue: formData.get("targetValue"),
    manualCurrentValue: formData.get("manualCurrentValue"),
    direction: formData.get("direction"),
    startDate: formData.get("startDate"),
    deadline: formData.get("deadline"),
    responsibleUserId: formData.get("responsibleUserId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  if (parsed.data.metricId) {
    const { data: metric } = await supabase.from("metrics").select("id").eq("id", parsed.data.metricId).eq("client_id", parsed.data.clientId).is("archived_at", null).maybeSingle();
    if (!metric) return { status: "error", message: "A métrica selecionada não pertence a este cliente.", fieldErrors: { metricId: ["Selecione outra métrica."] } };
  }

  if (parsed.data.responsibleUserId) {
    const { data: responsible } = await supabase.from("profiles").select("id").eq("id", parsed.data.responsibleUserId).eq("active", true).maybeSingle();
    if (!responsible) return { status: "error", message: "O responsável selecionado não está disponível.", fieldErrors: { responsibleUserId: ["Selecione outra pessoa."] } };
  }

  const { error } = await supabase.from("goals").insert({
    client_id: parsed.data.clientId,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    metric_id: parsed.data.metricId,
    initial_value: parsed.data.initialValue,
    target_value: parsed.data.targetValue,
    manual_current_value: parsed.data.metricId ? null : parsed.data.manualCurrentValue,
    direction: parsed.data.direction,
    start_date: parsed.data.startDate,
    deadline: parsed.data.deadline,
    responsible_user_id: parsed.data.responsibleUserId,
    status: parsed.data.status,
    completed_at: parsed.data.status === "ACHIEVED" ? new Date().toISOString() : null,
    created_by: profile.id,
  });

  if (error) return { status: "error", message: "Não foi possível criar o objetivo." };

  revalidatePath(`/clients/${parsed.data.clientId}/goals`);
  revalidatePath(`/clients/${parsed.data.clientId}/overview`);
  return { status: "success", message: "Objetivo criado com sucesso." };
}

export async function editGoalAction(
  _previousState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  await requireAdmin();
  const parsed = editGoalSchema.safeParse({
    clientId: formData.get("clientId"),
    goalId: formData.get("goalId"),
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    metricId: formData.get("metricId"),
    initialValue: formData.get("initialValue"),
    targetValue: formData.get("targetValue"),
    manualCurrentValue: formData.get("manualCurrentValue"),
    direction: formData.get("direction"),
    startDate: formData.get("startDate"),
    deadline: formData.get("deadline"),
    responsibleUserId: formData.get("responsibleUserId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  if (parsed.data.metricId) {
    const { data: metric } = await supabase.from("metrics").select("id").eq("id", parsed.data.metricId).eq("client_id", parsed.data.clientId).maybeSingle();
    if (!metric) return { status: "error", message: "A métrica selecionada não está disponível.", fieldErrors: { metricId: ["Selecione outra métrica."] } };
  }

  const { error } = await supabase
    .from("goals")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      metric_id: parsed.data.metricId,
      initial_value: parsed.data.initialValue,
      target_value: parsed.data.targetValue,
      manual_current_value: parsed.data.metricId ? null : parsed.data.manualCurrentValue,
      direction: parsed.data.direction,
      start_date: parsed.data.startDate,
      deadline: parsed.data.deadline,
      responsible_user_id: parsed.data.responsibleUserId,
      status: parsed.data.status,
      completed_at: parsed.data.status === "ACHIEVED" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.goalId)
    .eq("client_id", parsed.data.clientId);
  if (error) return { status: "error", message: "Não foi possível atualizar o objetivo." };

  revalidatePath(`/clients/${parsed.data.clientId}/goals`);
  revalidatePath(`/clients/${parsed.data.clientId}/overview`);
  return { status: "success", message: "Objetivo atualizado." };
}

export async function deleteGoalAction(clientId: string, goalId: string) {
  await requireAdmin();
  const parsed = z.object({ clientId: z.uuid(), goalId: z.uuid() }).safeParse({ clientId, goalId });
  if (!parsed.success) return { ok: false, message: "Objetivo inválido." };

  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", parsed.data.goalId).eq("client_id", parsed.data.clientId);
  if (error) return { ok: false, message: "Não foi possível excluir o objetivo." };
  revalidatePath(`/clients/${parsed.data.clientId}/goals`);
  revalidatePath(`/clients/${parsed.data.clientId}/overview`);
  return { ok: true, message: "Objetivo excluído." };
}

const updateGoalProgressSchema = z.object({
  clientId: z.uuid(),
  goalId: z.uuid(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ACHIEVED", "PAUSED", "CANCELLED"]),
  manualCurrentValue: optionalNumber,
});

export async function updateGoalProgressAction(
  _previousState: GoalActionState,
  formData: FormData,
): Promise<GoalActionState> {
  await requireAdmin();
  const parsed = updateGoalProgressSchema.safeParse({
    clientId: formData.get("clientId"),
    goalId: formData.get("goalId"),
    status: formData.get("status"),
    manualCurrentValue: formData.get("manualCurrentValue"),
  });
  if (!parsed.success) return { status: "error", message: "Revise a atualização do objetivo.", fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: goal } = await supabase.from("goals").select("id, metric_id").eq("id", parsed.data.goalId).eq("client_id", parsed.data.clientId).maybeSingle();
  if (!goal) return { status: "error", message: "Objetivo não encontrado." };

  const { error } = await supabase.from("goals").update({
    status: parsed.data.status,
    manual_current_value: goal.metric_id ? null : parsed.data.manualCurrentValue,
    completed_at: parsed.data.status === "ACHIEVED" ? new Date().toISOString() : null,
  }).eq("id", goal.id);
  if (error) return { status: "error", message: "Não foi possível atualizar o objetivo." };

  revalidatePath(`/clients/${parsed.data.clientId}/goals`);
  revalidatePath(`/clients/${parsed.data.clientId}/overview`);
  return { status: "success", message: "Objetivo atualizado." };
}
