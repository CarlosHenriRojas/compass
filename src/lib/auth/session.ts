import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "COLLABORATOR";
  avatarPath: string | null;
};

export const getCurrentProfile = cache(
  async (): Promise<CurrentProfile | null> => {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;

    const userId = typeof claims?.sub === "string" ? claims.sub : null;
    if (!userId) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_path, active")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile || !profile.active) return null;

    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
      avatarPath: profile.avatar_path,
    };
  },
);

export async function requireCurrentProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/access-disabled");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireCurrentProfile();
  if (profile.role !== "ADMIN") redirect("/dashboard");
  return profile;
}
