import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">MarineStruc Account</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">An account and verified email are required before purchasing or downloading MarineStruc.</p>
        {params.error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}
        {params.message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{params.message}</p>}
        <form action={signup} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">First name<input required name="firstName" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700">Last name<input required name="lastName" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Company (optional)<input name="company" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Email<input required type="email" name="email" autoComplete="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Password<input required minLength={10} type="password" name="password" autoComplete="new-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <button className="sm:col-span-2 rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white hover:bg-teal-800">Create account</button>
        </form>
        <p className="mt-5 text-sm text-slate-600">Already registered? <Link className="text-teal-700 hover:underline" href="/login">Login</Link></p>
      </section>
    </main>
  );
}
