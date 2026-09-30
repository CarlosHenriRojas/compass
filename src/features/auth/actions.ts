"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { AuthActionState } from "@/features/auth/auth-state";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email("Informe um e-mail válido.");
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha."),
});

function safeInternalPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "invalid_credentials") {
      return {
        status: "error",
        message: "E-mail ou senha incorretos.",
      };
    }

    console.error("Falha no login do Supabase.", {
      name: error.name,
      code: error.code,
      status: error.status,
      message: error.message,
    });

    return {
      status: "error",
      message:
        "Não foi possível conectar ao serviço de autenticação. Tente novamente.",
    };
  }

  redirect(safeInternalPath(formData.get("next")));
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Informe um e-mail válido.",
      fieldErrors: { email: parsed.error.flatten().formErrors },
    };
  }

  const requestHeaders = await headers();
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const origin =
    configuredSiteUrl ??
    requestHeaders.get("origin") ??
    "http://localhost:3030";
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

  if (error) {
    if (
      error.code === "over_email_send_rate_limit" ||
      error.status === 429
    ) {
      return {
        status: "error",
        message:
          "O limite de e-mails de recuperação foi atingido. Aguarde antes de solicitar outro link.",
      };
    }

    return {
      status: "error",
      message: "Não foi possível enviar o link agora. Tente novamente.",
    };
  }

  return {
    status: "success",
    message:
      "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
