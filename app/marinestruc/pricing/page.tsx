import BackToHome from "@/components/BackToHome";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedIdentity } from "@/lib/auth";
import { MARINESTRUC_POLICY_SLUG, MARINESTRUC_POLICY_VERSION } from "@/lib/marinestruc/policy";
import UserSession from "@/components/UserSession";
import PurchaseConfigurator from "@/components/marinestruc/PurchaseConfigurator";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ policy?: string; error?: string }>;
}) {
  const params = await searchParams;
  const identity = await getAuthenticatedIdentity();
  const supabase = await createClient();

  let accepted = false;
  if (identity) {
    const { data: currentPolicy } = await supabase
      .from("policy_versions")
      .select("id")
      .eq("slug", MARINESTRUC_POLICY_SLUG)
      .eq("version", MARINESTRUC_POLICY_VERSION)
      .eq("active", true)
      .single();

    if (currentPolicy) {
      const { data: acceptance } = await supabase
        .from("policy_acceptances")
        .select("id")
        .eq("user_id", identity.userId)
        .eq("policy_version_id", currentPolicy.id)
        .maybeSingle();
      accepted = !!acceptance;
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-14">
      <BackToHome />
      <div className="mb-5 flex justify-end"><UserSession /></div>
      <header className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">MarineStruc Purchase</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Choose the Detailers, seats and license term you need.</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          MarineStruc uses one installer. Your license controls which Detailers are enabled and how many seats may be active.
          All prices below are in Canadian dollars.
        </p>
      </header>

      {params.policy === "accepted" && (
        <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          Policy acceptance recorded. You can continue to purchase.
        </p>
      )}
      {params.error && (
        <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error}</p>
      )}

      <PurchaseConfigurator authenticated={!!identity} policyAccepted={accepted} />

      <p className="mt-8 text-sm text-slate-500">
        Annual pricing includes a 15% discount. The 4-Year License uses the agreed four-year pricing formula and expires at the end of its four-year term.
        Multi-seat discounts are applied to every seat in the order: 2 seats 10%, 3 seats 20%, and 4 or more seats 30% maximum.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Autodesk and AutoCAD are trademarks of Autodesk, Inc.; MarineStruc is independent third-party software.
      </p>
    </main>
  );
}
