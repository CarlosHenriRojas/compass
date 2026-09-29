const publicUrlName = "NEXT_PUBLIC_SUPABASE_URL";
const publicKeyName = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export function getPublicSupabaseEnv() {
  const url = process.env[publicUrlName];
  const publishableKey = process.env[publicKeyName];

  if (!url || !publishableKey) {
    throw new Error(
      `Configuração incompleta: defina ${publicUrlName} e ${publicKeyName} em .env.local.`,
    );
  }

  return { url, publishableKey };
}

export function getSupabaseSecretKey() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "Configuração incompleta: defina SUPABASE_SECRET_KEY somente no ambiente do servidor.",
    );
  }

  return secretKey;
}
