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
  createGoalAction,
  editGoalAction,
  updateGoalProgressAction,
} from "@/features/goals/actions";
import { EntityDeleteButton } from "@/components/shared/entity-delete-button";
import { initialGoalActionState } from "@/features/goals/goal-state";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive/70";

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: ReactNode }) {
  return <div className="space-y-2"><label htmlFor={name} className="text-sm font-medium text-text-primary">{label}</label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}

function Message({ status, message }: { status: string; message: string }) {
  if (!message) return null;
  const success = status === "success";
  return <div role={success ? "status" : "alert"} className={cn("flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm", success ? "border-status-healthy/25 bg-status-healthy/8 text-status-healthy" : "border-status-critical/25 bg-status-critical/8 text-status-critical")}>{success ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}<span>{message}</span></div>;
}

export function CreateGoalForm({ clientId, defaultDate, metrics, profiles }: { clientId: string; defaultDate: string; metrics: Array<{ id: string; name: string }>; profiles: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatchAction, pending] = useActionState(createGoalAction, initialGoalActionState);

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
      <Field label="Título" name="goalTitle" error={error("title")}><Input id="goalTitle" name="title" placeholder="Ex.: Aumentar geração de leads" aria-invalid={Boolean(error("title"))} required /></Field>
      <Field label="Descrição" name="goalDescription" error={error("description")}><Textarea id="goalDescription" name="description" className="min-h-20" aria-invalid={Boolean(error("description"))} /></Field>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Field label="Categoria" name="goalCategory" error={error("category")}><Input id="goalCategory" name="category" placeholder="Ex.: Tráfego" /></Field>
        <Field label="Direção" name="goalDirection" error={error("direction")}><select id="goalDirection" name="direction" defaultValue="INCREASE" className={selectClassName}><option value="INCREASE">Aumentar</option><option value="DECREASE">Diminuir</option></select></Field>
      </div>
      <Field label="Métrica relacionada" name="metricId" error={error("metricId")}><select id="metricId" name="metricId" defaultValue="" className={selectClassName}><option value="">Objetivo manual</option>{metrics.map((metric) => <option key={metric.id} value={metric.id}>{metric.name}</option>)}</select></Field>
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        <Field label="Valor inicial" name="initialValue" error={error("initialValue")}><Input id="initialValue" name="initialValue" type="number" step="any" aria-invalid={Boolean(error("initialValue"))} /></Field>
        <Field label="Valor meta" name="targetValue" error={error("targetValue")}><Input id="targetValue" name="targetValue" type="number" step="any" aria-invalid={Boolean(error("targetValue"))} /></Field>
        <Field label="Valor atual (manual)" name="manualCurrentValue" error={error("manualCurrentValue")}><Input id="manualCurrentValue" name="manualCurrentValue" type="number" step="any" aria-invalid={Boolean(error("manualCurrentValue"))} /></Field>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">Se houver uma métrica relacionada, o valor atual será lido automaticamente e o campo manual será ignorado.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Field label="Data inicial" name="goalStartDate" error={error("startDate")}><Input id="goalStartDate" name="startDate" type="date" defaultValue={defaultDate} aria-invalid={Boolean(error("startDate"))} required /></Field>
        <Field label="Prazo" name="deadline" error={error("deadline")}><Input id="deadline" name="deadline" type="date" aria-invalid={Boolean(error("deadline"))} /></Field>
      </div>
      <Field label="Responsável" name="responsibleUserId" error={error("responsibleUserId")}><select id="responsibleUserId" name="responsibleUserId" defaultValue="" className={selectClassName}><option value="">Não definido</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field>
      <Field label="Status" name="goalStatus" error={error("status")}><select id="goalStatus" name="status" defaultValue="NOT_STARTED" className={selectClassName}><option value="NOT_STARTED">Não iniciado</option><option value="IN_PROGRESS">Em andamento</option><option value="ACHIEVED">Atingido</option><option value="PAUSED">Pausado</option><option value="CANCELLED">Cancelado</option></select></Field>
      <Message status={state.status} message={state.message} />
      <Button type="submit" className="w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}Criar objetivo</Button>
    </form>
  );
}

export function GoalUpdateForm({ clientId, goalId, linkedMetric, currentValue, status }: { clientId: string; goalId: string; linkedMetric: boolean; currentValue: number | null; status: "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "PAUSED" | "CANCELLED" }) {
  const router = useRouter();
  const [state, dispatchAction, pending] = useActionState(updateGoalProgressAction, initialGoalActionState);
  useEffect(() => { if (state.status === "success") router.refresh(); }, [router, state]);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => dispatchAction(data)); }
  return (
    <form onSubmit={submit} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_1fr_auto]" noValidate>
      <input type="hidden" name="clientId" value={clientId} /><input type="hidden" name="goalId" value={goalId} />
      <select name="status" defaultValue={status} className={selectClassName}><option value="NOT_STARTED">Não iniciado</option><option value="IN_PROGRESS">Em andamento</option><option value="ACHIEVED">Atingido</option><option value="PAUSED">Pausado</option><option value="CANCELLED">Cancelado</option></select>
      {linkedMetric ? <div className="flex items-center text-xs text-muted-foreground">Valor atualizado pela métrica</div> : <Input key={`${goalId}-${currentValue ?? "empty"}`} name="manualCurrentValue" type="number" step="any" defaultValue={currentValue ?? ""} placeholder="Valor atual" />}
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}Atualizar</Button>
      {state.message ? <div className="sm:col-span-3"><Message status={state.status} message={state.message} /></div> : null}
    </form>
  );
}

