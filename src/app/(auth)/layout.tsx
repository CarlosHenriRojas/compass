import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(360px,0.85fr)_minmax(560px,1.15fr)]">
      <aside className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_18%_12%,var(--compass-purple-soft),transparent_32%),linear-gradient(145deg,var(--background-elevated),var(--compass-deep-brown))] p-10 text-compass-paper lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-compass-cream/8" />
        <div className="absolute -right-10 -top-10 size-52 rounded-full border border-compass-cream/8" />
        <Brand />

        <div className="relative max-w-lg">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-compass-cream/55">
            Central de inteligência
          </p>
          <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.045em] xl:text-4xl">
            Clareza sobre cada cliente, em menos de 60 segundos.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-compass-cream/65">
            Informações estratégicas, resultados e próximos passos da carteira Compass em um só lugar.
          </p>
        </div>

        <p className="text-xs text-compass-cream/40">
          Uso interno · Compass Agência
        </p>
      </aside>

      <main className="flex min-h-svh items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-compass-purple text-primary-foreground">
              C
            </span>
            <span className="font-semibold tracking-tight">Compass Hub</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
