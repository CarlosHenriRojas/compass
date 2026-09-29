"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteUserAction } from "@/features/users/actions";
import { initialInviteUserState } from "@/features/users/user-state";

export function InviteUserForm() {
  const [state, formAction, pending] = useActionState(
    inviteUserAction,
    initialInviteUserState,
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <label htmlFor="fullName" className="text-sm font-medium text-text-primary">
          Nome completo
        </label>
        <Input
          id="fullName"
          name="fullName"
          placeholder="Nome do colaborador"
          aria-invalid={Boolean(state.fieldErrors?.fullName)}
          required
        />
        {state.fieldErrors?.fullName?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.fullName[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="inviteEmail" className="text-sm font-medium text-text-primary">
          E-mail
        </label>
        <Input
          id="inviteEmail"
          name="email"
          type="email"
          placeholder="nome@compassagencia.com.br"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="text-sm font-medium text-text-primary">
          Perfil
        </label>
        <select
          id="role"
          name="role"
          defaultValue="COLLABORATOR"
          className="h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] outline-none transition-[background-color,border-color,box-shadow] duration-200 hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20"
        >
          <option value="COLLABORATOR">Colaborador</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "text-sm text-status-healthy sm:col-span-2"
              : "text-sm text-destructive sm:col-span-2"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Enviando..." : "Enviar convite"}
        </Button>
      </div>
    </form>
  );
}
