import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FileSignature, RefreshCw } from "lucide-react";

import { ClientTabs } from "@/features/clients/components/client-tabs";
import { ContractForm } from "@/features/contracts/components/contract-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database";

const contractStatusLabels: Record<Enums<"contract_status">, string> = {
  ACTIVE: "Ativo",
  IN_RENEWAL: "Em renovação",
  PAUSED: "Pausado",
  ENDED: "Encerrado",
};

function formatDate(value: string | null) {
  if (!value) return "Sem prazo definido";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function ClientContractPage({
  params,
}: PageProps<"/clients/[id]/contract">) {
  const { id } = await params;
  const currentProfile = await requireCurrentProfile();
  const supabase = await createClient();

  const [{ data: client }, { data: contracts }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, joined_at")
      .eq("id", id)
      .is("archived_at", null)
      .maybeSingle(),
    supabase
      .from("contracts")
      .select("*")
      .eq("client_id", id)
      .order("start_date", { ascending: false }),
  ]);

  if (!client) notFound();

  const contractIds = (contracts ?? []).map((contract) => contract.id);
  const { data: financials } =
    currentProfile.role === "ADMIN" && contractIds.length
      ? await supabase
          .from("contract_financials")
          .select("contract_id, monthly_value, billing_day")
          .in("contract_id", contractIds)
      : { data: [] };
  const financialByContract = new Map(
    (financials ?? []).map((financial) => [financial.contract_id, financial]),
  );

  const editableContract =
    (contracts ?? []).find((contract) =>
      ["ACTIVE", "IN_RENEWAL"].includes(contract.status),
    ) ?? contracts?.[0] ?? null;
  const editableFinancial = editableContract
    ? financialByContract.get(editableContract.id)
    : null;

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
          Contrato
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-[2.1rem]">
          {client.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vigência, condições financeiras e limites do escopo contratado.
        </p>
      </div>

      <ClientTabs clientId={id} active="contract" />

      {editableContract ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card size="sm">
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant="outline">
                {contractStatusLabels[editableContract.status]}
              </Badge>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">Vigência</p>
              <p className="mt-2 font-semibold text-text-primary">
                {formatDate(editableContract.start_date)} → {formatDate(editableContract.end_date)}
              </p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">Renovação</p>
              <p className="mt-2 font-semibold text-text-primary">
                {editableContract.automatic_renewal ? "Automática" : "Manual"}
              </p>
            </CardContent>
          </Card>
          {currentProfile.role === "ADMIN" && editableFinancial ? (
            <Card size="sm">
              <CardContent>
                <p className="text-xs text-muted-foreground">Mensalidade</p>
                <p className="mt-2 font-semibold text-text-primary">
                  {formatCurrency(editableFinancial.monthly_value)} · dia {editableFinancial.billing_day}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {currentProfile.role === "ADMIN" ? (
        <Card className="gap-0 py-0">
          <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
            <span className="mb-2 flex size-9 items-center justify-center rounded-xl border border-compass-purple-light/15 bg-compass-purple-soft text-compass-purple-light">
              <FileSignature className="size-4" aria-hidden="true" />
            </span>
            <CardTitle>
              {editableContract ? "Editar contrato" : "Cadastrar contrato"}
            </CardTitle>
            <CardDescription>
              Dados financeiros são visíveis somente para administradores.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <ContractForm
              clientId={id}
              values={{
                id: editableContract?.id ?? null,
                startDate: editableContract?.start_date ?? client.joined_at,
                endDate: editableContract?.end_date ?? "",
                status: editableContract?.status ?? "ACTIVE",
                automaticRenewal:
                  editableContract?.automatic_renewal ?? false,
                monthlyValue: editableFinancial?.monthly_value ?? null,
                billingDay: editableFinancial?.billing_day ?? null,
                scopeIncluded: editableContract?.scope_included ?? "",
                scopeExcluded: editableContract?.scope_excluded ?? "",
              }}
            />
          </CardContent>
        </Card>
      ) : editableContract ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>O que fazemos</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">{editableContract.scope_included ?? "Escopo ainda não informado."}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>O que não fazemos</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">{editableContract.scope_excluded ?? "Limites ainda não informados."}</CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
            <CalendarDays className="mb-4 size-6 text-compass-purple-light" aria-hidden="true" />
            <p className="font-semibold text-text-primary">Nenhum contrato cadastrado</p>
            <p className="mt-2 text-sm text-muted-foreground">Solicite a um administrador o cadastro das informações contratuais.</p>
          </CardContent>
        </Card>
      )}

      {(contracts ?? []).length > 1 ? (
        <Card className="gap-0 py-0">
          <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
            <span className="mb-2 flex size-9 items-center justify-center rounded-xl border border-border bg-background-elevated text-text-secondary">
              <RefreshCw className="size-4" aria-hidden="true" />
            </span>
            <CardTitle>Histórico de contratos</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border px-0">
            {(contracts ?? []).map((contract) => {
              const financial = financialByContract.get(contract.id);
              return (
                <div key={contract.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <p className="font-medium text-text-primary">{formatDate(contract.start_date)} → {formatDate(contract.end_date)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{contractStatusLabels[contract.status]}</p>
                  </div>
                  {currentProfile.role === "ADMIN" && financial ? <p className="text-sm text-text-secondary">{formatCurrency(financial.monthly_value)}</p> : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
