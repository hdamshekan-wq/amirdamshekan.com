export type ProvisionLicenseInput = {
  orderId: string;
  stripeCheckoutSessionId: string;
  stripeSubscriptionId?: string | null;
  userId: string;
  name: string;
  email: string;
  company?: string | null;
  planCode: string;
  termDays?: number | null;
  expiresAt?: string | null;
  maxDevices: number;
  updatesDays?: number | null;
};

export type ProvisionLicenseResult = {
  licenseId: string;
  licenseKey: string;
  status: "active" | "suspended" | "revoked";
  startsAt: string;
  expiresAt: string | null;
  updatesExpiresAt?: string | null;
  maxDevices: number;
};

function commerceConfig(urlName: string) {
  const url = process.env[urlName];
  const secret = process.env.LICENSE_SERVER_PORTAL_SECRET;
  return url && secret ? { url, secret } : null;
}

export async function provisionMarineStrucLicense(input: ProvisionLicenseInput): Promise<ProvisionLicenseResult | null> {
  const config = commerceConfig("LICENSE_SERVER_INTERNAL_URL");
  if (!config) return null;

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.secret}`,
      "idempotency-key": `stripe:${input.stripeCheckoutSessionId}`,
    },
    body: JSON.stringify({
      product: "MarineStruc",
      orderId: input.orderId,
      stripeCheckoutSessionId: input.stripeCheckoutSessionId,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      customer: {
        userId: input.userId,
        name: input.name,
        email: input.email,
        company: input.company ?? null,
      },
      license: {
        planCode: input.planCode,
        termDays: input.termDays ?? null,
        expiresAt: input.expiresAt ?? null,
        maxDevices: input.maxDevices,
        updatesDays: input.updatesDays ?? null,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`License server provisioning failed (${response.status}): ${details.slice(0, 300)}`);
  }
  return (await response.json()) as ProvisionLicenseResult;
}

export async function renewMarineStrucLicense(input: {
  stripeInvoiceId: string;
  stripeSubscriptionId: string;
  externalLicenseId: string;
  periodStart: string;
  periodEnd: string;
  amountPaid: number;
  currency: string;
}): Promise<ProvisionLicenseResult | null> {
  const config = commerceConfig("LICENSE_SERVER_RENEW_URL");
  if (!config) return null;

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.secret}`,
      "idempotency-key": `stripe-invoice:${input.stripeInvoiceId}`,
    },
    body: JSON.stringify({ product: "MarineStruc", ...input }),
    cache: "no-store",
  });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`License server renewal failed (${response.status}): ${details.slice(0, 300)}`);
  }
  return (await response.json()) as ProvisionLicenseResult;
}

export async function setMarineStrucLicenseStatus(input: {
  stripeEventId: string;
  stripeSubscriptionId: string;
  externalLicenseId: string;
  status: "active" | "suspended" | "expired";
  reason: string;
}): Promise<boolean> {
  const config = commerceConfig("LICENSE_SERVER_STATUS_URL");
  if (!config) return false;

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.secret}`,
      "idempotency-key": `stripe-event:${input.stripeEventId}`,
    },
    body: JSON.stringify({ product: "MarineStruc", ...input }),
    cache: "no-store",
  });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`License server status sync failed (${response.status}): ${details.slice(0, 300)}`);
  }
  return true;
}
