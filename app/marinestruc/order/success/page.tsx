import Link from "next/link";
import { requireAuthenticatedIdentity } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const identity = await requireAuthenticatedIdentity("/account");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: order } = params.session_id ? await supabase.from("orders").select("status,fulfillment_status,total_minor,currency").eq("user_id", identity.userId).eq("stripe_checkout_session_id", params.session_id).maybeSingle() : { data: null };

  return <main className="mx-auto max-w-2xl px-6 py-20"><section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-3xl font-semibold text-slate-900">Payment received</h1><p className="mt-4 text-slate-600">Stripe has returned you to the site. License creation is based only on the verified server webhook, not this page.</p><p className="mt-4 text-sm text-slate-700">Order status: <strong>{order?.status || "Confirming payment"}</strong><br/>Provisioning: <strong>{order?.fulfillment_status || "Processing"}</strong></p><Link href="/account" className="mt-7 inline-block rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white">Open My Account</Link></section></main>;
}
