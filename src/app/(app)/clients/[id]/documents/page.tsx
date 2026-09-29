import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  FolderOpen,
  LockKeyhole,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClientTabs } from "@/features/clients/components/client-tabs";
import { DocumentControls } from "@/features/documents/components/document-controls";
import { DocumentUploadForm } from "@/features/documents/components/document-upload-form";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

const categoryLabels: Record<Enums<"document_category">, string> = {
  CONTRACT: "Contrato",
  BRIEFING: "Briefing",
  PLANNING: "Planejamento",
  REPORT: "Relatório",
  CLIENT_MATERIAL: "Material do cliente",
  OTHER: "Outro",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })} MB`;
}

function formatContractLabel(
  startDate: string,
  endDate: string | null,
  status: Enums<"contract_status">,
) {
  const date = (value: string) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
      new Date(`${value}T12:00:00Z`),
    );
  const statusLabel = {
    ACTIVE: "Ativo",
    IN_RENEWAL: "Em renovação",
    ENDED: "Encerrado",
    PAUSED: "Pausado",
  }[status];
  return `${date(startDate)} → ${endDate ? date(endDate) : "sem prazo"} · ${statusLabel}`;
}

export default async function ClientDocumentsPage({
  params,
}: PageProps<"/clients/[id]/documents">) {
  const { id } = await params;
  const currentProfile = await requireCurrentProfile();
  const supabase = await createClient();

  const [clientResult, documentsResult, contractsResult, membershipResult] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name")
        .eq("id", id)
        .is("archived_at", null)
        .maybeSingle(),
      supabase
        .from("documents")
        .select(
          "id, name, category, contract_id, mime_type, size_bytes, created_at, profiles!documents_uploaded_by_fkey(full_name)",
        )
        .eq("client_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("contracts")
        .select("id, start_date, end_date, status")
        .eq("client_id", id)
        .order("start_date", { ascending: false }),
      supabase
        .from("client_members")
        .select("id")
        .eq("client_id", id)
        .eq("user_id", currentProfile.id)
        .maybeSingle(),
    ]);

  const client = clientResult.data;
  if (!client) notFound();

  const canUpload =
    currentProfile.role === "ADMIN" || Boolean(membershipResult.data);
  const canManageOperationalDocuments = canUpload;
  const documents = documentsResult.data ?? [];
  const contractOptions = (contractsResult.data ?? []).map((contract) => ({
    id: contract.id,
    label: formatContractLabel(
      contract.start_date,
      contract.end_date,
      contract.status,
    ),
  }));
  const documentSections = [
    ...(currentProfile.role === "ADMIN"
      ? [{
          key: "contracts",
          title: "Contratos administrativos",
          description: "Arquivos contratuais visíveis somente para administradores.",
          documents: documents.filter((document) => document.category === "CONTRACT"),
        }]
      : []),
    {
      key: "operational",
      title: "Documentos operacionais",
      description: "Briefings, planejamentos, relatórios e materiais do cliente.",
      documents: documents.filter((document) => document.category !== "CONTRACT"),
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-7">
      <Link
        href={`/clients/${id}/overview`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft aria-hidden="true" />
        Voltar para visão geral
      </Link>

      <div>
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-compass-purple-light">
          Documentos
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-[2.1rem]">
          {client.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Arquivos privados, briefings, planejamentos, relatórios e contratos.
        </p>
      </div>

      <ClientTabs clientId={id} active="documents" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-5">
          {documents.length ? (
            documentSections.map((section) => (
              <Card key={section.key} className="gap-0 py-0">
                <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
                  <CardTitle className="flex items-center gap-2">
                    {section.key === "contracts" ? <LockKeyhole className="size-4 text-compass-purple-light" aria-hidden="true" /> : null}
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border px-0">
                  {section.documents.length ? section.documents.map((document) => {
                    const canEdit = document.category === "CONTRACT"
                      ? currentProfile.role === "ADMIN"
                      : canManageOperationalDocuments;
                    return (
                      <div key={document.id} className="px-5 py-4 sm:px-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background-elevated text-compass-purple-light">
                              {document.category === "CONTRACT" ? <LockKeyhole className="size-4" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-text-primary">{document.name}</p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">{categoryLabels[document.category]}</Badge>
                                <span>{formatFileSize(document.size_bytes)}</span>
                                <span>·</span>
                                <span>{formatDate(document.created_at)}</span>
                                <span>·</span>
                                <span>Enviado por {document.profiles?.full_name ?? "Usuário"}</span>
                              </div>
                            </div>
                          </div>
                          <a href={`/api/documents/${document.id}/download`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                            <Download aria-hidden="true" /> Baixar
                          </a>
                        </div>
                        {canEdit ? (
                          <details className="group mt-4 border-t border-border pt-4">
                            <summary className="cursor-pointer list-none text-sm font-semibold text-text-secondary transition-colors hover:text-foreground">Editar ou excluir documento</summary>
                            <div className="mt-4 rounded-xl border border-border bg-background-elevated/35 p-4">
                              <DocumentControls
                                clientId={id}
                                document={{ id: document.id, name: document.name, category: document.category, contractId: document.contract_id }}
                                contracts={contractOptions}
                                isAdmin={currentProfile.role === "ADMIN"}
                              />
                            </div>
                          </details>
                        ) : null}
                      </div>
                    );
                  }) : (
                    <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">Nenhum arquivo nesta seção.</p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="Nenhum documento cadastrado"
              description="Envie o primeiro arquivo para centralizar os materiais deste cliente."
            />
          )}
        </div>

        <Card className="h-fit gap-0 py-0">
          <CardHeader className="border-b border-border px-5 py-5">
            <CardTitle>Enviar documento</CardTitle>
            <CardDescription>
              Os arquivos ficam em armazenamento privado e protegido por permissão.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {canUpload ? (
              <DocumentUploadForm
                clientId={id}
                isAdmin={currentProfile.role === "ADMIN"}
                contracts={contractOptions}
              />
            ) : (
              <div className="rounded-xl border border-border bg-background-elevated/45 p-4 text-sm leading-6 text-muted-foreground">
                Apenas administradores ou pessoas responsáveis por este cliente podem enviar arquivos.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
