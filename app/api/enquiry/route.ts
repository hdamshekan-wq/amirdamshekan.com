import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ENQUIRY_TYPES = new Set([
  "Engineering Project",
  "Consultation",
  "MarineStruc & Software",
  "Licensing",
  "Training / Academy",
  "Other",
]);

const CONTACT_METHODS = new Set(["Email", "Phone", "Video Meeting"]);

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendNotification(input: {
  id: string;
  name: string;
  email: string;
  company: string;
  enquiryType: string;
  details: string;
  preferredContact: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const defaultTo = process.env.CONTACT_TO_EMAIL || "info@amirdamshekan.com";
  const licenseTo = process.env.CONTACT_LICENSE_TO_EMAIL || "license@amirdamshekan.com";

  if (!apiKey || !from) return "not_configured" as const;

  const to =
    input.enquiryType === "Licensing" || input.enquiryType === "MarineStruc & Software"
      ? licenseTo
      : defaultTo;

  const html = `
    <h2>New website enquiry</h2>
    <p><strong>Reference:</strong> ${escapeHtml(input.id)}</p>
    <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Company:</strong> ${escapeHtml(input.company || "-")}</p>
    <p><strong>Type:</strong> ${escapeHtml(input.enquiryType)}</p>
    <p><strong>Preferred contact:</strong> ${escapeHtml(input.preferredContact)}</p>
    <p><strong>Details:</strong></p>
    <p>${escapeHtml(input.details).replaceAll("\n", "<br />")}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: input.email,
      subject: `Website enquiry: ${input.enquiryType} - ${input.name}`,
      html,
    }),
  });

  return response.ok ? ("sent" as const) : ("failed" as const);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    // Honeypot. Bots commonly fill hidden fields; humans never see this input.
    if (clean(body.website, 200)) {
      return NextResponse.json({ ok: true });
    }

    const name = clean(body.name, 120);
    const email = clean(body.email, 180).toLowerCase();
    const company = clean(body.company, 180);
    const enquiryType = clean(body.enquiryType, 80);
    const details = clean(body.details, 5000);
    const preferredContact = clean(body.preferredContact, 80);

    if (
      name.length < 2 ||
      !validEmail(email) ||
      details.length < 10 ||
      !ENQUIRY_TYPES.has(enquiryType) ||
      !CONTACT_METHODS.has(preferredContact)
    ) {
      return NextResponse.json(
        { message: "Please complete the required fields with valid information." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Lightweight DB-backed abuse protection without storing IP addresses.
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: recentCount, error: countError } = await admin
      .from("site_enquiries")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", tenMinutesAgo);

    if (countError) {
      console.error("Enquiry rate-limit lookup failed:", countError.message);
    } else if ((recentCount ?? 0) >= 3) {
      return NextResponse.json(
        { message: "Too many recent submissions. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const { data, error } = await admin
      .from("site_enquiries")
      .insert({
        name,
        email,
        company: company || null,
        enquiry_type: enquiryType,
        details,
        preferred_contact: preferredContact,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      throw new Error(`Enquiry insert failed: ${error?.message || "Missing enquiry ID"}`);
    }

    const notificationStatus = await sendNotification({
      id: data.id,
      name,
      email,
      company,
      enquiryType,
      details,
      preferredContact,
    }).catch((error) => {
      console.error("Enquiry notification failed:", error instanceof Error ? error.message : error);
      return "failed" as const;
    });

    if (notificationStatus !== "not_configured") {
      await admin
        .from("site_enquiries")
        .update({ notification_status: notificationStatus })
        .eq("id", data.id)
        .then(({ error }) => {
          if (error) console.error("Enquiry notification status update failed:", error.message);
        });
    }

    return NextResponse.json({ ok: true, reference: data.id }, { status: 201 });
  } catch (error) {
    console.error("Enquiry POST failed:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { message: "Unable to submit the enquiry right now. Please email info@amirdamshekan.com." },
      { status: 500 }
    );
  }
}
