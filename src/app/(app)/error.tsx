"use client";

import { CircleAlert, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ApplicationError({ retry }: { retry: () => void }) {
  return (
    <div className="relative isolate flex min-h-[520px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-status-critical/20 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--status-critical)_10%,transparent),transparent_24rem),linear-gradient(180deg,var(--background-soft),var(--background-elevated))] px-6 py-16 text-center shadow-card">
      <span className="mb-5 flex size-12 items-center justify-center rounded-xl border border-status-critical/25 bg-status-critical/10 text-status-critical">
        <CircleAlert className="size-5" aria-hidden="true" />
      </span>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-status-critical">
        Falha temporária
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-text-primary sm:text-3xl">
        Não foi possível carregar esta página
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-text-secondary">
        Seus dados continuam seguros. Tente carregar o conteúdo novamente; se o problema persistir, volte ao painel e repita a operação.
      </p>
      <Button type="button" size="lg" className="mt-6" onClick={retry}>
        <RefreshCw aria-hidden="true" />
        Tentar novamente
      </Button>
    </div>
  );
}
