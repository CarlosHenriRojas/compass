"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type AddClientMemberState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const addMemberSchema = z.object({
  clientId: z.uuid(),
  userId: z.uuid("Selecione uma pessoa."),
  responsibility: z
    .string()
    .trim()
    .max(120, "Use no máximo 120 caracteres.")
    .transform((value) => value || null),
});

export async function addClientMemberAction(
  _previousState: AddClientMemberState,
  formData: FormData,
): Promise<AddClientMemberState> {
  await requireAdmin();
  const parsed = addMemberSchema.safeParse({
    clientId: formData.get("clientId"),
    userId: formData.get("userId"),
    responsibility: formData.get("responsibility"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", parsed.data.userId)
    .eq("active", true)
    .maybeSingle();

  if (!profile) {
    return {
      status: "error",
      message: "O usuário selecionado não está disponível.",
      fieldErrors: { userId: ["Selecione um usuário ativo."] },
    };
  }

  const { error } = await supabase.from("client_members").insert({
    client_id: parsed.data.clientId,
    user_id: parsed.data.userId,
    responsibility: parsed.data.responsibility,
    is_primary: false,
  });

  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "Esta pessoa já faz parte da equipe do cliente."
          : "Não foi possível adicionar o responsável.",
      fieldErrors:
        error.code === "23505"
          ? { userId: ["Selecione outra pessoa."] }
          : undefined,
    };
  }

  revalidatePath(`/clients/${parsed.data.clientId}/overview`);
  revalidatePath("/clients");
  return { status: "success", message: "Responsável adicionado." };
}

export async function removeClientMemberAction(
  clientId: string,
  memberId: string,
): Promise<void> {
  await requireAdmin();
  const ids = z
    .object({ clientId: z.uuid(), memberId: z.uuid() })
    .safeParse({ clientId, memberId });
  if (!ids.success) return;

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("client_members")
    .select("id, is_primary")
    .eq("id", memberId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!member || member.is_primary) return;

  await supabase.from("client_members").delete().eq("id", member.id);
  revalidatePath(`/clients/${clientId}/overview`);
  revalidatePath("/clients");
}
