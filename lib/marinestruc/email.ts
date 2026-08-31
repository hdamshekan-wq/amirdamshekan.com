import { Resend } from "resend";

export async function sendPurchaseEmail(input: {
  kind?: "purchase" | "renewal";
  to: string;
  customerName: string;
  productName: string;
  planName: string;
  invoiceNumber: string;
  invoicePdf: Uint8Array;
  licenseKey?: string | null;
  expiresAt?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PURCHASE_EMAIL_FROM;

  if (!apiKey || !from) return { skipped: true as const };

  const resend = new Resend(apiKey);
  const licenseHtml = input.licenseKey
    ? `<p><strong>License:</strong> ${escapeHtml(input.licenseKey)}<br/><strong>Expires:</strong> ${input.expiresAt ? escapeHtml(new Date(input.expiresAt).toLocaleDateString("en-CA")) : "Perpetual"}</p>`
    : `<p>Your payment is confirmed. License provisioning is pending and will appear in your account when completed.</p>`;

  const isRenewal = input.kind === "renewal";

  await resend.emails.send({
    from,
    to: input.to,
    subject: `MarineStruc ${isRenewal ? "renewal" : "purchase"} confirmation — ${input.invoiceNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.55;max-width:620px">
        <h2>MarineStruc ${isRenewal ? "Renewal" : "Purchase"} Confirmation</h2>
        <p>Hello ${escapeHtml(input.customerName)},</p>
        <p>${isRenewal ? "Your MarineStruc subscription renewal has been paid successfully." : `Thank you for purchasing <strong>${escapeHtml(input.productName)}</strong>.`}</p>
        <p><strong>Plan:</strong> ${escapeHtml(input.planName)}<br/><strong>Invoice:</strong> ${escapeHtml(input.invoiceNumber)}</p>
        ${licenseHtml}
        <p>Your PDF invoice is attached. You can also access your licenses, downloads and invoices from your MarineStruc account.</p>
        <p><a href="${escapeHtml(process.env.NEXT_PUBLIC_SITE_URL || "https://amirdamshekan.com")}/account">View My Account</a></p>
      </div>
    `,
    attachments: [
      {
        filename: `MarineStruc-Invoice-${input.invoiceNumber}.pdf`,
        content: Buffer.from(input.invoicePdf).toString("base64"),
      },
    ],
  });

  return { skipped: false as const };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char]!);
}
