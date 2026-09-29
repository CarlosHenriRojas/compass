import { Layers3 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateServiceForm, EditServiceForm } from "@/features/services/components/service-forms";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function ServicesSettingsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, sort_order, active")
    .order("active", { ascending: false })
    .order("sort_order")
    .order("name");

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configurações"
        title="Catálogo de serviços"
        description="Gerencie as opções disponíveis no cadastro e no escopo dos clientes."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
            <CardTitle>Serviços cadastrados</CardTitle>
            <CardDescription>{services?.length ?? 0} opção(ões) no catálogo.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border px-0">
            {(services ?? []).map((service) => (
              <details key={service.id} className="group px-5 py-4 sm:px-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <span>
                    <span className="block text-sm font-semibold text-text-primary">{service.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{service.description ?? "Sem descrição."}</span>
                  </span>
                  <Badge className={service.active ? "border-status-healthy/25 bg-status-healthy/10 text-status-healthy" : "border-border bg-background-elevated text-text-muted"}>
                    {service.active ? "Ativo" : "Inativo"}
                  </Badge>
                </summary>
                <div className="mt-4 rounded-xl border border-border bg-background-elevated/35 p-4">
                  <EditServiceForm service={{ id: service.id, name: service.name, description: service.description, sortOrder: service.sort_order, active: service.active }} />
                </div>
              </details>
            ))}
          </CardContent>
        </Card>

        <Card className="h-fit gap-0 py-0 xl:sticky xl:top-24">
          <CardHeader className="border-b border-border px-5 py-5">
            <span className="mb-2 flex size-9 items-center justify-center rounded-xl border border-compass-purple-light/15 bg-compass-purple-soft text-compass-purple-light">
              <Layers3 className="size-4" aria-hidden="true" />
            </span>
            <CardTitle>Novo serviço</CardTitle>
            <CardDescription>Adicione uma nova opção ao cadastro de clientes.</CardDescription>
          </CardHeader>
          <CardContent className="p-5"><CreateServiceForm /></CardContent>
        </Card>
      </div>
    </div>
  );
}
