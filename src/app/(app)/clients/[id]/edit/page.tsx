import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ClientLifecycleButton } from "@/features/clients/components/client-lifecycle-button";
import { EditClientForm } from "@/features/clients/components/create-client-form";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();
  if (!client) notFound();

  const [servicesResult, profilesResult, selectedServicesResult, primaryMemberResult, primaryContactResult] =
    await Promise.all([
      supabase
        .from("services")
        .select("id, name, description, active")
        .order("sort_order")
        .order("name"),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("active", true)
        .order("full_name"),
      supabase
        .from("client_services")
        .select("service_id, scope_description")
        .eq("client_id", id),
      supabase
        .from("client_members")
        .select("user_id")
        .eq("client_id", id)
        .eq("is_primary", true)
        .maybeSingle(),
      supabase
        .from("client_contacts")
        .select("name, position, phone, email")
        .eq("client_id", id)
        .eq("is_primary", true)
        .maybeSingle(),
    ]);

  const contact = primaryContactResult.data;
  const primaryMemberId = primaryMemberResult.data?.user_id;
  if (!primaryMemberId) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <Link
        href={`/clients/${id}/overview`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft aria-hidden="true" />
        Voltar para visão geral
      </Link>

      <PageHeader
        eyebrow="Administração do cliente"
        title={`Editar ${client.name}`}
        description="Atualize cadastro, relacionamento, escopo e contato principal. Métricas e objetivos permanecem em suas próprias abas."
      />

      <EditClientForm
        clientId={id}
        services={(servicesResult.data ?? []).map((service) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          active: service.active,
        }))}
        profiles={(profilesResult.data ?? []).map((profile) => ({
          id: profile.id,
          fullName: profile.full_name,
        }))}
        values={{
          name: client.name,
          legalName: client.legal_name ?? "",
          cnpj: client.cnpj ?? "",
          segment: client.segment ?? "",
          city: client.city ?? "",
          state: client.state ?? "",
          websiteUrl: client.website_url ?? "",
          instagramUrl: client.instagram_url ?? "",
          googleBusinessUrl: client.google_business_url ?? "",
          status: client.status,
          healthStatus: client.health_status ?? "",
          joinedAt: client.joined_at,
          acquisitionSource: client.acquisition_source ?? "",
          soldByUserId: client.sold_by_user_id ?? "",
          primaryMemberId,
          contactName: contact?.name ?? "",
          contactPosition: contact?.position ?? "",
          contactPhone: contact?.phone ?? "",
          contactEmail: contact?.email ?? "",
          generalNotes: client.general_notes ?? "",
          internalNotes: client.internal_notes ?? "",
          services: (selectedServicesResult.data ?? []).map((service) => ({
            id: service.service_id,
            scope: service.scope_description ?? "",
          })),
        }}
      />

      <div className="flex flex-col gap-4 rounded-2xl border border-status-critical/20 bg-status-critical/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">Arquivar cliente</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Remove o cliente das visões operacionais sem apagar métricas, objetivos, atualizações ou documentos.
          </p>
        </div>
        <ClientLifecycleButton clientId={id} clientName={client.name} mode="archive" />
      </div>
    </div>
  );
}
