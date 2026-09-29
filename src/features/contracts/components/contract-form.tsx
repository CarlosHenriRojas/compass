"use client";

import {
  startTransition,
  type FormEvent,
  useActionState,
  useEffect,
  useRef,
} from "react";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveContractAction } from "@/features/contracts/actions";
import { initialContractActionState } from "@/features/contracts/contract-state";
import { cn } from "@/lib/utils";

type ContractFormValues = {
  id: string | null;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "IN_RENEWAL" | "ENDED" | "PAUSED";
  automaticRenewal: boolean;
  monthlyValue: number | null;
  billingDay: number | null;
  scopeIncluded: string;
  scopeExcluded: string;
};

const selectClassName =
  "h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-[color,border-color,box-shadow] hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive/70 aria-invalid:ring-3 aria-invalid:ring-destructive/15";

function Field({
  label,
  name,
  error,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-text-primary">
        {label}
        {required ? <span className="ml-1 text-compass-purple-light">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function ContractForm({
  clientId,
  values,
}: {
  clientId: string;
  values: ContractFormValues;
}) {
  const [state, dispatchAction, pending] = useActionState(
    saveContractAction,
    initialContractActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "error") return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [state]);

  const error = (field: string) => state.fieldErrors?.[field]?.[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatchAction(formData));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="contractId" value={values.id ?? ""} />

      {state.message ? (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "flex gap-2.5 rounded-xl border px-4 py-3 text-sm",
            state.status === "success"
              ? "border-status-healthy/25 bg-status-healthy/8 text-status-healthy"
              : "border-status-critical/25 bg-status-critical/8 text-status-critical",
          )}
        >
          {state.status === "success" ? (
            <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <span>{state.message}</span>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Data de início" name="startDate" error={error("startDate")} required>
          <Input id="startDate" name="startDate" type="date" defaultValue={values.startDate} aria-invalid={Boolean(error("startDate"))} required />
        </Field>
        <Field label="Data de término" name="endDate" error={error("endDate")}>
          <Input id="endDate" name="endDate" type="date" defaultValue={values.endDate} aria-invalid={Boolean(error("endDate"))} />
        </Field>
        <Field label="Status do contrato" name="status" error={error("status")} required>
          <select id="status" name="status" defaultValue={values.status} className={selectClassName} aria-invalid={Boolean(error("status"))}>
            <option value="ACTIVE">Ativo</option>
            <option value="IN_RENEWAL">Em renovação</option>
            <option value="PAUSED">Pausado</option>
            <option value="ENDED">Encerrado</option>
          </select>
        </Field>
        <div className="flex items-end pb-2">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-text-primary">
            <input type="checkbox" name="automaticRenewal" defaultChecked={values.automaticRenewal} className="size-4 accent-compass-purple" />
            Renovação automática
          </label>
        </div>
        <Field label="Valor mensal" name="monthlyValue" error={error("monthlyValue")} required>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">R$</span>
            <Input id="monthlyValue" name="monthlyValue" type="number" min="0" step="0.01" defaultValue={values.monthlyValue ?? ""} className="pl-10" aria-invalid={Boolean(error("monthlyValue"))} required />
          </div>
        </Field>
        <Field label="Dia de vencimento" name="billingDay" error={error("billingDay")} required>
          <Input id="billingDay" name="billingDay" type="number" min="1" max="31" defaultValue={values.billingDay ?? ""} aria-invalid={Boolean(error("billingDay"))} required />
        </Field>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="O que fazemos" name="scopeIncluded" error={error("scopeIncluded")}>
          <Textarea id="scopeIncluded" name="scopeIncluded" defaultValue={values.scopeIncluded} className="min-h-36" placeholder="Descreva o escopo incluído no contrato..." aria-invalid={Boolean(error("scopeIncluded"))} />
        </Field>
        <Field label="O que não fazemos" name="scopeExcluded" error={error("scopeExcluded")}>
          <Textarea id="scopeExcluded" name="scopeExcluded" defaultValue={values.scopeExcluded} className="min-h-36" placeholder="Deixe explícito o que está fora do contrato..." aria-invalid={Boolean(error("scopeExcluded"))} />
        </Field>
      </div>

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          {pending ? "Salvando..." : values.id ? "Salvar alterações" : "Cadastrar contrato"}
        </Button>
      </div>
    </form>
  );
}
