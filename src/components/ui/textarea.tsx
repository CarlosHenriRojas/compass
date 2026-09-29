import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full resize-y rounded-xl border border-border-strong/70 bg-background-elevated/75 px-3 py-2.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] outline-none transition-[color,background-color,border-color,box-shadow] duration-200 placeholder:text-text-muted hover:border-border-strong focus-visible:border-compass-purple-light/70 focus-visible:ring-3 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-55 aria-invalid:border-destructive/70 aria-invalid:ring-3 aria-invalid:ring-destructive/15",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
