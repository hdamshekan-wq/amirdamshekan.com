import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { createInvoicePdf } from "@/lib/marinestruc/invoice";
import { sendPurchaseEmail } from "@/lib/marinestruc/email";
import { renewMarineStrucLicense, setMarineStrucLicenseStatus } from "@/lib/marinestruc/license-server";
import {
  invoiceServicePeriod,
  invoiceSubscriptionId,
  invoiceTaxMinor,
  subscriptionCurrentPeriodEnd,
} from "@/lib/marinestruc/stripe-period";
import {
  isMarineStrucPurchaseTerm,
  normalizeMarineStrucModules,
  quoteMarineStrucPurchase,
} from "@/lib/marinestruc/pricing";

export async function handlePaidSubscriptionInvoice(invoiceId: string) {
  const admin = createAdminClient();
  const invoice = await stripe().invoices.retrieve(invoiceId);
  if (invoice.status !== "paid") return { ignored: true, reason: "invoice_not_paid" };

  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return { ignored: true, reason: "not_subscription_invoice" };

  if (invoice.billing_reason === "subscription_create") {
    return { ignored: true, reason: "initial_invoice_handled_by_checkout" };
  }
  if (invoice.billing_reason !== "subscription_cycle") {
    return { ignored: true, reason: `unsupported_billing_reason:${invoice.billing_reason || "unknown"}` };
  }

  const { data: license, error: licenseError } = await admin
    .from("licenses")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  if (licenseError) throw new Error(`License lookup failed: ${licenseError.message}`);
  if (!license) return { ignored: true, reason: "license_not_provisioned_yet" };

  const { data: existingInvoice } = await admin
    .from("invoices")
    .select("id,invoice_number,storage_path,emailed_at")
    .eq("stripe_invoice_id", invoice.id)
    .maybeSingle();
  if (existingInvoice?.emailed_at) return { ignored: true, reason: "renewal_already_fulfilled" };

  const servicePeriod = invoiceServicePeriod(invoice);
  if (!servicePeriod) throw new Error("Stripe invoice service period is unavailable.");

  const { data: order, error: orderError } = await admin.from("orders").select("*").eq("id", license.order_id).single();
  if (orderError || !order) throw new Error(`Original order lookup failed: ${orderError?.message || "unknown"}`);

  const [{ data: profile }, { data: plan }] = await Promise.all([
    admin
      .from("profiles")
      .select("first_name,last_name,company,email")
      .eq("id", license.user_id)
      .maybeSingle(),
    admin
      .from("license_plans")
      .select("code,name")
      .eq("id", order.license_plan_id)
      .maybeSingle(),
  ]);

  const renewed = await renewMarineStrucLicense({
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: subscriptionId,
    externalLicenseId: license.external_license_id,
    periodStart: servicePeriod.start,
    periodEnd: servicePeriod.end,
    amountPaid: invoice.amount_paid ?? invoice.total ?? 0,
    currency: invoice.currency || "cad",
  });
  if (!renewed) throw new Error("License Server renewal endpoint is not configured.");

  const { error: licenseUpdateError } = await admin.from("licenses").update({
    status: "active",
    starts_at: renewed.startsAt || license.starts_at,
    expires_at: renewed.expiresAt || servicePeriod.end,
    max_devices: renewed.maxDevices || license.max_devices,
    updates_expires_at: renewed.updatesExpiresAt ?? renewed.expiresAt ?? license.updates_expires_at,
  }).eq("id", license.id);
  if (licenseUpdateError) throw new Error(`Renewed license save failed: ${licenseUpdateError.message}`);

  const purchaseTerm = typeof order.purchase_term === "string" && isMarineStrucPurchaseTerm(order.purchase_term)
    ? order.purchase_term
    : plan?.code?.startsWith("monthly") ? "monthly" : "annual";
  const moduleCodes = normalizeMarineStrucModules(Array.isArray(order.module_codes) ? order.module_codes : []);
  const seats = Number(order.seat_count || license.seat_count || license.max_devices || 1);
  const quote = moduleCodes.length
    ? quoteMarineStrucPurchase({ moduleCodes, seats, term: purchaseTerm })
    : null;
  const planLabel = quote
    ? `${quote.termLabel} · ${quote.packageLabel}`
    : plan?.name || (purchaseTerm === "monthly" ? "Monthly" : "Annual");

  const customerName = invoice.customer_name || order.customer_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Customer";
  const customerEmail = invoice.customer_email || order.customer_email || profile?.email;
  if (!customerEmail) throw new Error("Customer email is unavailable for renewal invoice.");

  let renewalInvoice = existingInvoice;
  let invoicePdf: Uint8Array | null = null;
  if (!renewalInvoice) {
    const { data: numberData, error: numberError } = await admin.rpc("issue_invoice_number");
    if (numberError || !numberData) throw new Error(`Invoice number failed: ${numberError?.message || "unknown"}`);

    const subtotal = invoice.subtotal ?? 0;
    const total = invoice.total ?? invoice.amount_paid ?? subtotal;
    const tax = invoiceTaxMinor(invoice);
    const billingAddress = invoice.customer_address ? { ...invoice.customer_address } : order.billing_address;

    invoicePdf = await createInvoicePdf({
      invoiceNumber: numberData,
      invoiceDate: new Date((invoice.status_transitions?.paid_at || invoice.created) * 1000),
      orderId: order.id,
      customerName,
      customerEmail,
      company: profile?.company,
      billingAddress,
      productName: "MarineStruc",
      planName: `${planLabel} Renewal`,
      currency: invoice.currency || "cad",
      subtotal,
      tax,
      total,
      licenseTerm: `${new Date(servicePeriod.start).toLocaleDateString("en-CA")} – ${new Date(servicePeriod.end).toLocaleDateString("en-CA")}`,
      devices: seats,
    });

    const storagePath = `${license.user_id}/${numberData}.pdf`;
    const { error: uploadError } = await admin.storage.from("invoices").upload(storagePath, invoicePdf, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadError) throw new Error(`Renewal invoice upload failed: ${uploadError.message}`);

    const { data: created, error: createError } = await admin.from("invoices").insert({
      order_id: order.id,
      user_id: license.user_id,
      invoice_number: numberData,
      storage_path: storagePath,
      stripe_invoice_id: invoice.id,
      invoice_kind: "renewal",
      currency: invoice.currency || "cad",
      subtotal_minor: subtotal,
      tax_minor: tax,
      total_minor: total,
      issued_at: new Date().toISOString(),
    }).select("id,invoice_number,storage_path,emailed_at").single();
    if (createError || !created) throw new Error(`Renewal invoice record failed: ${createError?.message || "unknown"}`);
    renewalInvoice = created;
  }

  if (!invoicePdf && renewalInvoice?.storage_path) {
    const { data, error } = await admin.storage.from("invoices").download(renewalInvoice.storage_path);
    if (!error && data) invoicePdf = new Uint8Array(await data.arrayBuffer());
  }

  if (renewalInvoice && invoicePdf && !renewalInvoice.emailed_at) {
    const result = await sendPurchaseEmail({
      kind: "renewal",
      to: customerEmail,
      customerName,
      productName: "MarineStruc",
      planName: planLabel,
      invoiceNumber: renewalInvoice.invoice_number,
      invoicePdf,
      licenseKey: license.license_key,
      expiresAt: renewed.expiresAt || servicePeriod.end,
    });
    if (!result.skipped) await admin.from("invoices").update({ emailed_at: new Date().toISOString() }).eq("id", renewalInvoice.id);
  }

  return { ignored: false };
}

