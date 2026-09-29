"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initialAuthState } from "@/features/auth/auth-state";
import { FormMessage } from "@/features/auth/components/form-message";
import { createClient } from "@/lib/supabase/client";

const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export function UpdatePasswordForm() {
  const [state, setState] = useState(initialAuthState);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const parsed = updatePasswordSchema.safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      setState({
        status: "error",
        message: "Revise os campos destacados.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    setPending(true);
    setState(initialAuthState);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      setState({
        status: "error",
        message:
          "A sessão de recuperação expirou. Solicite um novo link e tente novamente.",
      });
      setPending(false);
      return;
    }

    window.location.replace("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-text-primary">
          Nova senha
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          required
        />
        {state.fieldErrors?.password?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-text-primary">
          Confirmar nova senha
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          required
        />
        {state.fieldErrors?.confirmPassword?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.confirmPassword[0]}
          </p>
        ) : null}
      </div>

      <FormMessage state={state} />
      <Button
        type="submit"
        size="lg"
        className="h-10 w-full"
        disabled={pending}
      >
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : null}
        Salvar nova senha
      </Button>
    </form>
  );
}
