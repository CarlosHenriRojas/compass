"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin, requireCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type WeeklyUpdateActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((value) => value || null);

const updateSchema = z
  .object({
    clientId: z.uuid(),
    weekStart: z.iso.date("Informe o início do período."),
    weekEnd: z.iso.date("Informe o fim do período."),
    summary: z
      .string()
      .trim()
      .min(3, "Escreva um breve resumo da semana.")
      .max(4000),
    actionsCompleted: optionalText(6000),
    resultsSummary: optionalText(4000),
    blockers: optionalText(4000),
    nextSteps: optionalText(4000),
    priorityNextAction: optionalText(500),
    healthStatus: z
      .enum(["HEALTHY", "ATTENTION", "CRITICAL"])
      .or(z.literal(""))
      .transform((value) => value || null),
    notes: optionalText(4000),
  })
  .superRefine((data, context) => {
    if (data.weekEnd < data.weekStart) {
      context.addIssue({
        code: "custom",
        path: ["weekEnd"],
        message: "O fim do período não pode ser anterior ao início.",
      });
    }
  });

const resultSchema = z
  .object({
    label: z.string().trim().max(80),
    value: z.string().trim().max(80),
    description: z.string().trim().max(500),
  })
  .superRefine((result, context) => {
    if (!result.label || !result.value) {
      context.addIssue({
        code: "custom",
        message: "Informe o título e o valor de cada resultado.",
      });
    }
  });

