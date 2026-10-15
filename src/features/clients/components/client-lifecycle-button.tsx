"use client";

import { Archive, LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  archiveClientAction,
  deleteClientPermanentlyAction,
  restoreClientAction,
} from "@/features/clients/actions";

export function ClientLifecycleButton({
  clientId,
  clientName,
  mode,
}: {
  clientId: string;
  clientName: string;
  mode: "archive" | "restore" | "delete";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit() {
    if (mode === "delete") {
      const confirmation = window.prompt(`Esta exclusão é definitiva e apagará métricas, objetivos, atualizações, tarefas e arquivos de “${clientName}”.\n\nDigite exatamente o nome do cliente para confirmar:`);
      if (confirmation !== clientName) return;
    } else {
      const question = mode === "archive"
        ? `Arquivar ${clientName}? O histórico será preservado e o cliente poderá ser reativado depois.`
        : `Reativar ${clientName} e devolvê-lo à carteira?`;
      if (!window.confirm(question)) return;
    }

    setError("");
    startTransition(async () => {
      const result = mode === "archive"
        ? await archiveClientAction(clientId)
        : mode === "restore"
          ? await restoreClientAction(clientId)
          : await deleteClientPermanentlyAction(clientId);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (mode === "archive" || mode === "delete") router.push("/clients");
      else router.refresh();
    });
  }

  return (
    <div>
      <Button
        type="button"
        variant={mode === "restore" ? "secondary" : "destructive"}
        onClick={submit}
        disabled={pending}
      >
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : mode === "archive" ? (
          <Archive aria-hidden="true" />
        ) : mode === "delete" ? (
          <Trash2 aria-hidden="true" />
        ) : (
          <RotateCcw aria-hidden="true" />
        )}
        {pending
          ? mode === "archive" ? "Arquivando..." : mode === "delete" ? "Excluindo..." : "Reativando..."
          : mode === "archive" ? "Arquivar cliente" : mode === "delete" ? "Excluir definitivamente" : "Reativar"}
      </Button>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
