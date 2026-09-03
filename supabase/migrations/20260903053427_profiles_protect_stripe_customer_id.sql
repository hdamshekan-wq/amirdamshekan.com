revoke all privileges on table public.profiles from anon;

revoke insert, delete, truncate, references, trigger, update on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (first_name, last_name, company, phone, updated_at) on public.profiles to authenticated;

comment on column public.profiles.stripe_customer_id is
  'Server-managed canonical Stripe Customer ID. Authenticated clients must not be granted UPDATE on this column.';
