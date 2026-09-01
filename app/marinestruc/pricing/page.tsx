import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedIdentity } from "@/lib/auth";
import { MARINESTRUC_POLICY_SLUG, MARINESTRUC_POLICY_VERSION } from "@/lib/marinestruc/policy";
import UserSession from "@/components/UserSession";

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ policy?: string; error?: string }> }) {
  const params = await searchParams;
  const identity = await getAuthenticatedIdentity();
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("license_plans")
    .select("id,code,name,description,display_price,max_devices,term_days,updates_days,billing_mode")
    .eq("active", true)
    .order("sort_order");

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
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-5 flex justify-end"><UserSession /></div>
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">MarineStruc Licensing</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Choose your MarineStruc license</h1>
        <p className="mt-3 text-slate-600">All prices are in Canadian dollars. An authenticated, email-verified account and acceptance of the current MarineStruc policy are required before Checkout.</p>
      </header>

      {params.policy === "accepted" && <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Policy acceptance recorded. You can continue to purchase.</p>}
      {params.error && <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {(plans || []).map((plan) => {
          const isAnnual = plan.code === "annual-1-device";
          const isPerpetual = plan.code === "perpetual-1-device";
          return (
            <article key={plan.id} className={`rounded-2xl border bg-white p-6 shadow-sm ${isAnnual ? "border-teal-600 ring-1 ring-teal-600" : "border-slate-200"}`}>
              {isAnnual && <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-teal-700">Best Value · Save CAD $60/year</p>}
              <h2 className="text-xl font-semibold text-slate-900">{plan.name}</h2>
              <p className="mt-2 min-h-12 text-sm text-slate-600">{plan.description}</p>
              <p className="mt-5 text-3xl font-semibold text-slate-900">{plan.display_price}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li>{plan.max_devices} device{plan.max_devices === 1 ? "" : "s"}</li>
                <li>{plan.billing_mode === "subscription" ? `Automatic ${plan.term_days === 30 ? "monthly" : "annual"} renewal` : "One-time purchase"}</li>
                <li>{isPerpetual ? "Perpetual right to use the purchased license" : "License remains active while the subscription is paid and current"}</li>
                <li>{plan.updates_days ? `${plan.updates_days} days of eligible updates included` : "Applicable updates while the subscription is active"}</li>
              </ul>

              {!identity ? (
                <Link className="mt-6 block rounded-lg bg-teal-700 px-4 py-2.5 text-center font-semibold text-white" href={`/login?next=${encodeURIComponent("/marinestruc/pricing")}`}>Login to Purchase</Link>
              ) : !accepted ? (
                <Link className="mt-6 block rounded-lg bg-amber-600 px-4 py-2.5 text-center font-semibold text-white" href="/marinestruc/policy">Read & Accept Policy</Link>
              ) : (
                <form method="POST" action="/api/checkout" className="mt-6">
                  <input type="hidden" name="planId" value={plan.id} />
                  <button className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white">Purchase</button>
                </form>
              )}
            </article>
          );
        })}
      </section>

      {(!plans || plans.length === 0) && <p className="mt-8 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No active MarineStruc plans are configured yet.</p>}
      <p className="mt-8 text-sm text-slate-500">Taxes, when applicable, are calculated separately at Checkout. Autodesk and AutoCAD are trademarks of Autodesk, Inc.; MarineStruc is independent third-party software.</p>
    </main>
  );
}
