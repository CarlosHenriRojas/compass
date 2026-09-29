import { Compass } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-3" aria-label="Compass Hub">
      <span className="flex size-10 items-center justify-center rounded-xl bg-[linear-gradient(145deg,var(--compass-purple-hover),var(--compass-purple))] text-sidebar-primary-foreground shadow-[0_8px_24px_color-mix(in_srgb,var(--compass-purple)_28%,transparent)] ring-1 ring-compass-purple-light/30">
        <Compass className="size-[19px]" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-compass-purple-light">
          Compass
        </span>
        <span className="mt-0.5 block text-sm font-semibold tracking-tight text-sidebar-accent-foreground">
          Hub
        </span>
      </span>
    </div>
  );
}
