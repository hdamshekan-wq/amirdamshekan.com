import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import {
  isMarineStrucPurchaseTerm,
  marineStrucLegacyPlanRecordCode,
  quoteMarineStrucPurchase,
} from "@/lib/marinestruc/pricing";
import {
  MARINESTRUC_POLICY_SLUG,
  MARINESTRUC_POLICY_VERSION,
} from "@/lib/marinestruc/policy";

const TEST_MARINESTRUC_PRODUCT_ID = "prod_VAdrXW8eiDJnvB";

function errorRedirect(origin: string, message: string) {
  return NextResponse.redirect(
    new URL(`/marinestruc/pricing?error=${encodeURIComponent(message)}`, origin),
    303,
  );
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const formData = await request.formData();
  const termRaw = String(formData.get("term") || "");
  const seats = Number(formData.get("seats") || 0);
  const moduleCodes = formData.getAll("modules").map(String);

  if (!isMarineStrucPurchaseTerm(termRaw)) {
    return errorRedirect(url.origin, "Select a valid MarineStruc license term.");
  }

  let quote: ReturnType<typeof quoteMarineStrucPurchase>;
  try {
    quote = quoteMarineStrucPurchase({ moduleCodes, seats, term: termRaw });
  } catch (error) {
    return errorRedirect(url.origin, error instanceof Error ? error.message : "Invalid MarineStruc purchase configuration.");
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  if (!userId) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent("/marinestruc/pricing")}`, url.origin),
      303,
    );
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userError || !user || !user.email_confirmed_at || !user.email) {
    return errorRedirect(url.origin, "Please verify your email before purchase.");
  }

  const planRecordCode = marineStrucLegacyPlanRecordCode(quote.term);
  const [{ data: plan }, { data: policy }] = await Promise.all([
    supabase
      .from("license_plans")
      .select("id,code")
      .eq("code", planRecordCode)
      .single(),
    supabase
      .from("policy_versions")
      .select("id")
      .eq("slug", MARINESTRUC_POLICY_SLUG)
      .eq("version", MARINESTRUC_POLICY_VERSION)
      .eq("active", true)
      .single(),
  ]);

  if (!plan) return errorRedirect(url.origin, "MarineStruc billing configuration is unavailable.");
  if (!policy) {
    return NextResponse.redirect(
      new URL("/marinestruc/policy?error=Current%20policy%20is%20not%20configured.", url.origin),
      303,
    );
  }

  const { data: acceptance } = await supabase
    .from("policy_acceptances")
    .select("id")
    .eq("user_id", userId)
    .eq("policy_version_id", policy.id)
    .maybeSingle();

  if (!acceptance) {
    return NextResponse.redirect(
      new URL("/marinestruc/policy?error=Please%20read%20and%20accept%20the%20current%20policy%20before%20purchase.", url.origin),
      303,
    );
  }

  const liveMode = process.env.STRIPE_LIVE_MODE === "true";
  const productId = process.env.STRIPE_MARINESTRUC_PRODUCT_ID || (!liveMode ? TEST_MARINESTRUC_PRODUCT_ID : "");
  if (!productId) {
    return errorRedirect(url.origin, "MarineStruc Stripe product is not configured for Live mode.");
  }

  const billingMode = quote.term === "four_year" ? "payment" : "subscription";
  const recurring = quote.term === "monthly"
    ? { interval: "month" as const }
    : quote.term === "annual"
      ? { interval: "year" as const }
      : undefined;

  const commonMetadata: Record<string, string> = {
    product: "MarineStruc",
    user_id: userId,
    plan_id: plan.id,
    plan_code: plan.code,
    purchase_term: quote.term,
    seat_count: String(quote.seats),
    module_codes: quote.moduleCodes.join(","),
    full_suite: quote.fullSuite ? "true" : "false",
    seat_discount_percent: String(quote.seatDiscountPercent),
    unit_amount_minor: String(quote.unitAmountMinor),
    expected_subtotal_minor: String(quote.totalMinor),
    policy_version_id: policy.id,
    policy_version: MARINESTRUC_POLICY_VERSION,
  };

  const lineItems: Stripe.Checkout.SessionCreateParams["line_items"] = [{
    price_data: {
      currency: "cad",
      product: productId,
      unit_amount: quote.unitAmountMinor,
      tax_behavior: "exclusive",
      ...(recurring ? { recurring } : {}),
    },
    quantity: quote.seats,
  }];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const baseParams: Stripe.Checkout.SessionCreateParams = {
    mode: billingMode,
    line_items: lineItems,
    customer_email: user.email,
    client_reference_id: userId,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
    metadata: commonMetadata,
    success_url: `${siteUrl}/marinestruc/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/marinestruc/pricing?error=${encodeURIComponent("Payment was cancelled. No license was issued.")}`,
    custom_text: {
      submit: {
        message: `${quote.packageLabel}; ${quote.seats} seat${quote.seats === 1 ? "" : "s"}; ${quote.termLabel}. License activation follows verified payment.`,
      },
    },
  };

  // Stripe hosted Terms collection is a Live-mode capability in this project.
  // The versioned MarineStruc policy above remains mandatory in every mode.
  if (liveMode) baseParams.consent_collection = { terms_of_service: "required" };

  let checkout: Stripe.Checkout.Session;
  if (billingMode === "subscription") {
    checkout = await stripe().checkout.sessions.create({
      ...baseParams,
      mode: "subscription",
      subscription_data: { metadata: commonMetadata },
    });
  } else {
    checkout = await stripe().checkout.sessions.create({
      ...baseParams,
      mode: "payment",
      customer_creation: "always",
      payment_intent_data: { metadata: commonMetadata },
    });
  }

  const admin = createAdminClient();
  const pricingSnapshot = {
    currency: "cad",
    module_count: quote.moduleCount,
    module_codes: quote.moduleCodes,
    package_label: quote.packageLabel,
    term: quote.term,
    term_label: quote.termLabel,
    seats: quote.seats,
    seat_discount_percent: quote.seatDiscountPercent,
    term_base_minor: quote.termBaseMinor,
    unit_amount_minor: quote.unitAmountMinor,
    total_minor: quote.totalMinor,
  };

  const { error: orderError } = await admin.from("orders").insert({
    user_id: userId,
    license_plan_id: plan.id,
    policy_version_id: policy.id,
    stripe_checkout_session_id: checkout.id,
    status: "pending",
    fulfillment_status: "pending",
    currency: checkout.currency || "cad",
    subtotal_minor: checkout.amount_subtotal || quote.totalMinor,
    tax_minor: checkout.total_details?.amount_tax || 0,
    total_minor: checkout.amount_total || quote.totalMinor,
    customer_email: user.email,
    purchase_term: quote.term,
    seat_count: quote.seats,
    module_codes: quote.moduleCodes,
    full_suite: quote.fullSuite,
    pricing_snapshot: pricingSnapshot,
  });

  if (orderError) {
    await stripe().checkout.sessions.expire(checkout.id).catch(() => undefined);
    return errorRedirect(url.origin, "Unable to create the order record. Payment was not started.");
  }

  if (!checkout.url) return errorRedirect(url.origin, "Unable to start Checkout.");
  return NextResponse.redirect(checkout.url, 303);
}
