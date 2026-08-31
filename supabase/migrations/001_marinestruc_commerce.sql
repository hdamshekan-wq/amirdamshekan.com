begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  company text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id,email,first_name,last_name,company)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'first_name',''),
    nullif(new.raw_user_meta_data->>'last_name',''),
    nullif(new.raw_user_meta_data->>'company','')
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  version text not null,
  title text not null,
  content_sha256 text not null,
  effective_at timestamptz not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(slug,version)
);

create table if not exists public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_version_id uuid not null references public.policy_versions(id),
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  unique(user_id,policy_version_id)
);

create table if not exists public.license_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  display_price text not null,
  stripe_test_price_id text unique,
  stripe_live_price_id text unique,
  billing_mode text not null check(billing_mode in ('subscription','payment')),
  term_days integer,
  max_devices integer not null default 1 check (max_devices > 0),
  updates_days integer,
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  license_plan_id uuid not null references public.license_plans(id),
  policy_version_id uuid not null references public.policy_versions(id),
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'pending' check(status in ('pending','paid','failed','refunded','disputed')),
  fulfillment_status text not null default 'pending' check(fulfillment_status in ('pending','processing','pending_license_server','fulfilled','failed')),
  currency text not null default 'cad',
  subtotal_minor bigint not null default 0,
  tax_minor bigint not null default 0,
  total_minor bigint not null default 0,
  customer_name text,
  customer_email text,
  billing_address jsonb,
  stripe_terms_accepted_at timestamptz,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id),
  user_id uuid not null references auth.users(id),
  external_license_id text not null unique,
  license_key text not null unique,
  status text not null check(status in ('active','suspended','revoked','expired')),
  starts_at timestamptz not null,
  expires_at timestamptz,
  max_devices integer not null default 1,
  stripe_subscription_id text,
  updates_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create sequence if not exists public.invoice_number_seq start 1;
create or replace function public.issue_invoice_number()
returns text language sql security definer set search_path = public as $$
  select 'MS-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text,6,'0');
$$;
revoke all on function public.issue_invoice_number() from public, anon, authenticated;
grant execute on function public.issue_invoice_number() to service_role;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id),
  user_id uuid not null references auth.users(id),
  invoice_number text not null unique,
  storage_path text not null,
  currency text not null,
  subtotal_minor bigint not null,
  tax_minor bigint not null,
  total_minor bigint not null,
  issued_at timestamptz not null default now(),
  emailed_at timestamptz
);

create table if not exists public.software_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  storage_path text not null unique,
  release_notes text,
  active boolean not null default false,
  published_at timestamptz not null default now()
);

create table if not exists public.download_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id),
  license_id uuid not null references public.licenses(id),
  release_id uuid not null references public.software_releases(id),
  downloaded_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

-- Policy hash is the SHA-256 of the exact Version 1.0 text in lib/marinestruc/policy.ts.
insert into public.policy_versions(slug,version,title,content_sha256,effective_at,active)
values ('marinestruc-license-policy','1.0','MarineStruc License and Product Policy','c3c8482ed777d3f55143cb1c018ff418082d9d13e36949b896c4c3c2b428f467','2026-08-29T00:00:00Z',true)
on conflict(slug,version) do update set active=excluded.active, content_sha256=excluded.content_sha256;

insert into public.license_plans(
  code,name,description,display_price,
  stripe_test_price_id,stripe_live_price_id,billing_mode,
  term_days,max_devices,updates_days,active,sort_order
)
values
('monthly-1-device','Monthly','MarineStruc subscription for one device.','CAD $20 / month','price_1UAIcgC9GH9zyxe7kWQhZWYn',null,'subscription',30,1,null,true,10),
('annual-1-device','Annual','MarineStruc annual subscription for one device.','CAD $180 / year','price_1UAId9C9GH9zyxe7fQRBw7tX',null,'subscription',365,1,null,true,20),
('perpetual-1-device','Perpetual','MarineStruc perpetual license for one device with one year of eligible updates.','CAD $400 one-time','price_1UAIdEC9GH9zyxe7YvCPsezU',null,'payment',null,1,365,true,30)
on conflict(code) do update set
  name=excluded.name,
  description=excluded.description,
  display_price=excluded.display_price,
  stripe_test_price_id=excluded.stripe_test_price_id,
  billing_mode=excluded.billing_mode,
  term_days=excluded.term_days,
  max_devices=excluded.max_devices,
  updates_days=excluded.updates_days,
  active=excluded.active,
  sort_order=excluded.sort_order;

alter table public.profiles enable row level security;
alter table public.policy_versions enable row level security;
alter table public.policy_acceptances enable row level security;
alter table public.license_plans enable row level security;
alter table public.orders enable row level security;
alter table public.licenses enable row level security;
alter table public.invoices enable row level security;
alter table public.software_releases enable row level security;
alter table public.download_logs enable row level security;

-- Recreate policies safely.
do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies where schemaname='public' and tablename in ('profiles','policy_versions','policy_acceptances','license_plans','orders','licenses','invoices','software_releases','download_logs') loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "policy_versions_read" on public.policy_versions for select to anon,authenticated using (active = true);
create policy "policy_acceptances_read_own" on public.policy_acceptances for select to authenticated using ((select auth.uid()) = user_id);
create policy "policy_acceptances_insert_own" on public.policy_acceptances for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "policy_acceptances_update_own" on public.policy_acceptances for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "license_plans_read" on public.license_plans for select to anon,authenticated using (active = true);
create policy "orders_read_own" on public.orders for select to authenticated using ((select auth.uid()) = user_id);
create policy "licenses_read_own" on public.licenses for select to authenticated using ((select auth.uid()) = user_id);
create policy "invoices_read_own" on public.invoices for select to authenticated using ((select auth.uid()) = user_id);
create policy "software_releases_read" on public.software_releases for select to authenticated using (active = true);
create policy "download_logs_insert_own" on public.download_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "download_logs_read_own" on public.download_logs for select to authenticated using ((select auth.uid()) = user_id);

commit;
