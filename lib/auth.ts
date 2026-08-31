import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedIdentity() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : undefined;

  if (error || !userId) return null;

  return {
    userId,
    email: typeof claims?.email === "string" ? claims?.email : undefined,
  };
}

export async function requireAuthenticatedIdentity(next?: string) {
  const identity = await getAuthenticatedIdentity();
  if (!identity) {
    const suffix = next ? `?next=${encodeURIComponent(next)}` : "";
    redirect(`/login${suffix}`);
  }
  return identity;
}
