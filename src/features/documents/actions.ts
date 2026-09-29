"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin, requireCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DocumentActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const documentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do documento.").max(180, "Use no máximo 180 caracteres."),
  category: z.enum(["CONTRACT", "BRIEFING", "PLANNING", "REPORT", "CLIENT_MATERIAL", "OTHER"]),
  contractId: z.uuid().or(z.literal("")).transform((value) => value || null),
}).superRefine((data, context) => {
  if (data.category === "CONTRACT" && !data.contractId) {
    context.addIssue({ code: "custom", path: ["contractId"], message: "Selecione o contrato relacionado." });
  }
});

export async function updateDocumentAction(
  clientId: string,
  documentId: string,
  _previousState: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const profile = await requireCurrentProfile();
  const ids = z.object({ clientId: z.uuid(), documentId: z.uuid() }).safeParse({ clientId, documentId });
  if (!ids.success) return { status: "error", message: "Documento inválido." };

  const parsed = documentSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    contractId: formData.get("contractId"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: document } = await supabase
    .from("documents")
    .select("id, client_id, category")
    .eq("id", ids.data.documentId)
    .eq("client_id", ids.data.clientId)
    .maybeSingle();
  if (!document) {
    return { status: "error", message: "Documento não encontrado ou acesso não autorizado." };
  }

  if (profile.role !== "ADMIN") {
    if (document.category === "CONTRACT" || parsed.data.category === "CONTRACT") {
      return { status: "error", message: "Somente administradores podem alterar contratos." };
    }
    const { data: membership } = await supabase
      .from("client_members")
      .select("id")
      .eq("client_id", ids.data.clientId)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!membership) {
      return { status: "error", message: "Você não faz parte da equipe deste cliente." };
    }
  }

  if (parsed.data.category === "CONTRACT") {
    const { data: contract } = await supabase
      .from("contracts")
      .select("id")
      .eq("id", parsed.data.contractId!)
      .eq("client_id", ids.data.clientId)
      .maybeSingle();
    if (!contract) {
      return {
        status: "error",
        message: "O contrato selecionado não pertence a este cliente.",
        fieldErrors: { contractId: ["Selecione um contrato válido."] },
      };
    }
  }

  const { error } = await supabase
    .from("documents")
    .update({
      name: parsed.data.name,
      category: parsed.data.category,
      contract_id: parsed.data.category === "CONTRACT" ? parsed.data.contractId : null,
    })
    .eq("id", ids.data.documentId)
    .eq("client_id", ids.data.clientId);
  if (error) {
    return { status: "error", message: "Não foi possível atualizar o documento." };
  }

  revalidatePath(`/clients/${ids.data.clientId}/documents`);
  return { status: "success", message: "Documento atualizado." };
}

export async function deleteDocumentAction(clientId: string, documentId: string) {
  await requireAdmin();
  const ids = z.object({ clientId: z.uuid(), documentId: z.uuid() }).safeParse({ clientId, documentId });
  if (!ids.success) return { ok: false, message: "Documento inválido." };

  const admin = createAdminClient();
  const { data: document, error: readError } = await admin
    .from("documents")
    .select("id, storage_bucket, storage_path")
    .eq("id", ids.data.documentId)
    .eq("client_id", ids.data.clientId)
    .maybeSingle();
  if (readError || !document) {
    return { ok: false, message: "Documento não encontrado." };
  }

  const { error: storageError } = await admin.storage
    .from(document.storage_bucket)
    .remove([document.storage_path]);
  if (storageError) {
    return { ok: false, message: "Não foi possível remover o arquivo do armazenamento." };
  }

  const { error: documentError } = await admin
    .from("documents")
    .delete()
    .eq("id", document.id);
  if (documentError) {
    return { ok: false, message: "O arquivo foi removido, mas o registro precisa ser revisado." };
  }

  revalidatePath(`/clients/${ids.data.clientId}/documents`);
  return { ok: true, message: "Documento excluído." };
}
