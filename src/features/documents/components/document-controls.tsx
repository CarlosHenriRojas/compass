"use client";

import { LoaderCircle, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteDocumentAction,
  updateDocumentAction,
} from "@/features/documents/actions";
import { initialDocumentActionState } from "@/features/documents/document-state";
import type { Enums } from "@/types/database";

const operationalCategories: Array<{ value: Enums<"document_category">; label: string }> = [
  { value: "BRIEFING", label: "Briefing" },
  { value: "PLANNING", label: "Planejamento" },
  { value: "REPORT", label: "Relatório" },
  { value: "CLIENT_MATERIAL", label: "Material do cliente" },
  { value: "OTHER", label: "Outro" },
];

const selectClassName =
  "h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20";

export function DocumentControls({
  clientId,
  document,
  contracts,
  isAdmin,
}: {
  clientId: string;
  document: { id: string; name: string; category: Enums<"document_category">; contractId: string | null };
  contracts: Array<{ id: string; label: string }>;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const updateAction = updateDocumentAction.bind(null, clientId, document.id);
  const [state, formAction, updatePending] = useActionState(updateAction, initialDocumentActionState);
  const [name, setName] = useState(document.name);
  const [category, setCategory] = useState(document.category);
  const [contractId, setContractId] = useState(document.contractId ?? "");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deletePending, startDeleteTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Excluir “${document.name}”? O arquivo será removido permanentemente do armazenamento.`)) return;
    setDeleteMessage("");
    startDeleteTransition(async () => {
      const result = await deleteDocumentAction(clientId, document.id);
      if (!result.ok) setDeleteMessage(result.message);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor={`document-name-${document.id}`} className="text-sm font-medium text-text-primary">Nome de exibição</label>
          <Input
            id={`document-name-${document.id}`}
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={180}
            aria-invalid={Boolean(state.fieldErrors?.name)}
            required
          />
          {state.fieldErrors?.name?.[0] ? <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`document-category-${document.id}`} className="text-sm font-medium text-text-primary">Categoria</label>
            <select id={`document-category-${document.id}`} name="category" value={category} onChange={(event) => setCategory(event.target.value as Enums<"document_category">)} className={selectClassName}>
              {isAdmin ? <option value="CONTRACT">Contrato</option> : null}
              {operationalCategories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          {category === "CONTRACT" ? (
            <div className="space-y-2">
              <label htmlFor={`document-contract-${document.id}`} className="text-sm font-medium text-text-primary">Contrato relacionado</label>
              <select
                id={`document-contract-${document.id}`}
                name="contractId"
                value={contractId}
                onChange={(event) => setContractId(event.target.value)}
                className={selectClassName}
                required
              >
                <option value="" disabled>Selecione</option>
                {contracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.label}</option>)}
              </select>
              {state.fieldErrors?.contractId?.[0] ? <p className="text-xs text-destructive">{state.fieldErrors.contractId[0]}</p> : null}
            </div>
          ) : <input type="hidden" name="contractId" value="" />}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="submit" size="sm" variant="secondary" disabled={updatePending}>
            {updatePending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
            {updatePending ? "Salvando..." : "Salvar alterações"}
          </Button>
          {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-xs text-destructive" : "text-xs text-status-healthy"}>{state.message}</p> : null}
        </div>
      </form>

      {isAdmin ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">A exclusão remove o arquivo e não pode ser desfeita.</p>
          <Button type="button" size="sm" variant="destructive" onClick={remove} disabled={deletePending}>
            {deletePending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
            {deletePending ? "Excluindo..." : "Excluir documento"}
          </Button>
          {deleteMessage ? <p role="alert" className="w-full text-xs text-destructive">{deleteMessage}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
