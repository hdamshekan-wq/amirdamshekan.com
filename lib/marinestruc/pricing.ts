export const MARINESTRUC_MODULES = [
  {
    code: "walkway",
    name: "Walkway / Gangway Detailer",
    licenseProductId: "Walkway",
  },
  {
    code: "concrete-float",
    name: "Concrete Float Detailer",
    licenseProductId: "ConcreteFloat",
  },
  {
    code: "aluminum-float",
    name: "Aluminum Float Detailer",
    licenseProductId: "AluminumFloat",
  },
] as const;

export type MarineStrucModuleCode = (typeof MARINESTRUC_MODULES)[number]["code"];
export type MarineStrucPurchaseTerm = "monthly" | "annual" | "four_year";

export const MARINESTRUC_PURCHASE_TERMS = [
  { code: "monthly" as const, label: "Monthly", billingMode: "subscription" as const },
  { code: "annual" as const, label: "Annual", billingMode: "subscription" as const },
  { code: "four_year" as const, label: "4-Year License", billingMode: "payment" as const },
];

export function isMarineStrucPurchaseTerm(value: string): value is MarineStrucPurchaseTerm {
  return value === "monthly" || value === "annual" || value === "four_year";
}

export function normalizeMarineStrucModules(values: string[]): MarineStrucModuleCode[] {
  const allowed = new Set<string>(MARINESTRUC_MODULES.map((module) => module.code));
  const unique = [...new Set(values.filter((value) => allowed.has(value)))];
  return MARINESTRUC_MODULES.map((module) => module.code).filter((code) => unique.includes(code));
}

export function marineStrucSeatDiscountPercent(seats: number) {
  if (seats <= 1) return 0;
  if (seats === 2) return 10;
  if (seats === 3) return 20;
  return 30;
}

export function marineStrucPackageMonthlyMinor(moduleCount: number) {
  if (moduleCount === 1) return 1500;
  if (moduleCount === 2) return 2000;
  if (moduleCount === 3) return 2500;
  throw new Error("MarineStruc requires one to three Detailers.");
}

export function marineStrucTermBaseMinor(moduleCount: number, term: MarineStrucPurchaseTerm) {
  const monthly = marineStrucPackageMonthlyMinor(moduleCount);
  if (term === "monthly") return monthly;

  // Annual = 12 monthly payments less 15%.
  const annual = Math.round(monthly * 12 * 0.85);
  if (term === "annual") return annual;

  // 4-Year License keeps the previously agreed pricing coefficient:
  // Annual x 4 less a further 15%. Only the license label/term changed from perpetual to four years.
  return Math.round(annual * 4 * 0.85);
}

export function quoteMarineStrucPurchase(input: {
  moduleCodes: string[];
  seats: number;
  term: MarineStrucPurchaseTerm;
}) {
  const moduleCodes = normalizeMarineStrucModules(input.moduleCodes);
  if (moduleCodes.length < 1 || moduleCodes.length > MARINESTRUC_MODULES.length) {
    throw new Error("Select at least one MarineStruc Detailer.");
  }

  const seats = Math.trunc(input.seats);
  if (!Number.isFinite(seats) || seats < 1 || seats > 20) {
    throw new Error("Seats must be between 1 and 20.");
  }

  const fullSuite = moduleCodes.length === MARINESTRUC_MODULES.length;
  const seatDiscountPercent = marineStrucSeatDiscountPercent(seats);
  const termBaseMinor = marineStrucTermBaseMinor(moduleCodes.length, input.term);
  const unitAmountMinor = Math.round(termBaseMinor * (100 - seatDiscountPercent) / 100);
  const totalMinor = unitAmountMinor * seats;
  const moduleNames = moduleCodes.map((code) =>
    MARINESTRUC_MODULES.find((module) => module.code === code)?.name || code,
  );
  const termLabel = MARINESTRUC_PURCHASE_TERMS.find((term) => term.code === input.term)?.label || input.term;
  const packageLabel = fullSuite
    ? "Full Suite · All 3 Detailers"
    : `${moduleCodes.length} Detailer${moduleCodes.length === 1 ? "" : "s"}`;

  return {
    term: input.term,
    termLabel,
    moduleCodes,
    moduleNames,
    moduleCount: moduleCodes.length,
    packageLabel,
    fullSuite,
    seats,
    seatDiscountPercent,
    termBaseMinor,
    unitAmountMinor,
    totalMinor,
  };
}

export function marineStrucLicenseServerEntitlements(moduleCodes: string[], seats: number) {
  const normalized = normalizeMarineStrucModules(moduleCodes);
  if (normalized.length === MARINESTRUC_MODULES.length) {
    return [{ productId: "MarineStrucFullSuite", maxSeats: seats }];
  }
  return normalized.map((code) => {
    const module = MARINESTRUC_MODULES.find((item) => item.code === code);
    if (!module) throw new Error(`Unknown MarineStruc module: ${code}`);
    return { productId: module.licenseProductId, maxSeats: seats };
  });
}

export function marineStrucLegacyPlanRecordCode(term: MarineStrucPurchaseTerm) {
  if (term === "monthly") return "monthly-1-device";
  if (term === "annual") return "annual-1-device";
  // Existing DB row is retained only as the order FK anchor for backwards compatibility.
  return "perpetual-1-device";
}

export function marineStrucLicenseServerPlanCode(term: MarineStrucPurchaseTerm) {
  if (term === "monthly") return "monthly-configurable";
  if (term === "annual") return "annual-configurable";
  return "four-year-configurable";
}

export function formatCadMinor(amountMinor: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}