export async function createWeeklyUpdateAction(
  _previousState: WeeklyUpdateActionState,
  formData: FormData,
): Promise<WeeklyUpdateActionState> {
  const profile = await requireCurrentProfile();
  const parsed = updateSchema.safeParse({
    clientId: formData.get("clientId"),
    weekStart: formData.get("weekStart"),
    weekEnd: formData.get("weekEnd"),
    summary: formData.get("summary"),
    actionsCompleted: formData.get("actionsCompleted"),
    resultsSummary: formData.get("resultsSummary"),
    blockers: formData.get("blockers"),
    nextSteps: formData.get("nextSteps"),
    priorityNextAction: formData.get("priorityNextAction"),
    healthStatus: formData.get("healthStatus"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const labels = formData.getAll("resultLabel").map(String);
  const values = formData.getAll("resultValue").map(String);
  const descriptions = formData.getAll("resultDescription").map(String);
  const rawResults = labels
    .map((label, index) => ({
      label,
      value: values[index] ?? "",
      description: descriptions[index] ?? "",
    }))
    .filter((result) => result.label || result.value || result.description);
  const resultsParsed = z.array(resultSchema).max(6).safeParse(rawResults);

  if (!resultsParsed.success) {
    return {
      status: "error",
      message: resultsParsed.error.issues[0]?.message ?? "Revise os resultados destacados.",
      fieldErrors: { results: ["Preencha título e valor ou remova a linha incompleta."] },
    };
  }

  const supabase = await createClient();
  if (profile.role !== "ADMIN") {
    const { data: membership } = await supabase
      .from("client_members")
      .select("id")
      .eq("client_id", parsed.data.clientId)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!membership) {
      return {
        status: "error",
        message: "Você não está vinculado a este cliente.",
      };
    }
  }

  const { data: update, error: updateError } = await supabase
    .from("weekly_updates")
    .insert({
      client_id: parsed.data.clientId,
      user_id: profile.id,
      week_start: parsed.data.weekStart,
      week_end: parsed.data.weekEnd,
      summary: parsed.data.summary,
      actions_completed: parsed.data.actionsCompleted,
      results_summary: parsed.data.resultsSummary,
      blockers: parsed.data.blockers,
      next_steps: parsed.data.nextSteps,
      priority_next_action: parsed.data.priorityNextAction,
      health_status: parsed.data.healthStatus,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();

  if (updateError || !update) {
    if (updateError?.code === "23505") {
      return {
        status: "error",
        message: "Já existe uma atualização para este cliente nesse período.",
        fieldErrors: { weekStart: ["Escolha outro início de semana."] },
      };
    }
    return {
      status: "error",
      message: "Não foi possível registrar a atualização.",
    };
  }

  if (resultsParsed.data.length) {
    const { error: resultsError } = await supabase
      .from("weekly_update_results")
      .insert(
        resultsParsed.data.map((result, index) => ({
          weekly_update_id: update.id,
          label: result.label,
          value: result.value,
          description: result.description || null,
          sort_order: index,
        })),
      );

    if (resultsError) {
      return {
        status: "error",
        message: "A atualização foi salva, mas os resultados destacados não puderam ser registrados.",
      };
    }
  }

  let healthWarning = false;
  if (parsed.data.healthStatus) {
    const { error: healthError } = await supabase.rpc("set_client_health", {
      target_client_id: parsed.data.clientId,
      next_health: parsed.data.healthStatus,
    });
    healthWarning = Boolean(healthError);
  }

  revalidatePath(`/clients/${parsed.data.clientId}/updates`);
  revalidatePath(`/clients/${parsed.data.clientId}/overview`);
  revalidatePath("/updates");
  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: healthWarning
      ? "Atualização salva. A saúde do cliente não pôde ser alterada."
      : "Atualização semanal registrada com sucesso.",
  };
}

export async function updateWeeklyUpdateAction(
  _previousState: WeeklyUpdateActionState,
  formData: FormData,
): Promise<WeeklyUpdateActionState> {
  const profile = await requireCurrentProfile();
  const updateId = z.uuid().safeParse(formData.get("updateId"));
  const parsed = updateSchema.safeParse({
    clientId: formData.get("clientId"),
    weekStart: formData.get("weekStart"),
    weekEnd: formData.get("weekEnd"),
    summary: formData.get("summary"),
    actionsCompleted: formData.get("actionsCompleted"),
    resultsSummary: formData.get("resultsSummary"),
    blockers: formData.get("blockers"),
    nextSteps: formData.get("nextSteps"),
    priorityNextAction: formData.get("priorityNextAction"),
    healthStatus: formData.get("healthStatus"),
    notes: formData.get("notes"),
  });
  if (!updateId.success || !parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  const labels = formData.getAll("resultLabel").map(String);
  const values = formData.getAll("resultValue").map(String);
  const descriptions = formData.getAll("resultDescription").map(String);
  const resultsParsed = z.array(resultSchema).max(6).safeParse(
    labels
      .map((label, index) => ({ label, value: values[index] ?? "", description: descriptions[index] ?? "" }))
      .filter((result) => result.label || result.value || result.description),
  );
  if (!resultsParsed.success) {
    return { status: "error", message: resultsParsed.error.issues[0]?.message ?? "Revise os resultados.", fieldErrors: { results: ["Preencha título e valor ou remova a linha incompleta."] } };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("weekly_updates")
    .select("id, client_id")
    .eq("id", updateId.data)
    .eq("client_id", parsed.data.clientId)
    .maybeSingle();
  if (!existing) return { status: "error", message: "Atualização não encontrada." };

  if (profile.role !== "ADMIN") {
    const { data: membership } = await supabase.from("client_members").select("id").eq("client_id", existing.client_id).eq("user_id", profile.id).maybeSingle();
    if (!membership) return { status: "error", message: "Você não possui permissão para editar esta atualização." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("weekly_updates")
    .update({
      week_start: parsed.data.weekStart,
      week_end: parsed.data.weekEnd,
      summary: parsed.data.summary,
      actions_completed: parsed.data.actionsCompleted,
      results_summary: parsed.data.resultsSummary,
      blockers: parsed.data.blockers,
      next_steps: parsed.data.nextSteps,
      priority_next_action: parsed.data.priorityNextAction,
      health_status: parsed.data.healthStatus,
      notes: parsed.data.notes,
    })
    .eq("id", existing.id);
  if (error) {
    return { status: "error", message: error.code === "23505" ? "Já existe uma atualização nesse período." : "Não foi possível atualizar o registro." };
  }

  await admin.from("weekly_update_results").delete().eq("weekly_update_id", existing.id);
  if (resultsParsed.data.length) {
    const { error: resultError } = await admin.from("weekly_update_results").insert(
      resultsParsed.data.map((result, index) => ({
        weekly_update_id: existing.id,
        label: result.label,
        value: result.value,
        description: result.description || null,
        sort_order: index,
      })),
    );
    if (resultError) return { status: "error", message: "A atualização foi editada, mas os destaques não puderam ser salvos." };
  }

  if (parsed.data.healthStatus) {
    await supabase.rpc("set_client_health", { target_client_id: existing.client_id, next_health: parsed.data.healthStatus });
  }
  revalidateUpdatePaths(existing.client_id);
  return { status: "success", message: "Atualização editada com sucesso." };
}

export async function deleteWeeklyUpdateAction(clientId: string, updateId: string) {
  await requireAdmin();
  const parsed = z.object({ clientId: z.uuid(), updateId: z.uuid() }).safeParse({ clientId, updateId });
  if (!parsed.success) return { ok: false, message: "Atualização inválida." };
  const admin = createAdminClient();
  const { error } = await admin.from("weekly_updates").delete().eq("id", parsed.data.updateId).eq("client_id", parsed.data.clientId);
  if (error) return { ok: false, message: "Não foi possível excluir a atualização." };
  revalidateUpdatePaths(parsed.data.clientId);
  return { ok: true, message: "Atualização excluída." };
}

function revalidateUpdatePaths(clientId: string) {
  revalidatePath(`/clients/${clientId}/updates`);
  revalidatePath(`/clients/${clientId}/overview`);
  revalidatePath("/updates");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}
