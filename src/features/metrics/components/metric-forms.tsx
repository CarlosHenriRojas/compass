"use client";

import {
  startTransition,
  type FormEvent,
  type ReactNode,
  useActionState,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, LoaderCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addMetricEntryAction,
  createMetricAction,
  updateMetricAction,
} from "@/features/metrics/actions";
import { EntityDeleteButton } from "@/components/shared/entity-delete-button";
import { initialMetricActionState } from "@/features/metrics/metric-state";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive/70";

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-text-primary">{label}</label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function ActionMessage({ status, message }: { status: string; message: string }) {
  if (!message) return null;
  const success = status === "success";
  return (
    <div role={success ? "status" : "alert"} className={cn("flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm", success ? "border-status-healthy/25 bg-status-healthy/8 text-status-healthy" : "border-status-critical/25 bg-status-critical/8 text-status-critical")}>
      {success ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <span>{message}</span>
    </div>
  );
}

export function CreateMetricForm({
  clientId,
  units,
}: {
  clientId: string;
  units: Array<{ id: string; name: string; symbol: string }>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatchAction, pending] = useActionState(
    createMetricAction,
    initialMetricActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state]);

  const error = (field: string) => state.fieldErrors?.[field]?.[0];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatchAction(data));
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-4" noValidate>
      <input type="hidden" name="clientId" value={clientId} />
      <Field label="Nome da métrica" name="metricName" error={error("name")}>
        <Input id="metricName" name="name" placeholder="Ex.: Leads mensais" aria-invalid={Boolean(error("name"))} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Field label="Categoria" name="metricCategory" error={error("category")}>
          <Input id="metricCategory" name="category" placeholder="Ex.: Tráfego" aria-invalid={Boolean(error("category"))} />
        </Field>
        <Field label="Unidade" name="unitId" error={error("unitId")}>
          <select id="unitId" name="unitId" defaultValue="" className={fieldClassName} aria-invalid={Boolean(error("unitId"))} required>
            <option value="" disabled>Selecione</option>
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}{unit.symbol ? ` (${unit.symbol})` : ""}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Direção esperada" name="direction" error={error("direction")}>
        <select id="direction" name="direction" defaultValue="NEUTRAL" className={fieldClassName}>
          <option value="INCREASE">Aumentar</option>
          <option value="DECREASE">Diminuir</option>
          <option value="NEUTRAL">Apenas acompanhar</option>
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Field label="Valor inicial" name="baselineValue" error={error("baselineValue")}>
          <Input id="baselineValue" name="baselineValue" type="number" step="any" aria-invalid={Boolean(error("baselineValue"))} />
        </Field>
        <Field label="Data inicial" name="baselineDate" error={error("baselineDate")}>
          <Input id="baselineDate" name="baselineDate" type="date" aria-invalid={Boolean(error("baselineDate"))} />
        </Field>
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm text-text-primary">
        <input type="checkbox" name="featured" className="size-4 accent-compass-purple" />
        Destacar na visão geral
      </label>
      <ActionMessage status={state.status} message={state.message} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
        Criar métrica
      </Button>
    </form>
  );
}

