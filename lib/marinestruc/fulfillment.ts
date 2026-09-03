import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { provisionMarineStrucLicense } from "@/lib/marinestruc/license-server";
import { createInvoicePdf } from "@/lib/marinestruc/invoice";
import { sendPurchaseEmail } from "@/lib/marinestruc/email";
import {
  invoiceServicePeriod,
  relationId,
  subscriptionCurrentPeriodEnd,
} from "@/lib/marinestruc/stripe-period";
import {
  isMarineStrucPurchaseTerm,
  marineStrucLicenseServerEntitlements,
  marineStrucLicenseServerPlanCode,
  normalizeMarineStrucModules,
  quoteMarineStrucPurchase,
  type MarineStrucPurchaseTerm,
} from "@/lib/marinestruc/pricing";

function addUtcYears(date: Date, years: number) {
  const copy = new Date(date.getTime());
  copy.setUTCFullYear(copy.getUTCFullYear() + years);
  return copy;
}

function metadataConfiguration(session: Stripe.Checkout.Session) {
  const termRaw = session.metadata?.purchase_term || "";
  const seatRaw = Number(session.metadata?.seat_count || 0);
  const modulesRaw = (session.metadata?.module_codes || "").split(",").filter(Boolean);
  if (!isMarineStrucPurchaseTerm(termRaw)) throw new Error("Checkout purchase term is invalid.");
  const moduleCodes = normalizeMarineStrucModules(modulesRaw);
  const quote = quoteMarineStrucPurchase({ moduleCodes, seats: seatRaw, term: termRaw });
  return quote;
}

