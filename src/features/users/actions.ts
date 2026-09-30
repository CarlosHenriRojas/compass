"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export type InviteUserState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Partial<Record<"fullName" | "email" | "role", string[]>>;
};

const inviteUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Informe o nome completo.")
    .max(120, "O nome é muito longo."),
  email: z.string().trim().email("Informe um e-mail válido."),
  role: z.enum(["ADMIN", "COLLABORATOR"]),
});

export async function inviteUserAction(
  _previousState: InviteUserState,
  formData: FormData,
): Promise<InviteUserState> {
  await requireAdmin();

  const parsed = inviteUserSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const admin = createAdminClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3030";
    const { data, error } = await admin.auth.admin.inviteUserByEmail(
      parsed.data.email,
      {
        data: { full_name: parsed.data.fullName },
        redirectTo: `${siteUrl}/update-password`,
      },
    );

    if (error || !data.user) {
      return {
        status: "error",
        message:
          error?.code === "email_exists"
            ? "Já existe um usuário com este e-mail."
            : "Não foi possível enviar o convite. Tente novamente.",
      };
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: parsed.data.fullName,
        role: parsed.data.role,
        active: true,
      })
      .eq("id", data.user.id);

    if (profileError) {
      return {
        status: "error",
        message:
          "O convite foi enviado, mas o perfil precisa ser revisado no Supabase.",
      };
    }

    revalidatePath("/settings/users");

    return {
      status: "success",
      message: "Convite enviado com sucesso.",
    };
  } catch {
    return {
      status: "error",
      message:
        "A chave secreta do Supabase ainda não está configurada no servidor.",
    };
  }
}

const updateAccessSchema = z.object({
  userId: z.uuid(),
  role: z.enum(["ADMIN", "COLLABORATOR"]),
  active: z.boolean(),
});

export async function updateUserAccessAction(
  userId: string,
  role: "ADMIN" | "COLLABORATOR",
  active: boolean,
) {
  const currentProfile = await requireAdmin();
  const parsed = updateAccessSchema.safeParse({ userId, role, active });
  if (!parsed.success) {
    return { ok: false, message: "Dados de acesso inválidos." };
  }

  if (
    parsed.data.userId === currentProfile.id &&
    (!parsed.data.active || parsed.data.role !== "ADMIN")
  ) {
    return {
      ok: false,
      message: "Você não pode remover o próprio acesso de administrador.",
    };
  }

  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id, role, active")
    .eq("id", parsed.data.userId)
    .maybeSingle();
  if (targetError || !target) {
    return { ok: false, message: "Usuário não encontrado." };
  }

  const removesActiveAdmin =
    target.role === "ADMIN" &&
    target.active &&
    (!parsed.data.active || parsed.data.role !== "ADMIN");
  if (removesActiveAdmin) {
    const { count, error: countError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "ADMIN")
      .eq("active", true);
    if (countError || (count ?? 0) <= 1) {
      return {
        ok: false,
        message: "O sistema precisa manter pelo menos um administrador ativo.",
      };
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: parsed.data.role, active: parsed.data.active })
    .eq("id", parsed.data.userId);
  if (error) {
    return { ok: false, message: "Não foi possível atualizar este acesso." };
  }

  revalidatePath("/settings/users");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { ok: true, message: "Acesso atualizado." };
}
