import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

function accountErrorRedirect(origin: string, message: string) {
  return NextResponse.redirect(
    new URL(`/account?error=${encodeURIComponent(message)}`, origin),
    303,
  );
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  if (claimsError || !userId) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent("/account")}`, url.origin),
      303,
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return accountErrorRedirect(url.origin, "Unable to load your billing account.");
  }

  const stripeCustomerId = typeof profile?.stripe_customer_id === "string"
    ? profile.stripe_customer_id.trim()
    : "";
  if (!stripeCustomerId) {
    return accountErrorRedirect(url.origin, "No Stripe billing account is linked to your profile.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  try {
    const portal = await stripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: new URL("/account", siteUrl).toString(),
    });

    return NextResponse.redirect(portal.url, 303);
  } catch (error) {
    console.error("Stripe billing portal error", userId, error);
    return accountErrorRedirect(url.origin, "Unable to open Stripe billing right now.");
  }
}
