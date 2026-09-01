import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const METRIC_NAME = "total_visitors";
const COOKIE_NAME = "ad_visitor_counted";

async function readCount() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_metrics")
    .select("value")
    .eq("metric", METRIC_NAME)
    .single();

  if (error) throw new Error(`Visitor metric lookup failed: ${error.message}`);
  return Number(data?.value ?? 0);
}

export async function GET() {
  try {
    const count = await readCount();

    return NextResponse.json(
      { count },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Visitor counter GET failed:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const alreadyCounted = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .some((part) => part === `${COOKIE_NAME}=1`);

    let count: number;

    if (alreadyCounted) {
      count = await readCount();
    } else {
      const admin = createAdminClient();
      const { data, error } = await admin.rpc("increment_site_metric", {
        metric_name: METRIC_NAME,
      });

      if (error) throw new Error(`Visitor metric increment failed: ${error.message}`);
      count = Number(data ?? 0);
    }

    const response = NextResponse.json(
      { count },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );

    if (!alreadyCounted) {
      response.cookies.set(COOKIE_NAME, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error) {
    console.error("Visitor counter POST failed:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
