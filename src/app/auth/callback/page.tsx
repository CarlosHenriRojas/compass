"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default function AuthCallbackPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function completeAuthentication() {
      const currentUrl = new URL(window.location.href);
      const hashParams = new URLSearchParams(
        currentUrl.hash.startsWith("#")
          ? currentUrl.hash.slice(1)
          : currentUrl.hash,
      );
      const nextPath = safeNextPath(currentUrl.searchParams.get("next"));
      const callbackError =
        currentUrl.searchParams.get("error_description") ??
        hashParams.get("error_description");

      if (callbackError) {
        throw new Error(callbackError);
      }

      const supabase = createClient();
      const code = currentUrl.searchParams.get("code");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
      } else {
        throw new Error("Retorno de autenticação sem credenciais válidas.");
      }

      window.location.replace(nextPath);
    }

    void completeAuthentication().catch(() => {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
      window.location.replace("/login?error=invalid_callback");
    });
  }, []);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle
          className="size-5 animate-spin text-compass-purple-light"
          aria-hidden="true"
        />
        <span>Validando seu acesso...</span>
      </div>
    </main>
  );
}
