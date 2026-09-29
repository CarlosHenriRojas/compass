"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ContractActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((value) => value || null);

const contractSchema = z
  .object({
    clientId: z.uuid(),
    contractId: z.uuid().or(z.literal("")).transform((value) => value || null),
    startDate: z.iso.date("Informe a data inicial."),
    endDate: z
      .iso
      .date("Informe uma data final válida.")
      .or(z.literal(""))
      .transform((value) => value || null),
    status: z.enum(["ACTIVE", "IN_RENEWAL", "ENDED", "PAUSED"]),
    automaticRenewal: z.boolean(),
    monthlyValue: z.coerce
      .number("Informe o valor mensal.")
      .min(0, "O valor não pode ser negativo.")
      .max(9999999999.99, "O valor informado é muito alto."),
    billingDay: z.coerce
      .number("Informe o dia de vencimento.")
      .int("Informe um dia inteiro.")
      .min(1, "O dia deve estar entre 1 e 31.")
      .max(31, "O dia deve estar entre 1 e 31."),
    scopeIncluded: optionalText(5000),
    scopeExcluded: optionalText(5000),
  })
  .superRefine((data, context) => {
    if (data.endDate && data.endDate < data.startDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "A data final não pode ser anterior à data inicial.",
      });
    }
  });

type DatabaseError = { code?: string };

export async function saveContractAction(
  _previousState: ContractActionState,
  formData: FormData,
): Promise<ContractActionState> {
  const currentProfile = await requireAdmin();
  const parsed = contractSchema.safeParse({
    clientId: formData.get("clientId"),
    contractId: formData.get("contractId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status"),
    automaticRenewal: formData.get("automaticRenewal") === "on",
    monthlyValue: formData.get("monthlyValue"),
    billingDay: formData.get("billingDay"),
    scopeIncluded: formData.get("scopeIncluded"),
    scopeExcluded: formData.get("scopeExcluded"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", parsed.data.clientId)
    .is("archived_at", null)
    .maybeSingle();

  if (!client) {
    return { status: "error", message: "Cliente não encontrado." };
  }

  let contractId = parsed.data.contractId;
  let createdContract = false;

  try {
    if (contractId) {
      const { data: existingContract } = await supabase
        .from("contracts")
        .select("id")
        .eq("id", contractId)
        .eq("client_id", parsed.data.clientId)
        .maybeSingle();

      if (!existingContract) {
        return {
          status: "error",
          message: "O contrato selecionado não pertence a este cliente.",
        };
      }

      const { error } = await supabase
        .from("contracts")
        .update({
          start_date: parsed.data.startDate,
          end_date: parsed.data.endDate,
          status: parsed.data.status,
          automatic_renewal: parsed.data.automaticRenewal,
          scope_included: parsed.data.scopeIncluded,
          scope_excluded: parsed.data.scopeExcluded,
        })
        .eq("id", contractId);
      if (error) throw error;
    } else {
      const { data: contract, error } = await supabase
        .from("contracts")
        .insert({
          client_id: parsed.data.clientId,
          start_date: parsed.data.startDate,
          end_date: parsed.data.endDate,
          status: parsed.data.status,
          automatic_renewal: parsed.data.automaticRenewal,
          scope_included: parsed.data.scopeIncluded,
          scope_excluded: parsed.data.scopeExcluded,
          created_by: currentProfile.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      contractId = contract.id;
      createdContract = true;
    }

    const { error: financialError } = await supabase
      .from("contract_financials")
      .upsert({
        contract_id: contractId,
        monthly_value: parsed.data.monthlyValue,
        billing_day: parsed.data.billingDay,
      });
    if (financialError) throw financialError;
  } catch (error) {
    if (createdContract && contractId) {
      await supabase.from("contracts").delete().eq("id", contractId);
    }

    const databaseError = error as DatabaseError;
    return {
      status: "error",
      message:
        databaseError.code === "23505"
          ? "Já existe um contrato ativo ou em renovação para este cliente."
          : "Não foi possível salvar o contrato. Tente novamente.",
      fieldErrors:
        databaseError.code === "23505"
          ? { status: ["Encerre ou pause o contrato atual antes de criar outro."] }
          : undefined,
    };
  }

  revalidatePath(`/clients/${parsed.data.clientId}/contract`);
  revalidatePath(`/clients/${parsed.data.clientId}/overview`);
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: parsed.data.contractId
      ? "Contrato atualizado com sucesso."
      : "Contrato cadastrado com sucesso.",
  };
}
