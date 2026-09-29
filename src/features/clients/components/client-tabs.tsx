import Link from "next/link";

import { cn } from "@/lib/utils";

type ClientTab =
  | "overview"
  | "goals"
  | "metrics"
  | "updates"
  | "contract"
  | "documents";

const tabs: Array<{
  key: ClientTab;
  label: string;
  enabled: boolean;
}> = [
  { key: "overview", label: "Visão geral", enabled: true },
  { key: "goals", label: "Objetivos", enabled: true },
  { key: "metrics", label: "Métricas", enabled: true },
  { key: "updates", label: "Atualizações", enabled: true },
  { key: "contract", label: "Contrato", enabled: true },
  { key: "documents", label: "Documentos", enabled: true },
];

export function ClientTabs({
  clientId,
  active,
}: {
  clientId: string;
  active: ClientTab;
}) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-border"
      aria-label="Seções do cliente"
    >
      {tabs.map((tab) => {
        const className = cn(
          "whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors",
          active === tab.key
            ? "border-compass-purple-light font-semibold text-foreground"
            : "border-transparent text-text-muted",
          tab.enabled &&
            active !== tab.key &&
            "hover:border-border-strong hover:text-foreground",
          !tab.enabled && "cursor-not-allowed",
        );

        return tab.enabled ? (
          <Link
            key={tab.key}
            href={`/clients/${clientId}/${tab.key}`}
            className={className}
          >
            {tab.label}
          </Link>
        ) : (
          <span
            key={tab.key}
            className={className}
            title="Disponível nas próximas etapas"
          >
            {tab.label}
          </span>
        );
      })}
    </nav>
  );
}