type EditableGoal = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  metricId: string | null;
  initialValue: number | null;
  targetValue: number | null;
  manualCurrentValue: number | null;
  direction: "INCREASE" | "DECREASE" | "NEUTRAL";
  startDate: string;
  deadline: string | null;
  responsibleUserId: string | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "PAUSED" | "CANCELLED";
};

export function EditGoalForm({ clientId, goal, metrics, profiles }: { clientId: string; goal: EditableGoal; metrics: Array<{ id: string; name: string }>; profiles: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [state, dispatchAction, pending] = useActionState(editGoalAction, initialGoalActionState);
  useEffect(() => { if (state.status === "success") router.refresh(); }, [router, state]);
  const error = (field: string) => state.fieldErrors?.[field]?.[0];
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); startTransition(() => dispatchAction(data)); }
  const prefix = `edit-goal-${goal.id}`;

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <input type="hidden" name="clientId" value={clientId} /><input type="hidden" name="goalId" value={goal.id} />
        <Field label="Título" name={`${prefix}-title`} error={error("title")}><Input id={`${prefix}-title`} name="title" defaultValue={goal.title} required /></Field>
        <Field label="Descrição" name={`${prefix}-description`} error={error("description")}><Textarea id={`${prefix}-description`} name="description" defaultValue={goal.description ?? ""} className="min-h-20" /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Categoria" name={`${prefix}-category`} error={error("category")}><Input id={`${prefix}-category`} name="category" defaultValue={goal.category ?? ""} /></Field><Field label="Direção" name={`${prefix}-direction`} error={error("direction")}><select id={`${prefix}-direction`} name="direction" defaultValue={goal.direction === "NEUTRAL" ? "INCREASE" : goal.direction} className={selectClassName}><option value="INCREASE">Aumentar</option><option value="DECREASE">Diminuir</option></select></Field></div>
        <Field label="Métrica relacionada" name={`${prefix}-metric`} error={error("metricId")}><select id={`${prefix}-metric`} name="metricId" defaultValue={goal.metricId ?? ""} className={selectClassName}><option value="">Objetivo manual</option>{metrics.map((metric) => <option key={metric.id} value={metric.id}>{metric.name}</option>)}</select></Field>
        <div className="grid gap-4 sm:grid-cols-3"><Field label="Valor inicial" name={`${prefix}-initial`} error={error("initialValue")}><Input id={`${prefix}-initial`} name="initialValue" type="number" step="any" defaultValue={goal.initialValue ?? ""} /></Field><Field label="Valor meta" name={`${prefix}-target`} error={error("targetValue")}><Input id={`${prefix}-target`} name="targetValue" type="number" step="any" defaultValue={goal.targetValue ?? ""} /></Field><Field label="Valor atual manual" name={`${prefix}-current`} error={error("manualCurrentValue")}><Input id={`${prefix}-current`} name="manualCurrentValue" type="number" step="any" defaultValue={goal.manualCurrentValue ?? ""} /></Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Data inicial" name={`${prefix}-start`} error={error("startDate")}><Input id={`${prefix}-start`} name="startDate" type="date" defaultValue={goal.startDate} required /></Field><Field label="Prazo" name={`${prefix}-deadline`} error={error("deadline")}><Input id={`${prefix}-deadline`} name="deadline" type="date" defaultValue={goal.deadline ?? ""} /></Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Responsável" name={`${prefix}-responsible`} error={error("responsibleUserId")}><select id={`${prefix}-responsible`} name="responsibleUserId" defaultValue={goal.responsibleUserId ?? ""} className={selectClassName}><option value="">Não definido</option>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field><Field label="Status" name={`${prefix}-status`} error={error("status")}><select id={`${prefix}-status`} name="status" defaultValue={goal.status} className={selectClassName}><option value="NOT_STARTED">Não iniciado</option><option value="IN_PROGRESS">Em andamento</option><option value="ACHIEVED">Atingido</option><option value="PAUSED">Pausado</option><option value="CANCELLED">Cancelado</option></select></Field></div>
        <Message status={state.status} message={state.message} />
        <Button type="submit" variant="secondary" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}Salvar alterações</Button>
      </form>
      <div className="border-t border-border pt-4"><EntityDeleteButton kind="goal" clientId={clientId} entityId={goal.id} label={`o objetivo “${goal.title}”`} /></div>
    </div>
  );
}
