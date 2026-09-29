import type { Enums } from "@/types/database";

export type MetricUnit = {
  key: string;
  name: string;
  symbol: string;
  format: string;
};

export function formatMetricValue(
  value: number | null | undefined,
  unit?: MetricUnit | null,
) {
  if (value == null) return "Não informado";

  if (unit?.format === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(value);
  }

  const formatted = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: unit?.format === "integer" ? 0 : 2,
  }).format(value);

  return unit?.format === "percentage" ? `${formatted}%` : formatted;
}

export function calculateGoalProgress({
  initial,
  target,
  current,
  direction,
}: {
  initial: number | null;
  target: number | null;
  current: number | null;
  direction: Enums<"metric_direction">;
}) {
  if (
    initial == null ||
    target == null ||
    current == null ||
    direction === "NEUTRAL"
  ) {
    return null;
  }

  const denominator =
    direction === "DECREASE" ? initial - target : target - initial;
  if (denominator <= 0) return null;

  const numerator =
    direction === "DECREASE" ? initial - current : current - initial;
  return Math.min(100, Math.max(0, (numerator / denominator) * 100));
}
