export function relationId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof (value as { id?: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return null;
}

export function invoiceSubscriptionId(invoice: unknown): string | null {
  const value = invoice as {
    subscription?: unknown;
    parent?: { type?: string; subscription_details?: { subscription?: unknown } } | null;
  };
  return relationId(value?.parent?.subscription_details?.subscription) || relationId(value?.subscription);
}

export function invoiceServicePeriod(invoice: unknown): { start: string; end: string } | null {
  const value = invoice as {
    period_start?: number;
    period_end?: number;
    lines?: { data?: Array<{ period?: { start?: number; end?: number } }> };
  };

  const starts: number[] = [];
  const ends: number[] = [];
  for (const line of value?.lines?.data || []) {
    if (typeof line?.period?.start === "number") starts.push(line.period.start);
    if (typeof line?.period?.end === "number") ends.push(line.period.end);
  }

  const start = starts.length ? Math.min(...starts) : value?.period_start;
  const end = ends.length ? Math.max(...ends) : value?.period_end;
  if (typeof start !== "number" || typeof end !== "number" || end <= start) return null;

  return {
    start: new Date(start * 1000).toISOString(),
    end: new Date(end * 1000).toISOString(),
  };
}

export function invoiceTaxMinor(invoice: unknown): number {
  const value = invoice as {
    total?: number;
    subtotal?: number;
    total_excluding_tax?: number | null;
    total_taxes?: Array<{ amount?: number }> | null;
  };

  if (Array.isArray(value?.total_taxes)) {
    const sum = value.total_taxes.reduce((n, item) => n + (typeof item?.amount === "number" ? item.amount : 0), 0);
    if (sum > 0) return sum;
  }
  if (typeof value?.total === "number" && typeof value?.total_excluding_tax === "number") {
    return Math.max(0, value.total - value.total_excluding_tax);
  }
  if (typeof value?.total === "number" && typeof value?.subtotal === "number") {
    return Math.max(0, value.total - value.subtotal);
  }
  return 0;
}

function subscriptionCurrentPeriodEnd(subscription: unknown): string | null {
  const value = subscription as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  } | null;
  const itemPeriodEnds = (value?.items?.data || [])
    .map((item) => item.current_period_end)
    .filter((periodEnd): periodEnd is number => typeof periodEnd === "number");
  const periodEnd = itemPeriodEnds.length
    ? Math.max(...itemPeriodEnds)
    : value?.current_period_end;

  return typeof periodEnd === "number"
    ? new Date(periodEnd * 1000).toISOString()
    : null;
}

export function subscriptionLifecycleSnapshot(subscription: unknown, nowUnixSeconds = Date.now() / 1000) {
  const value = subscription as {
    status?: string;
    cancel_at?: number | null;
    cancel_at_period_end?: boolean;
  } | null;
  const status = typeof value?.status === "string" ? value.status : null;
  const cancelAt = typeof value?.cancel_at === "number" ? value.cancel_at : null;
  const scheduledByCancelAt = (status === "active" || status === "trialing")
    && cancelAt !== null
    && cancelAt > nowUnixSeconds;
  const scheduledCancellation = value?.cancel_at_period_end === true || scheduledByCancelAt;
  // This is the lifecycle date rendered by My Account. A scheduled cancel_at is
  // authoritative; otherwise retain the subscription item's current period end.
  const periodEnd = scheduledCancellation && cancelAt !== null
    ? new Date(cancelAt * 1000).toISOString()
    : subscriptionCurrentPeriodEnd(subscription);

  return {
    stripe_subscription_status: status,
    stripe_cancel_at_period_end: scheduledCancellation,
    stripe_current_period_end: periodEnd,
  };
}
