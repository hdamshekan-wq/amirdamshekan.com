import Stripe from "stripe";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { fulfillCheckoutSession, isRelevantCheckoutEvent } from "@/lib/marinestruc/fulfillment";
import { handlePaidSubscriptionInvoice, syncSubscriptionStatus } from "@/lib/marinestruc/subscription-billing";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: previous } = await admin.from("stripe_events").select("status").eq("stripe_event_id", event.id).maybeSingle();
  if (previous?.status === "processed" || previous?.status === "ignored") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await admin.from("stripe_events").upsert({
    stripe_event_id: event.id,
    event_type: event.type,
    object_id: event.data.object && typeof event.data.object === "object" && "id" in event.data.object ? String(event.data.object.id) : null,
    status: "processing",
    last_error: null,
  }, { onConflict: "stripe_event_id" });

  try {
    let ignored = false;

    if (isRelevantCheckoutEvent(event)) {
      const session = event.data.object as Stripe.Checkout.Session;
      await fulfillCheckoutSession(session.id);
    } else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await admin.from("orders").update({ status: "failed", fulfillment_status: "failed" }).eq("stripe_checkout_session_id", session.id);
    } else if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const result = await handlePaidSubscriptionInvoice(invoice.id);
      ignored = result.ignored;
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.paused" ||
      event.type === "customer.subscription.resumed"
    ) {
      const result = await syncSubscriptionStatus(event.data.object as Stripe.Subscription, event.type, event.id);
      ignored = result.ignored;
    } else if (event.type === "invoice.payment_failed" || event.type === "invoice.payment_action_required") {
      // Do not revoke immediately. Stripe may recover the payment through retries/authentication.
      ignored = true;
    } else {
      ignored = true;
    }

    await admin.from("stripe_events").update({
      status: ignored ? "ignored" : "processed",
      processed_at: new Date().toISOString(),
      last_error: null,
    }).eq("stripe_event_id", event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await admin.from("stripe_events").update({ status: "failed", last_error: message.slice(0, 1000) }).eq("stripe_event_id", event.id);
    console.error("Stripe fulfillment error", event.id, error);
    return NextResponse.json({ error: "Fulfillment failed." }, { status: 500 });
  }
}
