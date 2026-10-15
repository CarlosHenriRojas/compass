"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { archiveTaskAction } from "@/features/tasks/actions";

export function TaskArchiveButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  function archive() {
    if (!window.confirm("Arquivar esta tarefa? Ela sairá dos quadros ativos.")) return;
    startTransition(async () => {
      const result = await archiveTaskAction(taskId);
      if (!result.ok) { setMessage(result.message); return; }
      router.push("/tasks");
    });
  }
  return <div className="space-y-2"><Button type="button" variant="destructive" onClick={archive} disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Archive aria-hidden="true" />}Arquivar tarefa</Button>{message ? <p role="alert" className="text-xs text-destructive">{message}</p> : null}</div>;
}

