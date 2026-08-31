"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/update-password` });
  if (error) redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  redirect(`/forgot-password?message=${encodeURIComponent("If the account exists, a password reset link has been sent.")}`);
}
