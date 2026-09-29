import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export default function AccessDisabledPage() {
  return (
    <div className="text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-status-attention/10 text-status-attention">
        <ShieldAlert className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">
        Acesso indisponível
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Seu usuário não possui um perfil ativo no Compass Hub. Solicite a liberação a um administrador.
      </p>
      <form action={logoutAction} className="mt-7">
        <Button type="submit" className="w-full">
          Voltar ao login
        </Button>
      </form>
    </div>
  );
}
