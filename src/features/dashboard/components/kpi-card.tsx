import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const toneStyles = {
  neutral:
    "border border-compass-purple-light/15 bg-compass-purple-soft text-compass-purple-light",
  primary:
    "border border-compass-purple-light/15 bg-compass-purple-soft text-compass-purple-light",
  support:
    "border border-compass-taupe/15 bg-compass-taupe/10 text-compass-taupe",
  healthy:
    "border border-status-healthy/15 bg-status-healthy/10 text-status-healthy",
  attention:
    "border border-status-attention/15 bg-status-attention/10 text-status-attention",
  critical:
    "border border-status-critical/15 bg-status-critical/10 text-status-critical",
} as const;

type KpiCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: keyof typeof toneStyles;
};

export function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "neutral",
}: KpiCardProps) {
  return (
    <Card className="min-h-[152px] gap-0 border-none bg-card py-0 shadow-card ring-1 ring-border transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-px hover:bg-card-hover hover:ring-border-strong">
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium leading-5 text-text-secondary">
            {label}
          </p>
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              toneStyles[tone],
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
          </span>
        </div>
        <div className="mt-7">
          <p className="text-[1.75rem] font-semibold leading-none tracking-[-0.045em] text-text-primary">
            {value}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}
