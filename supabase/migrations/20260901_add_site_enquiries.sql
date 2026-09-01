create table if not exists public.site_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  enquiry_type text not null,
  details text not null,
  preferred_contact text not null,
  status text not null default 'new',
  notification_status text not null default 'not_configured',
  created_at timestamptz not null default now()
);

alter table public.site_enquiries enable row level security;

create index if not exists site_enquiries_created_at_idx
  on public.site_enquiries (created_at desc);

create index if not exists site_enquiries_status_idx
  on public.site_enquiries (status, created_at desc);

revoke all on table public.site_enquiries from anon, authenticated;
