"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createServiceAction,
  updateServiceAction,
} from "@/features/services/actions";
import { initialServiceActionState } from "@/features/services/service-state";

function Message({ status, message }: { status: string; message: string }) {
  if (!message) return null;
  return <p role={status === "error" ? "alert" : "status"} className={status === "error" ? "text-xs text-destructive" : "text-xs text-status-healthy"}>{message}</p>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function CreateServiceForm() {
  const [state, action, pending] = useActionState(createServiceAction, initialServiceActionState);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="new-service-name" className="text-sm font-medium text-text-primary">Nome</label>
        <Input id="new-service-name" name="name" aria-invalid={Boolean(state.fieldErrors?.name)} required />
        <FieldError message={state.fieldErrors?.name?.[0]} />
      </div>
      <div className="space-y-2">
        <label htmlFor="new-service-description" className="text-sm font-medium text-text-primary">Descrição</label>
        <Textarea id="new-service-description" name="description" className="min-h-24" maxLength={500} />
        <FieldError message={state.fieldErrors?.description?.[0]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="new-service-order" className="text-sm font-medium text-text-primary">Ordem</label>
          <Input id="new-service-order" name="sortOrder" type="number" min={0} max={9999} defaultValue={100} />
          <FieldError message={state.fieldErrors?.sortOrder?.[0]} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-text-secondary">
          <input type="checkbox" name="active" defaultChecked className="size-4 accent-compass-purple" />
          Disponível para uso
        </label>
      </div>
      <Message status={state.status} message={state.message} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
        {pending ? "Criando..." : "Criar serviço"}
      </Button>
    </form>
  );
}

export function EditServiceForm({ service }: { service: { id: string; name: string; description: string | null; sortOrder: number; active: boolean } }) {
  const actionWithId = updateServiceAction.bind(null, service.id);
  const [state, action, pending] = useActionState(actionWithId, initialServiceActionState);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
        <div className="space-y-2">
          <label htmlFor={`service-name-${service.id}`} className="text-sm font-medium text-text-primary">Nome</label>
          <Input id={`service-name-${service.id}`} name="name" defaultValue={service.name} aria-invalid={Boolean(state.fieldErrors?.name)} required />
          <FieldError message={state.fieldErrors?.name?.[0]} />
        </div>
        <div className="space-y-2">
          <label htmlFor={`service-order-${service.id}`} className="text-sm font-medium text-text-primary">Ordem</label>
          <Input id={`service-order-${service.id}`} name="sortOrder" type="number" min={0} max={9999} defaultValue={service.sortOrder} />
          <FieldError message={state.fieldErrors?.sortOrder?.[0]} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor={`service-description-${service.id}`} className="text-sm font-medium text-text-primary">Descrição</label>
        <Textarea id={`service-description-${service.id}`} name="description" defaultValue={service.description ?? ""} className="min-h-20" maxLength={500} />
        <FieldError message={state.fieldErrors?.description?.[0]} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" name="active" defaultChecked={service.active} className="size-4 accent-compass-purple" />
          Disponível para novos cadastros
        </label>
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      <Message status={state.status} message={state.message} />
    </form>
  );
}
