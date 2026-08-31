import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invoice } = await supabase.from("invoices").select("storage_path").eq("id", invoiceId).eq("user_id", userId).single();
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("invoices").createSignedUrl(invoice.storage_path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Unable to create invoice link" }, { status: 500 });
  return NextResponse.redirect(data.signedUrl, 302);
}
