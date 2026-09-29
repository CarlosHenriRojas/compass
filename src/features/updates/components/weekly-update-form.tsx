"use client";

import {
  startTransition,
  type FormEvent,
  type ReactNode,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createWeeklyUpdateAction,
  updateWeeklyUpdateAction,
} from "@/features/updates/actions";
import { initialWeeklyUpdateActionState } from "@/features/updates/update-state";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

const selectClassName =
  "h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20 aria-invalid:border-destructive/70";

function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function FormMessage({ status, message }: { status: string; message: string }) {
  if (!message) return null;
  const success = status === "success";
  return (
    <div
      role={success ? "status" : "alert"}
      className={cn(
        "flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        success
          ? "border-status-healthy/25 bg-status-healthy/8 text-status-healthy"
          : "border-status-critical/25 bg-status-critical/8 text-status-critical",
      )}
    >
      {success ? (
        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <span>{message}</span>
    </div>
  );
}

export function WeeklyUpdateForm({
  clientId,
  defaultWeekStart,
  defaultWeekEnd,
  currentHealth,
  initialValues,
}: {
  clientId: string;
  defaultWeekStart: string;
  defaultWeekEnd: string;
  currentHealth: Enums<"health_status"> | null;
  initialValues?: {
    id: string;
    weekStart: string;
    weekEnd: string;
    summary: string;
    actionsCompleted: string | null;
    resultsSummary: string | null;
    blockers: string | null;
    nextSteps: string | null;
    priorityNextAction: string | null;
    healthStatus: Enums<"health_status"> | null;
    notes: string | null;
    results: Array<{ id: string; label: string; value: string; description: string | null }>;
  };
}) {
  const router = useRouter();
  const isEditing = Boolean(initialValues);
  const formRef = useRef<HTMLFormElement>(null);
  const nextResultId = useRef(1);
  const [resultRows, setResultRows] = useState(() =>
    initialValues?.results.length
      ? initialValues.results.map((result) => ({ ...result }))
      : [{ id: "new-0", label: "", value: "", description: null }],
  );
  const [state, dispatchAction, pending] = useActionState(
    isEditing ? updateWeeklyUpdateAction : createWeeklyUpdateAction,
    initialWeeklyUpdateActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      if (!isEditing) formRef.current?.reset();
      router.refresh();
    }
  }, [isEditing, router, state]);

  const error = (field: string) => state.fieldErrors?.[field]?.[0];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatchAction(data));
  }

  function addResult() {
    if (resultRows.length >= 6) return;
    const id = `new-${nextResultId.current++}`;
    setResultRows((rows) => [...rows, { id, label: "", value: "", description: null }]);
  }

  function removeResult(id: string) {
    setResultRows((rows) => rows.filter((row) => row.id !== id));
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-6" noValidate>
      <input type="hidden" name="clientId" value={clientId} />
      {initialValues ? <input type="hidden" name="updateId" value={initialValues.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Início do período" name="weekStart" error={error("weekStart")}>
          <Input
            id="weekStart"
            name="weekStart"
            type="date"
            defaultValue={initialValues?.weekStart ?? defaultWeekStart}
            aria-invalid={Boolean(error("weekStart"))}
            required
          />
        </Field>
        <Field label="Fim do período" name="weekEnd" error={error("weekEnd")}>
          <Input
            id="weekEnd"
            name="weekEnd"
            type="date"
            defaultValue={initialValues?.weekEnd ?? defaultWeekEnd}
            aria-invalid={Boolean(error("weekEnd"))}
            required
          />
        </Field>
      </div>

      <Field label="Resumo da semana" name="summary" error={error("summary")}>
        <Textarea
          id="summary"
          name="summary"
          defaultValue={initialValues?.summary ?? ""}
          placeholder="O que é mais importante saber sobre este cliente nesta semana?"
          aria-invalid={Boolean(error("summary"))}
          required
        />
      </Field>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="O que foi feito" name="actionsCompleted" error={error("actionsCompleted")}>
          <Textarea
            id="actionsCompleted"
            name="actionsCompleted"
            defaultValue={initialValues?.actionsCompleted ?? ""}
            placeholder="Campanhas, conteúdos, otimizações e entregas realizadas."
          />
        </Field>
        <Field label="Resultados relevantes" name="resultsSummary" error={error("resultsSummary")}>
          <Textarea
            id="resultsSummary"
            name="resultsSummary"
            defaultValue={initialValues?.resultsSummary ?? ""}
            placeholder="Mudanças nos números, aprendizados e resultados percebidos."
          />
        </Field>
        <Field label="Problemas ou bloqueios" name="blockers" error={error("blockers")}>
          <Textarea
            id="blockers"
            name="blockers"
            defaultValue={initialValues?.blockers ?? ""}
            placeholder="Dependências, riscos ou pontos que exigem atenção."
          />
        </Field>
        <Field label="Próximos passos" name="nextSteps" error={error("nextSteps")}>
          <Textarea
            id="nextSteps"
            name="nextSteps"
            defaultValue={initialValues?.nextSteps ?? ""}
            placeholder="Resumo do que vem a seguir, sem criar ou controlar tarefas."
          />
        </Field>
      </div>

      <div className="rounded-2xl border border-border bg-background-elevated/35 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">Resultados destacados</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Destaques curtos como “Leads · 143” ou “CPL · R$ 18,42”.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addResult}
            disabled={resultRows.length >= 6}
          >
            <Plus aria-hidden="true" />
            Adicionar resultado
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {resultRows.map((row) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-xl border border-border bg-background/35 p-3 sm:grid-cols-[1fr_0.75fr_1.35fr_auto]"
            >
              <Input name="resultLabel" defaultValue={row.label} placeholder="Título: Leads" aria-label="Título do resultado" />
              <Input name="resultValue" defaultValue={row.value} placeholder="Valor: 143" aria-label="Valor do resultado" />
              <Input name="resultDescription" defaultValue={row.description ?? ""} placeholder="Descrição opcional" aria-label="Descrição do resultado" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeResult(row.id)}
                aria-label="Remover resultado"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
        {error("results") ? <p className="mt-3 text-xs text-destructive">{error("results")}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Próximo foco prioritário"
          name="priorityNextAction"
          error={error("priorityNextAction")}
          hint="É apenas um resumo visível no dashboard; não cria uma tarefa."
        >
          <Input
            id="priorityNextAction"
            name="priorityNextAction"
            defaultValue={initialValues?.priorityNextAction ?? ""}
            placeholder="Ex.: Validar os novos criativos com o cliente"
          />
        </Field>
        <Field label="Saúde do cliente" name="healthStatus" error={error("healthStatus")}>
          <select
            id="healthStatus"
            name="healthStatus"
            defaultValue={initialValues?.healthStatus ?? currentHealth ?? ""}
            className={selectClassName}
          >
            <option value="">Não alterar</option>
            <option value="HEALTHY">Saudável</option>
            <option value="ATTENTION">Atenção</option>
            <option value="CRITICAL">Crítico</option>
          </select>
        </Field>
      </div>

      <Field label="Observações internas" name="notes" error={error("notes")}>
        <Textarea id="notes" name="notes" defaultValue={initialValues?.notes ?? ""} className="min-h-20" />
      </Field>

      <FormMessage status={state.status} message={state.message} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <Save aria-hidden="true" />
        )}
        {pending ? "Salvando..." : initialValues ? "Salvar alterações" : "Registrar atualização"}
      </Button>
    </form>
  );
}
