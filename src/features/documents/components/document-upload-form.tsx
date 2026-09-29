"use client";

import { type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, LoaderCircle, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DocumentCategory =
  | "CONTRACT"
  | "BRIEFING"
  | "PLANNING"
  | "REPORT"
  | "CLIENT_MATERIAL"
  | "OTHER";

const categories: Array<{ value: DocumentCategory; label: string }> = [
  { value: "BRIEFING", label: "Briefing" },
  { value: "PLANNING", label: "Planejamento" },
  { value: "REPORT", label: "Relatório" },
  { value: "CLIENT_MATERIAL", label: "Material do cliente" },
  { value: "OTHER", label: "Outro" },
];

const selectClassName =
  "h-10 w-full rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 text-sm text-foreground outline-none transition-colors hover:border-border-strong focus:border-compass-purple-light/70 focus:ring-3 focus:ring-ring/20";

export function DocumentUploadForm({
  clientId,
  isAdmin,
  contracts,
}: {
  clientId: string;
  isAdmin: boolean;
  contracts: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState<DocumentCategory>("BRIEFING");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("idle");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setStatus("error");
      setMessage("Selecione um arquivo.");
      setPending(false);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setStatus("error");
      setMessage("O arquivo deve possuir no máximo 20 MB.");
      setPending(false);
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/documents`, {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(result.message ?? "Não foi possível enviar o documento.");
        return;
      }

      setStatus("success");
      setMessage(result.message ?? "Documento enviado com sucesso.");
      formRef.current?.reset();
      setCategory("BRIEFING");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Falha de conexão durante o envio. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="displayName" className="text-sm font-medium text-text-primary">Nome de exibição</label>
        <Input id="displayName" name="displayName" placeholder="Opcional — usa o nome do arquivo" maxLength={180} />
      </div>

      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium text-text-primary">Categoria</label>
        <select id="category" name="category" value={category} onChange={(event) => setCategory(event.target.value as DocumentCategory)} className={selectClassName}>
          {isAdmin && contracts.length > 0 ? <option value="CONTRACT">Contrato</option> : null}
          {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>

      {category === "CONTRACT" ? (
        <div className="space-y-2">
          <label htmlFor="contractId" className="text-sm font-medium text-text-primary">Contrato relacionado</label>
          <select id="contractId" name="contractId" defaultValue="" className={selectClassName} required>
            <option value="" disabled>Selecione o contrato</option>
            {contracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.label}</option>)}
          </select>
        </div>
      ) : (
        <input type="hidden" name="contractId" value="" />
      )}

      <div className="space-y-2">
        <label htmlFor="file" className="text-sm font-medium text-text-primary">Arquivo</label>
        <Input id="file" name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp" className="h-auto min-h-10 py-1.5" required />
        <p className="text-xs leading-5 text-muted-foreground">PDF, Word, Excel ou imagem · máximo de 20 MB.</p>
      </div>

      {message ? (
        <div role={status === "error" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm", status === "success" ? "border-status-healthy/25 bg-status-healthy/8 text-status-healthy" : "border-status-critical/25 bg-status-critical/8 text-status-critical")}>
          {status === "success" ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          <span>{message}</span>
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
        {pending ? "Enviando..." : "Enviar documento"}
      </Button>
    </form>
  );
}
