import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">MarineStruc Account</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Login</h1>
        {params.error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{params.error}</p>}
        {params.message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{params.message}</p>}
        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={params.next || "/account"} />
          <label className="block text-sm font-medium text-slate-700">Email<input required type="email" name="email" autoComplete="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-700">Password<input required type="password" name="password" autoComplete="current-password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          <button className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white hover:bg-teal-800">Login</button>
        </form>
        <div className="mt-5 flex justify-between text-sm">
          <Link className="text-teal-700 hover:underline" href="/signup">Create account</Link>
          <Link className="text-teal-700 hover:underline" href="/forgot-password">Forgot password?</Link>
        </div>
      </section>
    </main>
  );
}
