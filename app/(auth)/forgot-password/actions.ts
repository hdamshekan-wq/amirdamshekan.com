"use server";

import { authSiteOrigin } from "@/lib/auth-redirect";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const origin = authSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL, process.env.NODE_ENV === "production");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/update-password` });
  if (error) redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  redirect(`/forgot-password?message=${encodeURIComponent("If the account exists, a password reset link has been sent.")}`);
}
