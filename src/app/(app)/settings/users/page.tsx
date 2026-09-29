import { UserPlus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteUserForm } from "@/features/users/components/invite-user-form";
import { UserAccessControls } from "@/features/users/components/user-access-controls";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function UsersSettingsPage() {
  const currentProfile = await requireAdmin();
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, active, created_at")
    .order("full_name");

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configurações"
        title="Usuários"
        description="Convide pessoas da equipe e defina o nível de acesso ao Compass Hub."
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
            <CardTitle>Equipe com acesso</CardTitle>
            <CardDescription>
              {profiles?.length ?? 0} usuário(s) cadastrado(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border px-0">
            {profiles?.map((profile) => (
              <div
                key={profile.id}
                className="flex flex-col gap-4 px-5 py-4 transition-colors duration-200 hover:bg-card-hover sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {profile.full_name}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {profile.active ? "Acesso ativo" : "Acesso desativado"}
                    </Badge>
                    {profile.id === currentProfile.id ? (
                      <Badge className="border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light">
                        Você
                      </Badge>
                    ) : null}
                  </div>
                  <UserAccessControls
                    key={`${profile.id}-${profile.role}-${profile.active}`}
                    userId={profile.id}
                    initialRole={profile.role}
                    initialActive={profile.active}
                    isCurrentUser={profile.id === currentProfile.id}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="border-b border-border px-5 py-5">
            <span className="mb-2 flex size-9 items-center justify-center rounded-xl border border-compass-purple-light/15 bg-compass-purple-soft text-compass-purple-light">
              <UserPlus className="size-4" aria-hidden="true" />
            </span>
            <CardTitle>Convidar usuário</CardTitle>
            <CardDescription>
              A pessoa receberá um e-mail para definir a senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <InviteUserForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
