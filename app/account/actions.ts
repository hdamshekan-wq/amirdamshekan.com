"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedIdentity } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const identity = await requireAuthenticatedIdentity("/account");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({
    first_name: String(formData.get("firstName") || "").trim(),
    last_name: String(formData.get("lastName") || "").trim(),
    company: String(formData.get("company") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    updated_at: new Date().toISOString(),
  }).eq("id", identity.userId);
  if (error) redirect(`/account?error=${encodeURIComponent(error.message)}`);
  redirect("/account?message=Profile%20updated.");
}
