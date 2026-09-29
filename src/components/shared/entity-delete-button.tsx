"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteGoalAction } from "@/features/goals/actions";
import { archiveMetricAction } from "@/features/metrics/actions";
import { deleteWeeklyUpdateAction } from "@/features/updates/actions";

type EntityKind = "metric" | "goal" | "update";

export function EntityDeleteButton({
  kind,
  clientId,
  entityId,
  label,
}: {
  kind: EntityKind;
  clientId: string;
  entityId: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function remove() {
    const verb = kind === "metric" ? "arquivar" : "excluir";
    if (!window.confirm(`Deseja realmente ${verb} ${label}?`)) return;
    setError("");
    startTransition(async () => {
      const result =
        kind === "metric"
          ? await archiveMetricAction(clientId, entityId)
          : kind === "goal"
            ? await deleteGoalAction(clientId, entityId)
            : await deleteWeeklyUpdateAction(clientId, entityId);
      if (!result.ok) setError(result.message);
      else router.refresh();
    });
  }

  return (
    <div>
      <Button type="button" variant="destructive" size="sm" onClick={remove} disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
        {kind === "metric" ? "Arquivar" : "Excluir"}
      </Button>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
