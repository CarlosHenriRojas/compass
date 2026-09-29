import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { CreateClientForm } from "@/features/clients/components/create-client-form";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

function getTodayInSaoPaulo() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function NewClientPage() {
  const currentProfile = await requireAdmin();
  const supabase = await createClient();
  const [{ data: services }, { data: profiles }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description")
      .eq("active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("active", true)
      .order("full_name"),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <Link
        href="/clients"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft aria-hidden="true" />
        Voltar para clientes
      </Link>
      <PageHeader
        eyebrow="Carteira"
        title="Novo cliente"
        description="Cadastre as informações essenciais agora. Contrato, métricas e objetivos serão adicionados nas próximas etapas."
      />
      <CreateClientForm
        services={(services ?? []).map((service) => ({
          id: service.id,
          name: service.name,
          description: service.description,
        }))}
        profiles={(profiles ?? []).map((profile) => ({
          id: profile.id,
          fullName: profile.full_name,
        }))}
        defaultJoinedAt={getTodayInSaoPaulo()}
        defaultPrimaryMemberId={currentProfile.id}
      />
    </div>
  );
}
