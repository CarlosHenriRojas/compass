"use client";

import { Archive, LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  archiveClientAction,
  restoreClientAction,
} from "@/features/clients/actions";

export function ClientLifecycleButton({
  clientId,
  clientName,
  mode,
}: {
  clientId: string;
  clientName: string;
  mode: "archive" | "restore";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function submit() {
    const question =
      mode === "archive"
        ? `Arquivar ${clientName}? O histórico será preservado e o cliente poderá ser reativado depois.`
        : `Reativar ${clientName} e devolvê-lo à carteira?`;
    if (!window.confirm(question)) return;

    setError("");
    startTransition(async () => {
      const result =
        mode === "archive"
          ? await archiveClientAction(clientId)
          : await restoreClientAction(clientId);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (mode === "archive") router.push("/clients");
      else router.refresh();
    });
  }

  return (
    <div>
      <Button
        type="button"
        variant={mode === "archive" ? "destructive" : "secondary"}
        onClick={submit}
        disabled={pending}
      >
        {pending ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : mode === "archive" ? (
          <Archive aria-hidden="true" />
        ) : (
          <RotateCcw aria-hidden="true" />
        )}
        {pending
          ? mode === "archive" ? "Arquivando..." : "Reativando..."
          : mode === "archive" ? "Arquivar cliente" : "Reativar"}
      </Button>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
