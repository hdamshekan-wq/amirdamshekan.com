begin;

-- Security: this trigger helper is internal only and must never be callable via PostgREST.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Performance indexes for RLS ownership filters and foreign keys.
create index if not exists idx_policy_acceptances_user_id on public.policy_acceptances(user_id);
create index if not exists idx_policy_acceptances_policy_version_id on public.policy_acceptances(policy_version_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_license_plan_id on public.orders(license_plan_id);
create index if not exists idx_orders_policy_version_id on public.orders(policy_version_id);
create index if not exists idx_orders_stripe_customer_id on public.orders(stripe_customer_id) where stripe_customer_id is not null;
create index if not exists idx_orders_stripe_subscription_id on public.orders(stripe_subscription_id) where stripe_subscription_id is not null;
create index if not exists idx_licenses_user_id on public.licenses(user_id);
create unique index if not exists idx_licenses_stripe_subscription_unique on public.licenses(stripe_subscription_id) where stripe_subscription_id is not null;
create index if not exists idx_invoices_user_id on public.invoices(user_id);
create index if not exists idx_download_logs_user_id on public.download_logs(user_id);
create index if not exists idx_download_logs_license_id on public.download_logs(license_id);
create index if not exists idx_download_logs_release_id on public.download_logs(release_id);

-- Recurring subscriptions create multiple invoices against the original purchase/order.
alter table public.invoices drop constraint if exists invoices_order_id_key;
alter table public.invoices add column if not exists stripe_invoice_id text;
alter table public.invoices add column if not exists invoice_kind text not null default 'initial';
alter table public.invoices drop constraint if exists invoices_invoice_kind_check;
alter table public.invoices add constraint invoices_invoice_kind_check check (invoice_kind in ('initial','renewal','adjustment'));
create unique index if not exists idx_invoices_stripe_invoice_unique on public.invoices(stripe_invoice_id) where stripe_invoice_id is not null;
create index if not exists idx_invoices_order_id on public.invoices(order_id);

-- Stripe webhook event ledger for idempotency and audit.
create table if not exists public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  object_id text,
  status text not null default 'processing' check(status in ('processing','processed','failed','ignored')),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.stripe_events enable row level security;
revoke all on public.stripe_events from anon, authenticated;
create policy "stripe_events_deny_browser"
on public.stripe_events
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
create index if not exists idx_stripe_events_event_type on public.stripe_events(event_type);
create index if not exists idx_stripe_events_status on public.stripe_events(status);

-- Private storage. Browser users receive only short-lived signed URLs from the website server.
insert into storage.buckets (id,name,public)
values ('invoices','invoices',false),('software','software',false)
on conflict (id) do update set public = excluded.public;

commit;
