import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  getPublicSupabaseEnv,
  getSupabaseSecretKey,
} from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const { url } = getPublicSupabaseEnv();

  return createClient<Database>(url, getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
