import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-compass-purple-light">
        Recuperação de acesso
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
        Redefina sua senha
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Enviaremos as instruções para o e-mail vinculado à sua conta.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
