"use client";

import {
  startTransition,
  type FormEvent,
  useActionState,
  useEffect,
  useRef,
  useTransition,
} from "react";
import { LoaderCircle, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addClientMemberAction,
  removeClientMemberAction,
} from "@/features/clients/member-actions";
import { initialAddClientMemberState } from "@/features/clients/member-state";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive/70";

export function AddClientMemberForm({
  clientId,
  profiles,
}: {
  clientId: string;
  profiles: Array<{ id: string; fullName: string }>;
}) {
  const [state, dispatchAction, pending] = useActionState(
    addClientMemberAction,
    initialAddClientMemberState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatchAction(formData));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-4" noValidate>
      <input type="hidden" name="clientId" value={clientId} />
      <p className="flex items-center gap-2 text-sm font-semibold text-text-primary"><UserPlus className="size-4 text-compass-purple-light" aria-hidden="true" />Adicionar responsável</p>
      <select name="userId" defaultValue="" className={selectClassName} aria-invalid={Boolean(state.fieldErrors?.userId)} required>
        <option value="" disabled>Selecione uma pessoa</option>
        {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.fullName}</option>)}
      </select>
      <Input name="responsibility" placeholder="Função no cliente (opcional)" maxLength={120} />
      {state.message ? <p className={cn("text-xs", state.status === "error" ? "text-destructive" : "text-status-healthy")}>{state.message}</p> : null}
      <Button type="submit" variant="secondary" className="w-full" disabled={pending || profiles.length === 0}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
        Adicionar à equipe
      </Button>
    </form>
  );
}

export function RemoveClientMemberButton({
  clientId,
  memberId,
  memberName,
}: {
  clientId: string;
  memberId: string;
  memberName: string;
}) {
  const [pending, startRemoval] = useTransition();

  function removeMember() {
    if (!window.confirm(`Remover ${memberName} da equipe deste cliente?`)) return;
    startRemoval(async () => {
      await removeClientMemberAction(clientId, memberId);
    });
  }

  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={removeMember} disabled={pending} aria-label={`Remover ${memberName}`}>
      {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
    </Button>
  );
}
