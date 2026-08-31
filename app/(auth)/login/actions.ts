"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/account");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  redirect(next.startsWith("/") ? next : "/account");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin = (await headers()).get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
  redirect(origin ? `${origin}/` : "/");
}
