alter table public.licenses
  add column if not exists stripe_subscription_status text,
  add column if not exists stripe_cancel_at_period_end boolean not null default false,
  add column if not exists stripe_current_period_end timestamptz;

create index if not exists idx_licenses_subscription_status
  on public.licenses (stripe_subscription_status)
  where stripe_subscription_status is not null;

comment on column public.licenses.stripe_subscription_status is 'Latest Stripe subscription status snapshot for recurring MarineStruc licenses.';
comment on column public.licenses.stripe_cancel_at_period_end is 'Whether Stripe is scheduled to cancel the subscription at the end of the current billing period.';
comment on column public.licenses.stripe_current_period_end is 'Latest Stripe billing period end snapshot for recurring MarineStruc licenses.';
