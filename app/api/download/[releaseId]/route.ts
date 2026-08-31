import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request, { params }: { params: Promise<{ releaseId: string }> }) {
  const { releaseId } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: release } = await supabase
    .from("software_releases")
    .select("id,storage_path,active,published_at")
    .eq("id", releaseId)
    .eq("active", true)
    .single();
  if (!release) return NextResponse.json({ error: "Release not found" }, { status: 404 });

  const { data: licenses } = await supabase
    .from("licenses")
    .select("id,status,expires_at,updates_expires_at")
    .eq("user_id", userId)
    .eq("status", "active");

  const now = new Date();
  const releasePublishedAt = new Date(release.published_at);
  const entitledLicense = (licenses || []).find((license) => {
    if (license.expires_at) {
      // Subscription: access requires the paid license term to still be active.
      return new Date(license.expires_at) > now;
    }
    // Perpetual: the installed software keeps working forever, but new releases are
    // downloadable only if they were published during the included update entitlement.
    return !license.updates_expires_at || releasePublishedAt <= new Date(license.updates_expires_at);
  });

  if (!entitledLicense) {
    return NextResponse.json(
      { error: "This release requires an active subscription or a qualifying Perpetual update entitlement." },
      { status: 403 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("software").createSignedUrl(release.storage_path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Unable to create download link" }, { status: 500 });

  await supabase.from("download_logs").insert({
    user_id: userId,
    license_id: entitledLicense.id,
    release_id: release.id,
    user_agent: request.headers.get("user-agent"),
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
  });

  return NextResponse.redirect(data.signedUrl, 302);
}
