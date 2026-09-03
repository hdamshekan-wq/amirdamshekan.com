import BackToHome from "@/components/navigation/BackToHome";
import Link from "next/link";
import { requireAuthenticatedIdentity } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";
import UserSession from "@/components/UserSession";
import {
  MARINESTRUC_MODULES,
  normalizeMarineStrucModules,
} from "@/lib/marinestruc/pricing";

function moduleLabel(moduleCodes: unknown, fullSuite?: boolean | null) {
  if (fullSuite) return "Full Suite · All Detailers";
  const codes = normalizeMarineStrucModules(Array.isArray(moduleCodes) ? moduleCodes.map(String) : []);
  if (!codes.length) return "MarineStruc";
  return codes
    .map((code) => MARINESTRUC_MODULES.find((item) => item.code === code)?.name || code)
    .join(" · ");
}

function termLabel(term?: string | null, expiresAt?: string | null) {
  if (term === "monthly") return "Monthly";
  if (term === "annual") return "Annual";
  if (term === "four_year") return "4-Year License";
  return expiresAt ? "Term License" : "Legacy Perpetual";
}

function isRecurringTerm(term?: string | null) {
  return term === "monthly" || term === "annual";
}

function subscriptionStatusLabel(stripeStatus?: string | null, licenseStatus?: string | null) {
  if (stripeStatus === "past_due") return "Past Due";
  if (stripeStatus === "unpaid" || stripeStatus === "paused") return "Suspended";
  if (stripeStatus === "canceled" || stripeStatus === "incomplete_expired") return "Expired";
  if (stripeStatus === "active" || stripeStatus === "trialing") return "Active";
  if (stripeStatus === "incomplete") return "Payment Pending";
  if (licenseStatus === "suspended") return "Suspended";
  if (licenseStatus === "expired" || licenseStatus === "revoked") return "Expired";
  if (licenseStatus === "active") return "Active";
  return "Unknown";
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const identity = await requireAuthenticatedIdentity("/account");
  const params = await searchParams;
  const supabase = await createClient();

  const [{ data: profile }, { data: licenses }, { data: orders }, { data: invoices }, { data: releases }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name,last_name,company,phone,stripe_customer_id")
      .eq("id", identity.userId)
      .maybeSingle(),
    supabase
      .from("licenses")
      .select("id,license_key,status,starts_at,expires_at,updates_expires_at,max_devices,created_at,purchase_term,seat_count,module_codes,full_suite,stripe_subscription_status,stripe_cancel_at_period_end,stripe_current_period_end")
      .eq("user_id", identity.userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id,status,fulfillment_status,total_minor,currency,paid_at,purchase_term,seat_count,module_codes,full_suite,license_plans(name)")
      .eq("user_id", identity.userId)
      .neq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id,invoice_number,total_minor,currency,issued_at")
      .eq("user_id", identity.userId)
      .order("issued_at", { ascending: false }),
    supabase
      .from("software_releases")
      .select("id,version,release_notes,published_at")
      .eq("active", true)
      .order("published_at", { ascending: false }),
  ]);

  const now = new Date();
  const activeLicenses = (licenses || []).filter(
    (license) => license.status === "active" && (!license.expires_at || new Date(license.expires_at) > now),
  );
  const entitledReleases = (releases || []).filter((release) =>
    activeLicenses.some((license) => {
      if (license.expires_at) return true;
      return !license.updates_expires_at || new Date(release.published_at) <= new Date(license.updates_expires_at);
    }),
  );
  const hasActiveLicense = activeLicenses.length > 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <BackToHome />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Customer Portal</p>
          <h1 className="mt-1 text-4xl font-semibold text-slate-900">My Account</h1>
          <p className="mt-2 text-slate-600">{identity.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {profile?.stripe_customer_id && (
            <form method="post" action="/api/billing-portal">
              <button className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                Manage Billing
              </button>
            </form>
          )}
          <UserSession showAccountLink={false} />
        </div>
      </div>

      {params.message && <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{params.message}</p>}
      {params.error && <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">My Licenses</h2>
          <div className="mt-4 space-y-3">
            {(licenses || []).map((license) => {
              const recurring = isRecurringTerm(license.purchase_term);
              const billingStatus = subscriptionStatusLabel(license.stripe_subscription_status, license.status);
              const cancellationDate = license.stripe_cancel_at_period_end
                ? license.stripe_current_period_end || license.expires_at
                : null;

              return (
              <div key={license.id} className="rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex flex-wrap justify-between gap-3">
                  <strong className="break-all">{license.license_key}</strong>
                  <span className="uppercase text-teal-700">License {license.status}</span>
                </div>
                <p className="mt-2 font-medium text-slate-800">
                  {termLabel(license.purchase_term, license.expires_at)} · {license.seat_count || license.max_devices} seat{(license.seat_count || license.max_devices) === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-slate-600">{moduleLabel(license.module_codes, license.full_suite)}</p>
                {recurring && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="font-medium text-slate-800">Subscription/Billing: {billingStatus}</p>
                    {license.stripe_cancel_at_period_end && cancellationDate && (
                      <p className="mt-1 text-amber-700">
                        Cancels on {new Date(cancellationDate).toLocaleDateString("en-CA")}
                      </p>
                    )}
                  </div>
                )}
                <p className="mt-1 text-slate-600">
                  Expires: {license.expires_at ? new Date(license.expires_at).toLocaleDateString("en-CA") : "No runtime expiry"}
                  {!license.expires_at && license.updates_expires_at ? ` · Updates through ${new Date(license.updates_expires_at).toLocaleDateString("en-CA")}` : ""}
                </p>
              </div>
              );
            })}
            {(!licenses || licenses.length === 0) && <p className="text-sm text-slate-600">No provisioned licenses yet.</p>}
          </div>
          <Link href="/marinestruc/pricing" className="mt-5 inline-block text-sm font-semibold text-teal-700">Purchase a license →</Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Downloads</h2>
          <p className="mt-2 text-sm text-slate-500">The same MarineStruc installer is used for every package. Your license controls which Detailers are enabled.</p>
          <div className="mt-4 space-y-3">
            {hasActiveLicense ? (
              (releases || []).length === 0 ? (
                <p className="text-sm text-slate-600">No software release is currently available.</p>
              ) : (
                entitledReleases.map((release) => (
                  <div key={release.id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
                    <div>
                      <strong>MarineStruc {release.version}</strong>
                      <p className="text-xs text-slate-500">{release.release_notes || "Current release"}</p>
                    </div>
                    <a href={`/api/download/${release.id}`} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Download Installer</a>
                  </div>
                ))
              )
            ) : (
              <p className="text-sm text-slate-600">An active license is required to access private downloads.</p>
            )}
            {hasActiveLicense && (releases || []).length > 0 && entitledReleases.length === 0 && (
              <p className="text-sm text-slate-600">Your license is not entitled to the currently published release.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Orders</h2>
          <div className="mt-4 space-y-3">
            {(orders || []).map((order) => (
              <div key={order.id} className="rounded-xl bg-slate-50 p-4 text-sm">
                <strong>MarineStruc · {termLabel(order.purchase_term)}</strong>
                <p className="mt-1 text-slate-600">{moduleLabel(order.module_codes, order.full_suite)}</p>
                <p className="mt-1 text-slate-600">
                  {order.seat_count || 1} seat{(order.seat_count || 1) === 1 ? "" : "s"} · {order.status} · {order.fulfillment_status} · {new Intl.NumberFormat("en-CA", {
                    style: "currency",
                    currency: (order.currency || "cad").toUpperCase(),
                  }).format((order.total_minor || 0) / 100)}
                </p>
              </div>
            ))}
            {(!orders || orders.length === 0) && <p className="text-sm text-slate-600">No orders yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Invoices</h2>
          <div className="mt-4 space-y-3">
            {(invoices || []).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 text-sm">
                <div>
                  <strong>{invoice.invoice_number}</strong>
                  <p className="text-slate-600">{new Intl.NumberFormat("en-CA", {
                    style: "currency",
                    currency: (invoice.currency || "cad").toUpperCase(),
                  }).format((invoice.total_minor || 0) / 100)}</p>
                </div>
                <a href={`/api/invoice/${invoice.id}`} className="font-semibold text-teal-700">PDF</a>
              </div>
            ))}
            {(!invoices || invoices.length === 0) && <p className="text-sm text-slate-600">No invoices yet.</p>}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Profile</h2>
        <form action={updateProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input name="firstName" defaultValue={profile?.first_name || ""} placeholder="First name" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input name="lastName" defaultValue={profile?.last_name || ""} placeholder="Last name" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input name="company" defaultValue={profile?.company || ""} placeholder="Company" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input name="phone" defaultValue={profile?.phone || ""} placeholder="Phone" className="rounded-lg border border-slate-300 px-3 py-2" />
          <button className="sm:col-span-2 w-fit rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white">Save profile</button>
        </form>
        <Link href="/update-password" className="mt-4 inline-block text-sm font-semibold text-teal-700">Change password →</Link>
      </section>
    </main>
  );
}
