import { Bell, LogOut, Search } from "lucide-react";

import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { logoutAction } from "@/features/auth/actions";
import type { CurrentProfile } from "@/lib/auth/session";

function getInitials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AppHeader({ profile }: { profile: CurrentProfile }) {
  return (
    <header className="sticky top-0 z-40 flex h-[76px] items-center border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <MobileNavigation />
        <div className="hidden h-10 w-full max-w-[468px] items-center gap-2.5 rounded-xl border border-border-strong/65 bg-background-elevated/85 px-3.5 text-sm text-muted-foreground shadow-card transition-colors hover:border-border-strong md:flex">
          <Search className="size-[17px] text-text-muted" strokeWidth={1.8} aria-hidden="true" />
          <span>Buscar cliente...</span>
          <kbd className="ml-auto rounded-md border border-border-strong/75 bg-background-soft px-1.5 py-0.5 font-mono text-[0.65rem] text-text-muted shadow-sm">
            ⌘ K
          </kbd>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon-lg"
          className="text-muted-foreground hover:bg-background-soft hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell aria-hidden="true" />
        </Button>
        <Separator
          orientation="vertical"
          className="mx-1 hidden h-7 bg-border/90 sm:block"
        />
        <div className="hidden items-center gap-2.5 rounded-xl px-2 py-1 text-left sm:flex">
          <Avatar size="lg">
            <AvatarFallback className="bg-compass-purple-soft font-semibold text-compass-purple-light ring-1 ring-compass-purple-light/35">
              {getInitials(profile.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-36 truncate text-sm font-medium">
              {profile.fullName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {profile.role === "ADMIN" ? "Administrador" : "Colaborador"}
            </span>
          </span>
        </div>
        <form action={logoutAction}>
          <Button
            variant="ghost"
            size="icon-lg"
            className="text-muted-foreground hover:bg-background-soft hover:text-foreground"
            type="submit"
            aria-label="Sair"
          >
            <LogOut aria-hidden="true" />
          </Button>
        </form>
      </div>
    </header>
  );
}