export async function fulfillCheckoutSession(checkoutSessionId: string) {
  const admin = createAdminClient();
  const session = await stripe().checkout.sessions.retrieve(checkoutSessionId, {
    expand: ["line_items", "payment_intent", "subscription.latest_invoice", "customer"],
  });

  if (session.payment_status === "unpaid") return;

  const liveMode = process.env.STRIPE_LIVE_MODE === "true";
  const stripeTermsAccepted = session.consent?.terms_of_service === "accepted";
  if (liveMode && !stripeTermsAccepted) {
    throw new Error("Stripe Terms of Service consent was not accepted.");
  }

  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;
  const policyVersionId = session.metadata?.policy_version_id;
  if (!userId || !planId || !policyVersionId) throw new Error("Checkout metadata is incomplete.");

  const { data: existingOrder } = await admin
    .from("orders")
    .select("id,status,fulfillment_status,purchase_term,seat_count,module_codes,full_suite,pricing_snapshot")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existingOrder?.status === "paid" && existingOrder.fulfillment_status === "fulfilled") return;

  const metadataQuote = metadataConfiguration(session);
  const purchaseTerm = (existingOrder?.purchase_term || metadataQuote.term) as MarineStrucPurchaseTerm;
  const seatCount = Number(existingOrder?.seat_count || metadataQuote.seats);
  const moduleCodes = normalizeMarineStrucModules(
    Array.isArray(existingOrder?.module_codes) && existingOrder.module_codes.length
      ? existingOrder.module_codes
      : metadataQuote.moduleCodes,
  );
  const quote = quoteMarineStrucPurchase({ moduleCodes, seats: seatCount, term: purchaseTerm });

  const expectedSubtotal = Number(session.metadata?.expected_subtotal_minor || quote.totalMinor);
  if (expectedSubtotal !== quote.totalMinor) {
    throw new Error("Checkout pricing metadata does not match the server-side pricing rules.");
  }
  if (session.amount_subtotal != null && session.amount_subtotal !== quote.totalMinor) {
    throw new Error("Stripe Checkout subtotal does not match the expected MarineStruc price.");
  }

  const [{ data: plan, error: planError }, { data: acceptance, error: acceptanceError }, { data: profile }] = await Promise.all([
    admin.from("license_plans").select("*").eq("id", planId).single(),
    admin.from("policy_acceptances").select("id").eq("user_id", userId).eq("policy_version_id", policyVersionId).maybeSingle(),
    admin.from("profiles").select("first_name,last_name,company,email").eq("id", userId).maybeSingle(),
  ]);

  if (planError || !plan) throw new Error("Purchased license plan record no longer exists.");
  if (acceptanceError || !acceptance) throw new Error("Required policy acceptance was not recorded.");

  const customerDetails = session.customer_details;
  const customerName = customerDetails?.name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Customer";
  const customerEmail = customerDetails?.email || profile?.email;
  if (!customerEmail) throw new Error("Customer email is unavailable.");

  const amountSubtotal = session.amount_subtotal ?? quote.totalMinor;
  const amountTotal = session.amount_total ?? amountSubtotal;
  const tax = session.total_details?.amount_tax ?? Math.max(0, amountTotal - amountSubtotal);
  const billingAddress = customerDetails?.address ? { ...customerDetails.address } : null;
  const paymentIntent = relationId(session.payment_intent);
  const stripeSubscriptionId = relationId(session.subscription);
  const stripeCustomerId = relationId(session.customer);

  const subscriptionObject = session.subscription && typeof session.subscription === "object"
    ? session.subscription as Stripe.Subscription
    : null;
  const latestInvoice = subscriptionObject?.latest_invoice && typeof subscriptionObject.latest_invoice === "object"
    ? subscriptionObject.latest_invoice
    : null;
  const latestStripeInvoiceId = relationId(subscriptionObject?.latest_invoice);
  const initialServicePeriod = latestInvoice ? invoiceServicePeriod(latestInvoice) : null;

  const paidAt = new Date();
  const fourYearExpiry = purchaseTerm === "four_year" ? addUtcYears(paidAt, 4).toISOString() : null;
  const licenseExpiresAt = purchaseTerm === "four_year"
    ? fourYearExpiry
    : initialServicePeriod?.end ?? null;

  if (purchaseTerm !== "four_year" && !licenseExpiresAt) {
    throw new Error("Paid Stripe subscription service period is unavailable.");
  }

  const pricingSnapshot = existingOrder?.pricing_snapshot || {
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

  const { data: order, error: orderError } = await admin
    .from("orders")
    .upsert({
      id: existingOrder?.id,
      user_id: userId,
      license_plan_id: planId,
      policy_version_id: policyVersionId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntent,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: stripeCustomerId,
      status: "paid",
      fulfillment_status: existingOrder?.fulfillment_status === "fulfilled" ? "fulfilled" : "processing",
      currency: session.currency || "cad",
      subtotal_minor: amountSubtotal,
      tax_minor: tax,
      total_minor: amountTotal,
      customer_name: customerName,
      customer_email: customerEmail,
      billing_address: billingAddress,
      stripe_terms_accepted_at: stripeTermsAccepted ? new Date().toISOString() : null,
      paid_at: paidAt.toISOString(),
      purchase_term: purchaseTerm,
      seat_count: quote.seats,
      module_codes: quote.moduleCodes,
      full_suite: quote.fullSuite,
      pricing_snapshot: pricingSnapshot,
    }, { onConflict: "stripe_checkout_session_id" })
    .select("*")
    .single();

  if (orderError || !order) throw new Error(`Order save failed: ${orderError?.message || "unknown"}`);

  let { data: license } = await admin.from("licenses").select("*").eq("order_id", order.id).maybeSingle();
  if (!license) {
    const provisioned = await provisionMarineStrucLicense({
      orderId: order.id,
      stripeCheckoutSessionId: session.id,
      userId,
      name: customerName,
      email: customerEmail,
      company: profile?.company,
      planCode: marineStrucLicenseServerPlanCode(purchaseTerm),
      termDays: null,
      expiresAt: licenseExpiresAt,
      maxDevices: quote.seats,
      updatesDays: null,
      stripeSubscriptionId,
      entitlements: marineStrucLicenseServerEntitlements(quote.moduleCodes, quote.seats),
    });

    if (provisioned) {
      const { data: createdLicense, error: licenseError } = await admin
        .from("licenses")
        .insert({
          order_id: order.id,
          user_id: userId,
          external_license_id: provisioned.licenseId,
          license_key: provisioned.licenseKey,
          status: provisioned.status,
          starts_at: provisioned.startsAt,
          expires_at: provisioned.expiresAt,
          max_devices: provisioned.maxDevices,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_subscription_status: subscriptionObject?.status || null,
          stripe_cancel_at_period_end: subscriptionObject?.cancel_at_period_end || false,
          stripe_current_period_end: subscriptionCurrentPeriodEnd(subscriptionObject),
          updates_expires_at: provisioned.updatesExpiresAt ?? provisioned.expiresAt ?? null,
          purchase_term: purchaseTerm,
          seat_count: quote.seats,
          module_codes: quote.moduleCodes,
          full_suite: quote.fullSuite,
        })
        .select("*")
        .single();
      if (licenseError) throw new Error(`License record failed: ${licenseError.message}`);
      license = createdLicense;
    }
  }

  let { data: invoice } = await admin
    .from("invoices")
    .select("*")
    .eq("order_id", order.id)
    .eq("invoice_kind", "initial")
    .maybeSingle();

  let invoicePdf: Uint8Array | null = null;
  if (!invoice) {
    const { data: numberData, error: numberError } = await admin.rpc("issue_invoice_number");
    if (numberError || !numberData) throw new Error(`Invoice number failed: ${numberError?.message || "unknown"}`);

    const licenseTerm = purchaseTerm === "four_year"
      ? `${paidAt.toLocaleDateString("en-CA")} – ${new Date(fourYearExpiry!).toLocaleDateString("en-CA")}`
      : `${new Date(initialServicePeriod!.start).toLocaleDateString("en-CA")} – ${new Date(initialServicePeriod!.end).toLocaleDateString("en-CA")}`;

    invoicePdf = await createInvoicePdf({
      invoiceNumber: numberData,
      invoiceDate: paidAt,
      orderId: order.id,
      customerName,
      customerEmail,
      company: profile?.company,
      billingAddress,
      productName: "MarineStruc",
      planName: `${quote.termLabel} · ${quote.packageLabel}`,
      currency: session.currency || "cad",
      subtotal: amountSubtotal,
      tax,
      total: amountTotal,
      licenseTerm,
      devices: quote.seats,
    });

    const storagePath = `${userId}/${numberData}.pdf`;
    const { error: uploadError } = await admin.storage.from("invoices").upload(storagePath, invoicePdf, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadError) throw new Error(`Invoice upload failed: ${uploadError.message}`);

    const { data: createdInvoice, error: invoiceError } = await admin.from("invoices").insert({
      order_id: order.id,
      user_id: userId,
      invoice_number: numberData,
      storage_path: storagePath,
      stripe_invoice_id: latestStripeInvoiceId,
      invoice_kind: "initial",
      currency: session.currency || "cad",
      subtotal_minor: amountSubtotal,
      tax_minor: tax,
      total_minor: amountTotal,
      issued_at: paidAt.toISOString(),
    }).select("*").single();
    if (invoiceError) throw new Error(`Invoice record failed: ${invoiceError.message}`);
    invoice = createdInvoice;
  } else if (!invoice.stripe_invoice_id && latestStripeInvoiceId) {
    await admin.from("invoices").update({ stripe_invoice_id: latestStripeInvoiceId }).eq("id", invoice.id);
    invoice.stripe_invoice_id = latestStripeInvoiceId;
  }

  if (!invoicePdf && invoice?.storage_path) {
    const { data, error } = await admin.storage.from("invoices").download(invoice.storage_path);
    if (!error && data) invoicePdf = new Uint8Array(await data.arrayBuffer());
  }

  if (invoice && invoicePdf && !invoice.emailed_at) {
    const result = await sendPurchaseEmail({
      kind: "purchase",
      to: customerEmail,
      customerName,
      productName: "MarineStruc",
      planName: `${quote.termLabel} · ${quote.packageLabel}`,
      invoiceNumber: invoice.invoice_number,
      invoicePdf,
      licenseKey: license?.license_key,
      expiresAt: license?.expires_at,
    });
    if (!result.skipped) await admin.from("invoices").update({ emailed_at: new Date().toISOString() }).eq("id", invoice.id);
  }

  await admin.from("orders").update({
    fulfillment_status: license ? "fulfilled" : "pending_license_server",
    fulfilled_at: license ? new Date().toISOString() : null,
  }).eq("id", order.id);
}

export function isRelevantCheckoutEvent(event: Stripe.Event) {
  return event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded";
}
