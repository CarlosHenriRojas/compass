import type { Enums } from "@/types/database";

export const clientStatusOptions: Array<{
  value: Enums<"client_status">;
  label: string;
}> = [
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "PAUSED", label: "Pausado" },
  { value: "CLOSED", label: "Encerrado" },
];

export const healthStatusOptions: Array<{
  value: Enums<"health_status">;
  label: string;
}> = [
  { value: "HEALTHY", label: "Saudável" },
  { value: "ATTENTION", label: "Atenção" },
  { value: "CRITICAL", label: "Crítico" },
];

export function getClientStatusLabel(status: Enums<"client_status">) {
  return (
    clientStatusOptions.find((option) => option.value === status)?.label ??
    status
  );
}

export function getClientHealthVisualStatus(
  status: Enums<"client_status">,
  health: Enums<"health_status"> | null,
) {
  if (status === "ONBOARDING") return "onboarding" as const;
  if (status === "PAUSED") return "paused" as const;
  if (status === "CLOSED") return "closed" as const;
  if (health === "ATTENTION") return "attention" as const;
  if (health === "CRITICAL") return "critical" as const;
  return "healthy" as const;
}
