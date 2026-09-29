import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>
        <div className="relative isolate overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_0%,var(--compass-purple-soft),transparent_24rem),linear-gradient(180deg,var(--background-soft),var(--background-elevated))] px-6 py-14 text-center shadow-soft sm:px-10 sm:py-16">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-compass-purple-light/20 bg-compass-purple-soft text-compass-purple-light">
            <Compass className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-compass-purple-light">
            Erro 404
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-text-primary sm:text-4xl">
            Página não encontrada
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-text-secondary">
            O endereço pode estar incorreto ou o conteúdo pode ter sido removido. Volte ao dashboard para continuar navegando.
          </p>
          <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "mt-7" })}>
            <ArrowLeft aria-hidden="true" />
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
