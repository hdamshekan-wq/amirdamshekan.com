import Link from "next/link";

export default function BackToHome() {
  return (
    <div className="mb-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
      >
        <span aria-hidden="true">←</span>
        Back to Home
      </Link>
    </div>
  );
}
