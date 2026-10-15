"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function TaskModalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/72 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 lg:p-6">
          <Dialog.Popup className="relative flex h-svh w-full flex-col overflow-hidden bg-background text-foreground outline-none transition duration-200 ease-out data-ending-style:scale-[0.985] data-ending-style:opacity-0 data-starting-style:scale-[0.985] data-starting-style:opacity-0 sm:h-[92svh] sm:max-w-[1380px] sm:rounded-2xl sm:border sm:border-border-strong sm:shadow-soft">
            <Dialog.Title className="sr-only">Detalhes da tarefa</Dialog.Title>
            <Dialog.Close
              render={<Button variant="secondary" size="icon-sm" />}
              className="absolute right-4 top-4 z-20 rounded-full shadow-card"
              aria-label="Fechar tarefa"
            >
              <X aria-hidden="true" />
            </Dialog.Close>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
