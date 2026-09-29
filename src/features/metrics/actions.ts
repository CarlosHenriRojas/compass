"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin, requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type MetricActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const optionalNumber = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  z.coerce.number("Informe um número válido.").finite().nullable(),
);

const metricFieldsSchema = z
  .object({
    clientId: z.uuid(),
    name: z.string().trim().min(2, "Informe o nome da métrica.").max(120),
    category: z.string().trim().max(100).transform((value) => value || null),
    unitId: z.uuid("Selecione uma unidade."),
    direction: z.enum(["INCREASE", "DECREASE", "NEUTRAL"]),
    baselineValue: optionalNumber,
    baselineDate: z.iso.date().or(z.literal("")).transform((value) => value || null),
    featured: z.boolean(),
  })
  .superRefine((data, context) => {
    if ((data.baselineValue == null) !== (data.baselineDate == null)) {
      context.addIssue({
        code: "custom",
        path: [data.baselineValue == null ? "baselineValue" : "baselineDate"],
        message: "Informe o valor e a data do ponto de partida.",
      });
    }
  });

const updateMetricSchema = metricFieldsSchema.and(
  z.object({ metricId: z.uuid() }),
);

export async function createMetricAction(
  _previousState: MetricActionState,
  formData: FormData,
): Promise<MetricActionState> {
  const profile = await requireAdmin();
  const parsed = metricFieldsSchema.safeParse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    category: formData.get("category"),
    unitId: formData.get("unitId"),
    direction: formData.get("direction"),
    baselineValue: formData.get("baselineValue"),
    baselineDate: formData.get("baselineDate"),
    featured: formData.get("featured") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("metrics").insert({
    client_id: parsed.data.clientId,
    name: parsed.data.name,
    category: parsed.data.category,
    unit_id: parsed.data.unitId,
    default_direction: parsed.data.direction,
    baseline_value: parsed.data.baselineValue,
    baseline_date: parsed.data.baselineDate,
    featured: parsed.data.featured,
    created_by: profile.id,
  });

  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "Já existe uma métrica ativa com este nome."
          : "Não foi possível criar a métrica.",
      fieldErrors:
        error.code === "23505"
          ? { name: ["Escolha outro nome."] }
          : undefined,
    };
  }

  revalidatePath(`/clients/${parsed.data.clientId}/metrics`);
  revalidatePath(`/clients/${parsed.data.clientId}/overview`);
  return { status: "success", message: "Métrica criada com sucesso." };
}

export async function updateMetricAction(
  _previousState: MetricActionState,
  formData: FormData,
): Promise<MetricActionState> {
  await requireAdmin();
  const parsed = updateMetricSchema.safeParse({
    clientId: formData.get("clientId"),
    metricId: formData.get("metricId"),
    name: formData.get("name"),
    category: formData.get("category"),
    unitId: formData.get("unitId"),
    direction: formData.get("direction"),
    baselineValue: formData.get("baselineValue"),
    baselineDate: formData.get("baselineDate"),
    featured: formData.get("featured") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("metrics")
    .update({
      name: parsed.data.name,
      category: parsed.data.category,
      unit_id: parsed.data.unitId,
      default_direction: parsed.data.direction,
      baseline_value: parsed.data.baselineValue,
      baseline_date: parsed.data.baselineDate,
      featured: parsed.data.featured,
    })
    .eq("id", parsed.data.metricId)
    .eq("client_id", parsed.data.clientId)
    .is("archived_at", null);

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Já existe uma métrica ativa com este nome." : "Não foi possível atualizar a métrica.",
      fieldErrors: error.code === "23505" ? { name: ["Escolha outro nome."] } : undefined,
    };
  }
  revalidatePath(`/clients/${parsed.data.clientId}/metrics`);
  revalidatePath(`/clients/${parsed.data.clientId}/goals`);
  revalidatePath(`/clients/${parsed.data.clientId}/overview`);
  return { status: "success", message: "Métrica atualizada." };
}

export async function archiveMetricAction(clientId: string, metricId: string) {
  await requireAdmin();
  const parsed = z.object({ clientId: z.uuid(), metricId: z.uuid() }).safeParse({ clientId, metricId });
  if (!parsed.success) return { ok: false, message: "Métrica inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("metrics")
    .update({ archived_at: new Date().toISOString(), featured: false })
    .eq("id", parsed.data.metricId)
    .eq("client_id", parsed.data.clientId)
    .is("archived_at", null);
  if (error) return { ok: false, message: "Não foi possível excluir a métrica." };

  revalidatePath(`/clients/${parsed.data.clientId}/metrics`);
  revalidatePath(`/clients/${parsed.data.clientId}/goals`);
  revalidatePath(`/clients/${parsed.data.clientId}/overview`);
  return { ok: true, message: "Métrica arquivada." };
}

const addEntrySchema = z.object({
  clientId: z.uuid(),
  metricId: z.uuid(),
  value: z.coerce.number("Informe um valor válido.").finite(),
  observedAt: z.iso.date("Informe a data da medição."),
  source: z.string().trim().max(120).transform((value) => value || null),
  notes: z.string().trim().max(1000).transform((value) => value || null),
});

export async function addMetricEntryAction(
  _previousState: MetricActionState,
  formData: FormData,
): Promise<MetricActionState> {
  const profile = await requireCurrentProfile();
  const parsed = addEntrySchema.safeParse({
    clientId: formData.get("clientId"),
    metricId: formData.get("metricId"),
    value: formData.get("value"),
    observedAt: formData.get("observedAt"),
    source: formData.get("source"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados da medição.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: metric } = await supabase
    .from("metrics")
    .select("id, client_id")
    .eq("id", parsed.data.metricId)
    .eq("client_id", parsed.data.clientId)
    .is("archived_at", null)
    .maybeSingle();

  if (!metric) {
    return { status: "error", message: "Métrica não encontrada." };
  }

  const { error } = await supabase.from("metric_entries").insert({
    metric_id: metric.id,
    value: parsed.data.value,
    observed_at: parsed.data.observedAt,
    source: parsed.data.source,
    notes: parsed.data.notes,
    created_by: profile.id,
  });

  if (error) {
    return {
      status: "error",
      message:
        error.code === "42501"
          ? "Você não possui permissão para atualizar esta métrica."
          : "Não foi possível registrar a medição.",
    };
  }

  revalidatePath(`/clients/${parsed.data.clientId}/metrics`);
  revalidatePath(`/clients/${parsed.data.clientId}/goals`);
  revalidatePath(`/clients/${parsed.data.clientId}/overview`);
  return { status: "success", message: "Medição registrada." };
}
