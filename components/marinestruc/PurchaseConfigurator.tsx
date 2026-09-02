"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatCadMinor,
  MARINESTRUC_MODULES,
  marineStrucSeatDiscountPercent,
  quoteMarineStrucPurchase,
  type MarineStrucModuleCode,
  type MarineStrucPurchaseTerm,
} from "@/lib/marinestruc/pricing";

type Props = {
  authenticated: boolean;
  policyAccepted: boolean;
};

export default function PurchaseConfigurator({ authenticated, policyAccepted }: Props) {
  const [packageMode, setPackageMode] = useState<"full" | "custom">("full");
  const [customModules, setCustomModules] = useState<MarineStrucModuleCode[]>(["walkway"]);
  const [seats, setSeats] = useState(1);
  const [term, setTerm] = useState<MarineStrucPurchaseTerm>("monthly");

  const selectedModules = packageMode === "full"
    ? MARINESTRUC_MODULES.map((module) => module.code)
    : customModules;

  const quotes = useMemo(() => {
    const terms: MarineStrucPurchaseTerm[] = ["monthly", "annual", "four_year"];
    return Object.fromEntries(
      terms.map((termCode) => [
        termCode,
        quoteMarineStrucPurchase({ moduleCodes: selectedModules, seats, term: termCode }),
      ]),
    ) as Record<MarineStrucPurchaseTerm, ReturnType<typeof quoteMarineStrucPurchase>>;
  }, [selectedModules.join("|"), seats]);

  const quote = quotes[term];

  function toggleModule(code: MarineStrucModuleCode) {
    setCustomModules((current) => {
      if (current.includes(code)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== code);
      }
      return [...current, code];
    });
  }

  const cta = !authenticated ? (
    <Link
      href={`/login?next=${encodeURIComponent("/marinestruc/pricing")}`}
      className="block w-full rounded-xl bg-teal-700 px-5 py-3 text-center font-semibold text-white hover:bg-teal-800"
    >
      Login to Purchase
    </Link>
  ) : !policyAccepted ? (
    <Link
      href="/marinestruc/policy"
      className="block w-full rounded-xl bg-amber-600 px-5 py-3 text-center font-semibold text-white hover:bg-amber-700"
    >
      Read & Accept Policy
    </Link>
  ) : (
    <button className="w-full rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">
      Continue to Secure Checkout
    </button>
  );

  return (
    <form method="POST" action="/api/checkout" className="mt-10 grid gap-7 lg:grid-cols-[1.35fr_.65fr]">
      <input type="hidden" name="term" value={term} />
      <input type="hidden" name="seats" value={seats} />
      {selectedModules.map((code) => <input key={code} type="hidden" name="modules" value={code} />)}

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Step 1</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Select Product</h2>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Product
            <select className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" value="marinestruc" disabled>
              <option value="marinestruc">MarineStruc</option>
            </select>
          </label>
          <p className="mt-3 text-sm text-slate-500">One MarineStruc installer is used for every purchase. Your license unlocks only the Detailers you buy.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Step 2</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Choose Detailers</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPackageMode("full")}
              className={`rounded-xl border p-4 text-left ${packageMode === "full" ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600" : "border-slate-200"}`}
            >
              <strong className="block text-slate-900">Full Suite</strong>
              <span className="mt-1 block text-sm text-slate-600">All current MarineStruc Detailers · base CAD $25/month per seat</span>
            </button>
            <button
              type="button"
              onClick={() => setPackageMode("custom")}
              className={`rounded-xl border p-4 text-left ${packageMode === "custom" ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600" : "border-slate-200"}`}
            >
              <strong className="block text-slate-900">Build Your Package</strong>
              <span className="mt-1 block text-sm text-slate-600">1 Detailer = $15/month · 2 = $20/month · 3 = $25/month</span>
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {MARINESTRUC_MODULES.map((module) => {
              const selected = selectedModules.includes(module.code);
              return (
                <label key={module.code} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${selected ? "border-teal-300 bg-teal-50" : "border-slate-200"}`}>
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={packageMode === "full"}
                    onChange={() => toggleModule(module.code)}
                    className="mt-1 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-slate-800">{module.name}</span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Step 3</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Number of Seats</h2>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-slate-700">
              Seats
              <input
                type="number"
                min={1}
                max={20}
                value={seats}
                onChange={(event) => {
                  const next = Math.max(1, Math.min(20, Number(event.target.value) || 1));
                  setSeats(Math.trunc(next));
                }}
                className="ml-3 w-24 rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
              {marineStrucSeatDiscountPercent(seats)}% multi-seat discount
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-500">Seat discount: 1 seat 0% · 2 seats 10% · 3 seats 20% · 4 or more seats 30% maximum.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Step 4</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Choose License Term</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(["monthly", "annual", "four_year"] as MarineStrucPurchaseTerm[]).map((termCode) => {
              const item = quotes[termCode];
              const active = term === termCode;
              const suffix = termCode === "monthly" ? "/ month" : termCode === "annual" ? "/ year" : " one-time";
              return (
                <button
                  type="button"
                  key={termCode}
                  onClick={() => setTerm(termCode)}
                  className={`rounded-xl border p-4 text-left ${active ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600" : "border-slate-200"}`}
                >
                  <strong className="block text-slate-900">{item.termLabel}</strong>
                  <span className="mt-2 block text-2xl font-semibold text-slate-950">{formatCadMinor(item.totalMinor)}</span>
                  <span className="text-xs text-slate-500">{suffix} · {seats} seat{seats === 1 ? "" : "s"}</span>
                  {termCode === "annual" && <span className="mt-2 block text-xs font-medium text-teal-700">15% annual discount included</span>}
                  {termCode === "four_year" && <span className="mt-2 block text-xs font-medium text-teal-700">4-year term · agreed 15% long-term pricing factor included</span>}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm lg:sticky lg:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Order Summary</p>
        <h2 className="mt-2 text-2xl font-semibold">MarineStruc</h2>
        <dl className="mt-5 space-y-4 text-sm">
          <div><dt className="text-slate-400">Package</dt><dd className="mt-1 font-semibold">{quote.packageLabel}</dd></div>
          <div><dt className="text-slate-400">Detailers</dt><dd className="mt-1 leading-6">{quote.moduleNames.join(" · ")}</dd></div>
          <div><dt className="text-slate-400">Seats</dt><dd className="mt-1 font-semibold">{quote.seats} · {quote.seatDiscountPercent}% discount</dd></div>
          <div><dt className="text-slate-400">License</dt><dd className="mt-1 font-semibold">{quote.termLabel}</dd></div>
        </dl>
        <div className="my-6 border-t border-slate-700" />
        <p className="text-sm text-slate-400">Total before applicable tax</p>
        <p className="mt-1 text-3xl font-semibold">{formatCadMinor(quote.totalMinor)}</p>
        <p className="mt-1 text-xs text-slate-400">CAD · taxes are calculated separately at Checkout when applicable.</p>
        <div className="mt-6">{cta}</div>
        <p className="mt-4 text-xs leading-5 text-slate-400">Payment confirmation is verified by Stripe webhook before any license is issued. Downloads remain private and require an eligible active license.</p>
      </aside>
    </form>
  );
}
