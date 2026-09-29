import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";

export const metadata: Metadata = {
  title: "Nova senha",
};

export default function UpdatePasswordPage() {
  return (
    <div>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-compass-purple-light">
        Segurança
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
        Crie uma nova senha
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Utilize pelo menos 8 caracteres e não reutilize senhas de outros serviços.
      </p>
      <UpdatePasswordForm />
    </div>
  );
}
