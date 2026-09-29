import { Skeleton } from "@/components/ui/skeleton";

export function ApplicationLoading() {
  return (
    <div className="space-y-6 lg:space-y-7" role="status" aria-live="polite" aria-label="Carregando conteúdo">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-[32rem] max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="w-full space-y-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 max-w-full" />
              </div>
              <Skeleton className="size-10 shrink-0 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="space-y-2 border-b border-border p-5 sm:p-6">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
          <div className="divide-y divide-border px-5 sm:px-6">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-4 py-5">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                </div>
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-6 w-48 max-w-full" />
          <Skeleton className="mt-2 h-3 w-full" />
          <div className="mt-7 space-y-5">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">Carregando...</span>
    </div>
  );
}