export async function syncSubscriptionStatus(subscription: Stripe.Subscription, eventType: string, stripeEventId: string) {
  const admin = createAdminClient();
  const { data: license, error } = await admin
    .from("licenses")
    .select("id,external_license_id,status,stripe_subscription_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  if (error) throw new Error(`Subscription license lookup failed: ${error.message}`);
  if (!license) return { ignored: true, reason: "license_not_found" };

  let target: "active" | "suspended" | "expired" | null = null;
  if (subscription.status === "active" || subscription.status === "trialing") target = "active";
  else if (subscription.status === "unpaid" || subscription.status === "paused") target = "suspended";
  else if (subscription.status === "canceled" || subscription.status === "incomplete_expired" || eventType === "customer.subscription.deleted") target = "expired";

  const subscriptionSnapshot = {
    stripe_subscription_status: subscription.status,
    stripe_cancel_at_period_end: subscription.cancel_at_period_end,
    stripe_current_period_end: subscriptionCurrentPeriodEnd(subscription),
  };

  if (!target) {
    const { error: snapshotError } = await admin
      .from("licenses")
      .update(subscriptionSnapshot)
      .eq("id", license.id);
    if (snapshotError) throw new Error(`Subscription snapshot save failed: ${snapshotError.message}`);
    return { ignored: false };
  }

  const synced = await setMarineStrucLicenseStatus({
    stripeEventId,
    stripeSubscriptionId: subscription.id,
    externalLicenseId: license.external_license_id,
    status: target,
    reason: eventType,
  });
  if (!synced) throw new Error("License Server status endpoint is not configured.");

  const dbStatus = target === "expired" ? "expired" : target;
  const { error: updateError } = await admin
    .from("licenses")
    .update({ status: dbStatus, ...subscriptionSnapshot })
    .eq("id", license.id);
  if (updateError) throw new Error(`Subscription status save failed: ${updateError.message}`);
  return { ignored: false };
}
