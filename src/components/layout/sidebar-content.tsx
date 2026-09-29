import { Brand } from "@/components/layout/brand";
import { SidebarNavigation } from "@/components/layout/sidebar-navigation";

type SidebarContentProps = {
  onNavigate?: () => void;
};

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_10%_0%,var(--compass-purple-soft),transparent_17rem),var(--sidebar)] text-sidebar-foreground">
      <div className="flex h-[76px] items-center border-b border-sidebar-border px-5">
        <Brand />
      </div>

      <div className="flex-1 px-3 py-7">
        <p className="mb-3.5 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/45">
          Gestão
        </p>
        <SidebarNavigation onNavigate={onNavigate} />
      </div>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-xl border border-sidebar-border bg-background-elevated/65 p-3.5 shadow-card">
          <div className="flex items-center gap-2 text-xs font-medium text-sidebar-accent-foreground">
            <span className="size-1.5 rounded-full bg-status-healthy shadow-[0_0_10px_color-mix(in_srgb,var(--status-healthy)_45%,transparent)]" />
            Ambiente interno
          </div>
          <p className="mt-1.5 text-xs leading-5 text-sidebar-foreground/55">
            Inteligência da carteira Compass.
          </p>
        </div>
      </div>
    </div>
  );
}
