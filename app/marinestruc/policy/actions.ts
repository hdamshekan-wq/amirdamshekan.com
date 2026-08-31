"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuthenticatedIdentity } from "@/lib/auth";
import { MARINESTRUC_POLICY_SLUG, MARINESTRUC_POLICY_VERSION } from "@/lib/marinestruc/policy";

export async function acceptMarineStrucPolicy(formData: FormData) {
  const identity = await requireAuthenticatedIdentity("/marinestruc/policy");
  if (formData.get("accept") !== "yes") redirect("/marinestruc/policy?error=You%20must%20accept%20the%20policy%20to%20continue.");

  const supabase = await createClient();
  const { data: policy, error: policyError } = await supabase
    .from("policy_versions")
    .select("id")
    .eq("slug", MARINESTRUC_POLICY_SLUG)
    .eq("version", MARINESTRUC_POLICY_VERSION)
    .eq("active", true)
    .single();
  if (policyError || !policy) redirect("/marinestruc/policy?error=Active%20policy%20version%20is%20not%20configured.");

  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const { error } = await supabase.from("policy_acceptances").upsert({
    user_id: identity.userId,
    policy_version_id: policy.id,
    accepted_at: new Date().toISOString(),
    ip_address: forwarded,
    user_agent: h.get("user-agent"),
  }, { onConflict: "user_id,policy_version_id" });

  if (error) redirect(`/marinestruc/policy?error=${encodeURIComponent(error.message)}`);
  redirect("/marinestruc/pricing?policy=accepted");
}
