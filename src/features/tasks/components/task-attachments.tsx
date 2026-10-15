"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Download, ExternalLink, FileImage, FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteTaskAttachmentAction } from "@/features/tasks/actions";
import { cn } from "@/lib/utils";

export type TaskAttachment = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploaderName: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskAttachmentUploadForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setStatus("idle"); setMessage("");
    const data = new FormData(event.currentTarget); const file = data.get("file");
    if (!(file instanceof File) || !file.size) { setPending(false); setStatus("error"); setMessage("Selecione um arquivo."); return; }
    if (file.size > 20 * 1024 * 1024) { setPending(false); setStatus("error"); setMessage("O arquivo deve possuir no máximo 20 MB."); return; }
    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments`, { method: "POST", body: data });
      const result = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) { setStatus("error"); setMessage(result.message ?? "Não foi possível enviar o anexo."); return; }
      setStatus("success"); setMessage(result.message ?? "Anexo enviado."); formRef.current?.reset(); router.refresh();
    } catch { setStatus("error"); setMessage("Falha de conexão durante o envio."); }
    finally { setPending(false); }
  }
  return <form ref={formRef} onSubmit={submit} className="space-y-4">
    <div className="space-y-2"><label htmlFor="attachmentDisplayName" className="text-sm font-medium text-text-primary">Nome de exibição</label><Input id="attachmentDisplayName" name="displayName" maxLength={180} placeholder="Opcional — usa o nome do arquivo" /></div>
    <div className="space-y-2"><label htmlFor="taskAttachmentFile" className="text-sm font-medium text-text-primary">Arquivo</label><Input id="taskAttachmentFile" name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp" className="h-auto min-h-10 py-1.5" required /><p className="text-xs leading-5 text-muted-foreground">Imagem, PDF, Word ou Excel · máximo de 20 MB.</p></div>
    {message ? <div role={status === "error" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm", status === "success" ? "border-status-healthy/25 bg-status-healthy/8 text-status-healthy" : "border-status-critical/25 bg-status-critical/8 text-status-critical")}>{status === "success" ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}<span>{message}</span></div> : null}
    <Button type="submit" className="w-full" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}{pending ? "Enviando..." : "Anexar arquivo"}</Button>
  </form>;
}

function DeleteAttachmentButton({ taskId, attachmentId, name }: { taskId: string; attachmentId: string; name: string }) {
  const router = useRouter(); const [error, setError] = useState(""); const [pending, startTransition] = useTransition();
  function remove() { if (!window.confirm(`Excluir o anexo “${name}”?`)) return; startTransition(async () => { const result = await deleteTaskAttachmentAction(taskId, attachmentId); if (!result.ok) setError(result.message); else router.refresh(); }); }
  return <div><Button type="button" variant="destructive" size="icon-sm" onClick={remove} disabled={pending} aria-label={`Excluir ${name}`}>{pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}</Button>{error ? <p role="alert" className="mt-1 text-xs text-destructive">{error}</p> : null}</div>;
}

export function TaskAttachmentList({ taskId, attachments }: { taskId: string; attachments: TaskAttachment[] }) {
  if (!attachments.length) return <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Nenhum arquivo anexado.</div>;
  return <div className="divide-y divide-border rounded-xl border border-border">{attachments.map((attachment) => {
    const image = attachment.mimeType.startsWith("image/"); const Icon = image ? FileImage : FileText;
    return <div key={attachment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-text-primary">{attachment.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatBytes(attachment.sizeBytes)} · {attachment.uploaderName}</p></div></div><div className="flex items-center gap-2">{image ? <Link href={`/api/task-attachments/${attachment.id}/download?view=1`} target="_blank" className="inline-flex size-7 items-center justify-center rounded-lg text-text-secondary hover:bg-muted hover:text-foreground" aria-label={`Visualizar ${attachment.name}`}><ExternalLink className="size-3.5" /></Link> : null}<Link href={`/api/task-attachments/${attachment.id}/download`} className="inline-flex size-7 items-center justify-center rounded-lg text-text-secondary hover:bg-muted hover:text-foreground" aria-label={`Baixar ${attachment.name}`}><Download className="size-3.5" /></Link><DeleteAttachmentButton taskId={taskId} attachmentId={attachment.id} name={attachment.name} /></div></div>;
  })}</div>;
}

