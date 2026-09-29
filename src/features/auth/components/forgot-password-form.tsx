"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/features/auth/actions";
import { initialAuthState } from "@/features/auth/auth-state";
import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialAuthState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-text-primary">
          E-mail
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@compassagencia.com.br"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          required
        />
      </div>

      <FormMessage state={state} />
      <SubmitButton>Enviar link de recuperação</SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="font-medium text-compass-purple-light transition-colors hover:text-foreground"
        >
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
