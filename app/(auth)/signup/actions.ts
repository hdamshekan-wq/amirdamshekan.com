"use server";

import { authSiteOrigin } from "@/lib/auth-redirect";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const origin = authSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL, process.env.NODE_ENV === "production");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/marinestruc/policy`,
      data: { first_name: firstName, last_name: lastName, company },
    },
  });

  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  redirect(`/login?message=${encodeURIComponent("Check your email to verify your account before purchasing MarineStruc.")}`);
}
