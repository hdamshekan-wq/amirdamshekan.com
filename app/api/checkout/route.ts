import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import {
  MARINESTRUC_POLICY_SLUG,
  MARINESTRUC_POLICY_VERSION,
} from "@/lib/marinestruc/policy";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const formData = await request.formData();
  const planId = String(formData.get("planId") || "");

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  const userId =
    typeof claimsData?.claims?.sub === "string"
      ? claimsData.claims.sub
      : null;

  if (!userId) {
    return NextResponse.redirect(
      new URL(
        `/login?next=${encodeURIComponent("/marinestruc/pricing")}`,
        url.origin
      ),
      303
    );
  }

  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  const user = userData?.user;

  if (
    userError ||
    !user ||
    !user.email_confirmed_at ||
    !user.email
  ) {
    return NextResponse.redirect(
      new URL(
        "/marinestruc/pricing?error=Please%20verify%20your%20email%20before%20purchase.",
        url.origin
      ),
      303
    );
  }

  const [{ data: plan }, { data: policy }] = await Promise.all([
    supabase
      .from("license_plans")
      .select(
        "id,code,billing_mode,stripe_test_price_id,stripe_live_price_id,active"
      )
      .eq("id", planId)
      .eq("active", true)
      .single(),

    supabase
      .from("policy_versions")
      .select("id")
      .eq("slug", MARINESTRUC_POLICY_SLUG)
      .eq("version", MARINESTRUC_POLICY_VERSION)
      .eq("active", true)
      .single(),
  ]);

  const liveMode = process.env.STRIPE_LIVE_MODE === "true";

  const priceId = liveMode
    ? plan?.stripe_live_price_id
    : plan?.stripe_test_price_id;

  if (!plan || !priceId) {
    return NextResponse.redirect(
      new URL(
        "/marinestruc/pricing?error=This%20plan%20is%20not%20configured%20for%20the%20current%20Stripe%20mode.",
        url.origin
      ),
      303
    );
  }

  if (!policy) {
    return NextResponse.redirect(
      new URL(
        "/marinestruc/policy?error=Current%20policy%20is%20not%20configured.",
        url.origin
      ),
      303
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
      new URL(
        "/marinestruc/policy?error=Please%20read%20and%20accept%20the%20current%20policy%20before%20purchase.",
        url.origin
      ),
      303
    );
  }

  // Verify that the configured Stripe Price agrees
  // with the database billing mode.
  const stripePrice = await stripe().prices.retrieve(priceId);

  const actualMode: "subscription" | "payment" =
    stripePrice.type === "recurring"
      ? "subscription"
      : "payment";

  if (actualMode !== plan.billing_mode) {
    return NextResponse.redirect(
      new URL(
        "/marinestruc/pricing?error=Billing%20configuration%20mismatch.%20Please%20contact%20support.",
        url.origin
      ),
      303
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  const commonMetadata = {
    product: "MarineStruc",
    user_id: userId,
    plan_id: plan.id,
    plan_code: plan.code,
    policy_version_id: policy.id,
    policy_version: MARINESTRUC_POLICY_VERSION,
  };

  const baseParams = {
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],

    customer_email: user.email,
    client_reference_id: userId,

    billing_address_collection: "required" as const,

    tax_id_collection: {
      enabled: true,
    },

    automatic_tax: {
      enabled:
        process.env.STRIPE_AUTOMATIC_TAX === "true",
    },

    // Stripe-hosted Terms of Service consent is required
    // only in Live mode.
    // MarineStruc's internal policy acceptance remains
    // mandatory in both Test and Live modes.
    ...(liveMode
      ? {
          consent_collection: {
            terms_of_service: "required" as const,
          },
        }
      : {}),

    metadata: commonMetadata,

    success_url:
      `${siteUrl}/marinestruc/order/success` +
      "?session_id={CHECKOUT_SESSION_ID}",

    cancel_url:
      `${siteUrl}/marinestruc/pricing?error=${encodeURIComponent(
        "Payment was cancelled. No license was issued."
      )}`,
  };

  let checkout: Stripe.Checkout.Session;

  if (actualMode === "subscription") {
    checkout = await stripe().checkout.sessions.create({
      ...baseParams,
      mode: "subscription",

      subscription_data: {
        metadata: commonMetadata,
      },
    });
  } else {
    checkout = await stripe().checkout.sessions.create({
      ...baseParams,
      mode: "payment",
      customer_creation: "always",
    });
  }

  const admin = createAdminClient();

  const { error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      license_plan_id: plan.id,
      policy_version_id: policy.id,

      stripe_checkout_session_id: checkout.id,

      status: "pending",
      fulfillment_status: "pending",

      currency: checkout.currency || "cad",

      subtotal_minor:
        checkout.amount_subtotal || 0,

      tax_minor:
        checkout.total_details?.amount_tax || 0,

      total_minor:
        checkout.amount_total || 0,

      customer_email: user.email,
    });

  if (orderError) {
    await stripe()
      .checkout.sessions.expire(checkout.id)
      .catch(() => undefined);

    return NextResponse.redirect(
      new URL(
        `/marinestruc/pricing?error=${encodeURIComponent(
          "Unable to create the order record. Payment was not started."
        )}`,
        url.origin
      ),
      303
    );
  }

  if (!checkout.url) {
    return NextResponse.redirect(
      new URL(
        "/marinestruc/pricing?error=Unable%20to%20start%20Checkout.",
        url.origin
      ),
      303
    );
  }

  return NextResponse.redirect(checkout.url, 303);
}