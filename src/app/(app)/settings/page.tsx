import { ArrowRight, Layers3, UsersRound } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentProfile } from "@/lib/auth/session";

export default async function SettingsPage() {
  const profile = await requireCurrentProfile();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Administração"
        title="Configurações"
        description="Gerencie os acessos e as preferências administrativas do Compass Hub."
      />
      {profile.role === "ADMIN" ? (
        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <SettingsLink
            href="/settings/users"
            icon={UsersRound}
            title="Usuários e acessos"
            description="Convide pessoas e defina seus perfis de permissão."
          />
          <SettingsLink
            href="/settings/services"
            icon={Layers3}
            title="Catálogo de serviços"
            description="Crie, organize e desative os serviços da agência."
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Não há configurações disponíveis para o seu perfil.
        </p>
      )}
    </div>
  );
}

function SettingsLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof UsersRound;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-[background-color,border-color,transform] duration-200 group-hover:-translate-y-px group-hover:border-border-strong group-hover:bg-card-hover">
        <CardContent className="flex items-center gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-compass-purple-light/15 bg-compass-purple-soft text-compass-purple-light">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
          </span>
          <ArrowRight className="size-4 text-text-muted transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-compass-purple-light" aria-hidden="true" />
        </CardContent>
      </Card>
    </Link>
  );
}
