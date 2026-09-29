import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const healthStyles = {
  healthy:
    "border-status-healthy/15 bg-status-healthy/12 text-status-healthy",
  attention:
    "border-status-attention/15 bg-status-attention/12 text-status-attention",
  critical:
    "border-status-critical/15 bg-status-critical/12 text-status-critical",
  onboarding:
    "border-status-onboarding/15 bg-status-onboarding/12 text-status-onboarding",
  paused: "border-status-paused/15 bg-status-paused/12 text-status-paused",
  closed: "border-status-paused/15 bg-status-paused/12 text-status-paused",
} as const;

const healthLabels = {
  healthy: "Saudável",
  attention: "Atenção",
  critical: "Crítico",
  onboarding: "Onboarding",
  paused: "Pausado",
  closed: "Encerrado",
} as const;

type ClientHealthBadgeProps = {
  status: keyof typeof healthStyles;
  className?: string;
};

export function ClientHealthBadge({
  status,
  className,
}: ClientHealthBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium",
        healthStyles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {healthLabels[status]}
    </Badge>
  );
}
