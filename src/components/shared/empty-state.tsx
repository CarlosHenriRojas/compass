import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CircleDashed } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon: Icon = CircleDashed,
  action,
}: EmptyStateProps) {
  return (
    <div className="relative isolate flex min-h-[320px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border-strong/65 bg-[radial-gradient(circle_at_50%_0%,var(--compass-purple-soft),transparent_18rem),linear-gradient(180deg,var(--background-soft),var(--background-elevated))] px-6 py-14 text-center shadow-card">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 -z-10 h-px w-48 bg-[linear-gradient(90deg,transparent,var(--compass-purple-light),transparent)] opacity-50"
      />
      <span className="mb-5 flex size-12 items-center justify-center rounded-xl border border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light shadow-[0_10px_30px_color-mix(in_srgb,var(--compass-purple)_18%,transparent)]">
        <Icon className="size-5" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold tracking-[-0.02em] text-text-primary">
        {title}
      </h2>
      <p className="mt-2.5 max-w-md text-sm leading-6 text-text-secondary">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
