import Link from "next/link";
import { requireAuthenticatedIdentity } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import { updateProfile } from "./actions";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const identity = await requireAuthenticatedIdentity("/account");
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: profile }, { data: licenses }, { data: orders }, { data: invoices }, { data: releases }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", identity.userId).maybeSingle(),
    supabase.from("licenses").select("id,license_key,status,starts_at,expires_at,updates_expires_at,max_devices,created_at").eq("user_id", identity.userId).order("created_at", { ascending: false }),
    supabase.from("orders").select("id,status,fulfillment_status,total_minor,currency,paid_at,license_plans(name)").eq("user_id", identity.userId).neq("status", "pending").order("created_at", { ascending: false }),
    supabase.from("invoices").select("id,invoice_number,total_minor,currency,issued_at").eq("user_id", identity.userId).order("issued_at", { ascending: false }),
    supabase.from("software_releases").select("id,version,release_notes,published_at").eq("active", true).order("published_at", { ascending: false }),
  ]);

  const now = new Date();
  const activeLicenses = (licenses || []).filter((l) => l.status === "active" && (!l.expires_at || new Date(l.expires_at) > now));
  const entitledReleases = (releases || []).filter((release) => activeLicenses.some((license) => {
    if (license.expires_at) return true;
    return !license.updates_expires_at || new Date(release.published_at) <= new Date(license.updates_expires_at);
  }));
  const hasActiveLicense = activeLicenses.length > 0;
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Customer Portal</p><h1 className="mt-1 text-4xl font-semibold text-slate-900">My Account</h1><p className="mt-2 text-slate-600">{identity.email}</p></div><form action={logout}><button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Logout</button></form></div>
      {params.message && <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{params.message}</p>}{params.error && <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">My Licenses</h2><div className="mt-4 space-y-3">{(licenses || []).map((l) => <div key={l.id} className="rounded-xl bg-slate-50 p-4 text-sm"><div className="flex justify-between gap-3"><strong className="break-all">{l.license_key}</strong><span className="uppercase text-teal-700">{l.status}</span></div><p className="mt-2 text-slate-600">Devices: {l.max_devices} · Expires: {l.expires_at ? new Date(l.expires_at).toLocaleDateString("en-CA") : "Perpetual"}{!l.expires_at && l.updates_expires_at ? ` · Updates through ${new Date(l.updates_expires_at).toLocaleDateString("en-CA")}` : ""}</p></div>)}{(!licenses || licenses.length === 0) && <p className="text-sm text-slate-600">No provisioned licenses yet.</p>}</div><Link href="/marinestruc/pricing" className="mt-5 inline-block text-sm font-semibold text-teal-700">Purchase a license →</Link></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Downloads</h2><div className="mt-4 space-y-3">{hasActiveLicense ? entitledReleases.map((r) => <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><strong>MarineStruc {r.version}</strong><p className="text-xs text-slate-500">{r.release_notes || "Current release"}</p></div><a href={`/api/download/${r.id}`} className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Download</a></div>) : <p className="text-sm text-slate-600">An active license is required to access private downloads.</p>}{hasActiveLicense && (releases || []).length === 0 && <p className="text-sm text-slate-600">No software release is currently available.</p>}{hasActiveLicense && (releases || []).length > 0 && entitledReleases.length === 0 && <p className="text-sm text-slate-600">Your license remains valid, but the current releases are outside your included update entitlement.</p>}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Orders</h2><div className="mt-4 space-y-3">{(orders || []).map((o) => <div key={o.id} className="rounded-xl bg-slate-50 p-4 text-sm"><strong>{(o.license_plans as unknown as {name?:string} | null)?.name || "MarineStruc"}</strong><p className="mt-1 text-slate-600">{o.status} · {o.fulfillment_status} · {new Intl.NumberFormat("en-CA", { style: "currency", currency: (o.currency || "cad").toUpperCase() }).format((o.total_minor || 0)/100)}</p></div>)}{(!orders || orders.length === 0) && <p className="text-sm text-slate-600">No orders yet.</p>}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Invoices</h2><div className="mt-4 space-y-3">{(invoices || []).map((i) => <div key={i.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 text-sm"><div><strong>{i.invoice_number}</strong><p className="text-slate-600">{new Intl.NumberFormat("en-CA", { style: "currency", currency: (i.currency || "cad").toUpperCase() }).format((i.total_minor || 0)/100)}</p></div><a href={`/api/invoice/${i.id}`} className="font-semibold text-teal-700">PDF</a></div>)}{(!invoices || invoices.length === 0) && <p className="text-sm text-slate-600">No invoices yet.</p>}</div></div>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Profile</h2><form action={updateProfile} className="mt-4 grid gap-4 sm:grid-cols-2"><input name="firstName" defaultValue={profile?.first_name || ""} placeholder="First name" className="rounded-lg border border-slate-300 px-3 py-2"/><input name="lastName" defaultValue={profile?.last_name || ""} placeholder="Last name" className="rounded-lg border border-slate-300 px-3 py-2"/><input name="company" defaultValue={profile?.company || ""} placeholder="Company" className="rounded-lg border border-slate-300 px-3 py-2"/><input name="phone" defaultValue={profile?.phone || ""} placeholder="Phone" className="rounded-lg border border-slate-300 px-3 py-2"/><button className="sm:col-span-2 w-fit rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white">Save profile</button></form><Link href="/update-password" className="mt-4 inline-block text-sm font-semibold text-teal-700">Change password →</Link></section>
    </main>
  );
}
