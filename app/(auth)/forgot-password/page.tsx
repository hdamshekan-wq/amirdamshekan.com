import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        {params.error && <p className="mt-4 text-sm text-red-700">{params.error}</p>}
        {params.message && <p className="mt-4 text-sm text-emerald-700">{params.message}</p>}
        <form action={requestPasswordReset} className="mt-6 space-y-4">
          <input required type="email" name="email" placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <button className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white">Send reset link</button>
        </form>
      </section>
    </main>
  );
}
