import Link from "next/link";
import { getAuthenticatedIdentity } from "@/lib/auth";
import UserSession from "@/components/UserSession";

export default async function MarineStrucPage() {
  const identity = await getAuthenticatedIdentity();
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-5 flex justify-end"><UserSession /></div>
      <section className="overflow-hidden rounded-3xl bg-slate-950 px-8 py-14 text-white md:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">Engineering Software</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-semibold tracking-tight">MarineStruc</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          Marine structural detailing and drafting automation designed for use with compatible Autodesk AutoCAD software.
          Install MarineStruc once, then activate the Full Suite or only the Detailers included in your license.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/marinestruc/pricing" className="rounded-lg bg-teal-500 px-5 py-3 font-semibold text-slate-950">Build Your License</Link>
          <Link href="/marinestruc/policy" className="rounded-lg border border-slate-600 px-5 py-3 font-semibold">License & Product Policy</Link>
          {identity ? <Link href="/account" className="rounded-lg border border-slate-600 px-5 py-3 font-semibold">My Account</Link> : <Link href="/signup" className="rounded-lg border border-slate-600 px-5 py-3 font-semibold">Create Account</Link>}
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900">One installer</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Customers download one protected MarineStruc installer. The license determines which Detailers are unlocked.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900">Configurable licensing</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Choose one, two or all Detailers and select the number of seats required by your team.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900">Protected fulfillment</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Only a verified Stripe payment webhook can provision the purchased module entitlements and seats.</p>
        </article>
      </section>
    </main>
  );
}
