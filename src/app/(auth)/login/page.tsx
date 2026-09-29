import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "/dashboard";

  return (
    <div>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-compass-purple-light">
        Acesso interno
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
        Entre na sua conta
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Use o e-mail cadastrado pela administração da Compass.
      </p>
      <LoginForm nextPath={nextPath} />
      <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
        O acesso é restrito a usuários autorizados. Não existe cadastro público.
      </p>
    </div>
  );
}
