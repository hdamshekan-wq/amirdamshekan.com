import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: Date;
  orderId: string;
  customerName: string;
  customerEmail: string;
  company?: string | null;
  billingAddress?: Record<string, unknown> | null;
  productName: string;
  planName: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  licenseTerm: string;
  devices: number;
};

function money(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountMinor / 100);
}

function addressLines(address?: Record<string, unknown> | null) {
  if (!address) return [];
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(" "),
    address.country,
  ];
  return parts.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

export async function createInvoicePdf(data: InvoiceData) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.04, 0.09, 0.18);
  const accent = rgb(0.06, 0.45, 0.55);
  const gray = rgb(0.35, 0.38, 0.42);

  page.drawRectangle({ x: 0, y: 708, width: 612, height: 84, color: navy });

  let logoDrawn = false;
  try {
    const logoPath = path.join(process.cwd(), "public", "brand", "logo.png");
    const logoBytes = await readFile(logoPath);
    const logo = await pdf.embedPng(logoBytes);
    const scaled = logo.scaleToFit(118, 50);
    page.drawImage(logo, { x: 44, y: 725, width: scaled.width, height: scaled.height });
    logoDrawn = true;
  } catch {
    // Optional logo; use text branding below when absent.
  }

  if (!logoDrawn) {
    page.drawText("MARINESTRUC", { x: 44, y: 747, size: 21, font: bold, color: rgb(1, 1, 1) });
    page.drawText("Engineering Software", { x: 44, y: 727, size: 9, font: regular, color: rgb(0.8, 0.86, 0.9) });
  }

  page.drawText("PAID INVOICE", { x: 420, y: 746, size: 16, font: bold, color: rgb(1, 1, 1) });
  page.drawText(data.invoiceNumber, { x: 420, y: 726, size: 9, font: regular, color: rgb(0.85, 0.9, 0.93) });

  const sellerName = process.env.INVOICE_SELLER_NAME || "Amir Damshekan";
  const sellerEmail = process.env.INVOICE_SELLER_EMAIL || "license@amirdamshekan.com";
  const sellerPhone = process.env.INVOICE_SELLER_PHONE || "";
  const sellerLocation = process.env.INVOICE_SELLER_LOCATION || "Greater Vancouver, BC, Canada";
  const taxNumber = process.env.INVOICE_TAX_NUMBER || "";

  page.drawText("FROM", { x: 44, y: 674, size: 9, font: bold, color: accent });
  [sellerName, sellerEmail, sellerPhone, sellerLocation, taxNumber ? `Tax No: ${taxNumber}` : ""]
    .filter(Boolean)
    .forEach((line, index) => page.drawText(line, { x: 44, y: 656 - index * 14, size: 9, font: regular, color: gray }));

  page.drawText("BILL TO", { x: 326, y: 674, size: 9, font: bold, color: accent });
  const billLines = [data.customerName, data.company || "", data.customerEmail, ...addressLines(data.billingAddress)].filter(Boolean);
  billLines.slice(0, 6).forEach((line, index) =>
    page.drawText(String(line), { x: 326, y: 656 - index * 14, size: 9, font: regular, color: gray }),
  );

  page.drawText(`Invoice date: ${data.invoiceDate.toLocaleDateString("en-CA")}`, { x: 44, y: 562, size: 9, font: regular, color: gray });
  page.drawText(`Order: ${data.orderId}`, { x: 326, y: 562, size: 8, font: regular, color: gray });

  const tableY = 520;
  page.drawRectangle({ x: 44, y: tableY, width: 524, height: 32, color: navy });
  page.drawText("DESCRIPTION", { x: 56, y: tableY + 11, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("AMOUNT", { x: 500, y: tableY + 11, size: 9, font: bold, color: rgb(1, 1, 1) });

  page.drawText(data.productName, { x: 56, y: tableY - 28, size: 11, font: bold, color: navy });
  page.drawText(data.planName, { x: 56, y: tableY - 45, size: 9, font: regular, color: gray });
  page.drawText(`License term: ${data.licenseTerm}  |  Devices: ${data.devices}`, { x: 56, y: tableY - 61, size: 8, font: regular, color: gray });
  page.drawText(money(data.subtotal, data.currency), { x: 490, y: tableY - 35, size: 10, font: regular, color: navy });

  page.drawLine({ start: { x: 44, y: 414 }, end: { x: 568, y: 414 }, thickness: 0.7, color: rgb(0.82, 0.84, 0.86) });
  const totals = [
    ["Subtotal", data.subtotal],
    ["Tax", data.tax],
    ["Total", data.total],
  ] as const;
  totals.forEach(([label, value], index) => {
    const y = 390 - index * 24;
    page.drawText(label, { x: 400, y, size: index === 2 ? 11 : 9, font: index === 2 ? bold : regular, color: navy });
    page.drawText(money(value, data.currency), { x: 492, y, size: index === 2 ? 11 : 9, font: index === 2 ? bold : regular, color: navy });
  });

  page.drawRectangle({ x: 44, y: 265, width: 524, height: 52, color: rgb(0.95, 0.97, 0.98) });
  page.drawText("Payment status: PAID", { x: 56, y: 294, size: 10, font: bold, color: accent });
  page.drawText("Thank you for purchasing MarineStruc.", { x: 56, y: 278, size: 9, font: regular, color: gray });

  page.drawText("MarineStruc is independent third-party software for use with compatible Autodesk AutoCAD software.", { x: 44, y: 88, size: 7.5, font: regular, color: gray });
  page.drawText("Purchase and use are subject to the MarineStruc License and Product Policy accepted with the order.", { x: 44, y: 75, size: 7.5, font: regular, color: gray });

  return pdf.save();
}
