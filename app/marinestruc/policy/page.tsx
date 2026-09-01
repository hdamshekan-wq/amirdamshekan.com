import Link from "next/link";
import { getAuthenticatedIdentity } from "@/lib/auth";
import { MARINESTRUC_POLICY_TEXT, MARINESTRUC_POLICY_VERSION } from "@/lib/marinestruc/policy";
import { acceptMarineStrucPolicy } from "./actions";
import UserSession from "@/components/UserSession";

export default async function MarineStrucPolicyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const identity = await getAuthenticatedIdentity();
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <div className="mb-5 flex justify-end"><UserSession /></div>
      <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">MarineStruc</p><h1 className="mt-2 text-4xl font-semibold text-slate-900">License & Product Policy</h1><p className="mt-2 text-slate-600">Version {MARINESTRUC_POLICY_VERSION}</p></div>
      <article className="whitespace-pre-line rounded-2xl border border-slate-200 bg-white p-7 text-[15px] leading-7 text-slate-700 shadow-sm">{MARINESTRUC_POLICY_TEXT}</article>
      {params.error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}
      {identity ? (
        <form action={acceptMarineStrucPolicy} className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-6">
          <label className="flex items-start gap-3 text-sm text-slate-800"><input required type="checkbox" name="accept" value="yes" className="mt-1 h-4 w-4" /><span>I have read and accept MarineStruc License & Product Policy version {MARINESTRUC_POLICY_VERSION}, including the AutoCAD third-party dependency, software limitations, independent professional review requirement, license restrictions, and update terms.</span></label>
          <button className="mt-5 rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white">Accept & Continue to Pricing</button>
        </form>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6"><p className="text-sm text-slate-700">You may read this policy publicly, but you must sign in to record acceptance and purchase MarineStruc.</p><Link href="/login?next=/marinestruc/policy" className="mt-4 inline-block rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white">Login to Accept</Link></div>
      )}
    </main>
  );
}
