import type { Enums } from "@/types/database";

export const taskStatuses: Array<{
  value: Enums<"task_status">;
  label: string;
  shortLabel: string;
}> = [
  { value: "TODO", label: "Não iniciadas", shortLabel: "Não iniciada" },
  { value: "IN_PROGRESS", label: "Em desenvolvimento", shortLabel: "Desenvolvimento" },
  { value: "REVIEW", label: "Em correção", shortLabel: "Correção" },
  { value: "DONE", label: "Concluídas", shortLabel: "Concluída" },
];

export const taskPriorityLabels: Record<Enums<"task_priority">, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const taskStatusLabels = Object.fromEntries(
  taskStatuses.map((status) => [status.value, status.shortLabel]),
) as Record<Enums<"task_status">, string>;

