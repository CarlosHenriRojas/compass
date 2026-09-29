"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { updateUserAccessAction } from "@/features/users/actions";

const selectClassName =
  "h-9 rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-xs text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-55";

export function UserAccessControls({
  userId,
  initialRole,
  initialActive,
  isCurrentUser,
}: {
  userId: string;
  initialRole: "ADMIN" | "COLLABORATOR";
  initialActive: boolean;
  isCurrentUser: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [active, setActive] = useState(initialActive);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();
  const changed = role !== initialRole || active !== initialActive;

  function save() {
    if (
      !active &&
      initialActive &&
      !window.confirm(
        "Desativar este acesso? A pessoa deixará de conseguir entrar no Compass Hub.",
      )
    ) {
      return;
    }

    setMessage("");
    startTransition(async () => {
      const result = await updateUserAccessAction(userId, role, active);
      setMessage(result.message);
      setIsError(!result.ok);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          aria-label="Perfil de acesso"
          value={role}
          onChange={(event) =>
            setRole(event.target.value as "ADMIN" | "COLLABORATOR")
          }
          className={selectClassName}
          disabled={pending || isCurrentUser}
        >
          <option value="COLLABORATOR">Colaborador</option>
          <option value="ADMIN">Administrador</option>
        </select>
        <label className="flex h-9 items-center gap-2 rounded-xl border border-border bg-background-elevated/45 px-3 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            disabled={pending || isCurrentUser}
            className="size-4 accent-compass-purple"
          />
          Ativo
        </label>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={save}
          disabled={pending || !changed || isCurrentUser}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          Salvar
        </Button>
      </div>
      {isCurrentUser ? (
        <p className="text-[0.68rem] text-muted-foreground">
          Seu próprio acesso está protegido.
        </p>
      ) : null}
      {message ? (
        <p
          role={isError ? "alert" : "status"}
          className={isError ? "text-xs text-destructive" : "text-xs text-status-healthy"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
