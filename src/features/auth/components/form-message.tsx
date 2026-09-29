import { CircleAlert, CircleCheck } from "lucide-react";

import type { AuthActionState } from "@/features/auth/auth-state";
import { cn } from "@/lib/utils";

export function FormMessage({ state }: { state: AuthActionState }) {
  if (state.status === "idle" || !state.message) return null;

  const Icon = state.status === "success" ? CircleCheck : CircleAlert;

  return (
    <div
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-5",
        state.status === "success"
          ? "border-status-healthy/25 bg-status-healthy/8 text-status-healthy"
          : "border-status-critical/25 bg-status-critical/8 text-status-critical",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{state.message}</span>
    </div>
  );
}