export function AddMetricEntryForm({
  clientId,
  metricId,
  defaultDate,
}: {
  clientId: string;
  metricId: string;
  defaultDate: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatchAction, pending] = useActionState(
    addMetricEntryAction,
    initialMetricActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state]);

  const error = (field: string) => state.fieldErrors?.[field]?.[0];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatchAction(data));
  }

  return (
    <details className="group border-t border-border pt-4">
      <summary className="cursor-pointer list-none text-sm font-semibold text-compass-purple-light transition-colors hover:text-foreground">
        + Registrar nova medição
      </summary>
      <form ref={formRef} onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="metricId" value={metricId} />
        <Field label="Valor" name={`value-${metricId}`} error={error("value")}>
          <Input id={`value-${metricId}`} name="value" type="number" step="any" aria-invalid={Boolean(error("value"))} required />
        </Field>
        <Field label="Data" name={`observed-${metricId}`} error={error("observedAt")}>
          <Input id={`observed-${metricId}`} name="observedAt" type="date" defaultValue={defaultDate} aria-invalid={Boolean(error("observedAt"))} required />
        </Field>
        <Field label="Fonte" name={`source-${metricId}`} error={error("source")}>
          <Input id={`source-${metricId}`} name="source" placeholder="Ex.: Meta Ads" aria-invalid={Boolean(error("source"))} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Observação" name={`notes-${metricId}`} error={error("notes")}>
            <Textarea id={`notes-${metricId}`} name="notes" className="min-h-20" aria-invalid={Boolean(error("notes"))} />
          </Field>
        </div>
        <div className="sm:col-span-2"><ActionMessage status={state.status} message={state.message} /></div>
        <Button type="submit" variant="secondary" className="sm:col-span-2" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
          Salvar medição
        </Button>
      </form>
    </details>
  );
}

export function EditMetricForm({
  clientId,
  metric,
  units,
}: {
  clientId: string;
  metric: {
    id: string;
    name: string;
    category: string | null;
    unitId: string;
    direction: "INCREASE" | "DECREASE" | "NEUTRAL";
    baselineValue: number | null;
    baselineDate: string | null;
    featured: boolean;
  };
  units: Array<{ id: string; name: string; symbol: string }>;
}) {
  const router = useRouter();
  const [state, dispatchAction, pending] = useActionState(updateMetricAction, initialMetricActionState);
  useEffect(() => { if (state.status === "success") router.refresh(); }, [router, state]);
  const error = (field: string) => state.fieldErrors?.[field]?.[0];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatchAction(data));
  }
  const prefix = `edit-metric-${metric.id}`;

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="metricId" value={metric.id} />
        <Field label="Nome" name={`${prefix}-name`} error={error("name")}>
          <Input id={`${prefix}-name`} name="name" defaultValue={metric.name} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoria" name={`${prefix}-category`} error={error("category")}>
            <Input id={`${prefix}-category`} name="category" defaultValue={metric.category ?? ""} />
          </Field>
          <Field label="Unidade" name={`${prefix}-unit`} error={error("unitId")}>
            <select id={`${prefix}-unit`} name="unitId" defaultValue={metric.unitId} className={fieldClassName}>
              {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}{unit.symbol ? ` (${unit.symbol})` : ""}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Direção esperada" name={`${prefix}-direction`} error={error("direction")}>
          <select id={`${prefix}-direction`} name="direction" defaultValue={metric.direction} className={fieldClassName}>
            <option value="INCREASE">Aumentar</option><option value="DECREASE">Diminuir</option><option value="NEUTRAL">Apenas acompanhar</option>
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor inicial" name={`${prefix}-baseline`} error={error("baselineValue")}>
            <Input id={`${prefix}-baseline`} name="baselineValue" type="number" step="any" defaultValue={metric.baselineValue ?? ""} />
          </Field>
          <Field label="Data inicial" name={`${prefix}-date`} error={error("baselineDate")}>
            <Input id={`${prefix}-date`} name="baselineDate" type="date" defaultValue={metric.baselineDate ?? ""} />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-text-primary"><input type="checkbox" name="featured" defaultChecked={metric.featured} className="size-4 accent-compass-purple" />Destacar na visão geral</label>
        <ActionMessage status={state.status} message={state.message} />
        <Button type="submit" variant="secondary" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}Salvar alterações</Button>
      </form>
      <div className="border-t border-border pt-4">
        <EntityDeleteButton kind="metric" clientId={clientId} entityId={metric.id} label={`a métrica “${metric.name}”`} />
        <p className="mt-2 text-xs leading-5 text-muted-foreground">O histórico será preservado, mas a métrica deixará de aparecer como ativa.</p>
      </div>
    </div>
  );
}
