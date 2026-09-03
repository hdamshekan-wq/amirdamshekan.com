alter table public.profiles
  add column if not exists stripe_customer_id text;

create unique index if not exists idx_profiles_stripe_customer_id_unique
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

with canonical as (
  select distinct on (l.user_id)
    l.user_id,
    o.stripe_customer_id
  from public.licenses l
  join public.orders o on o.id = l.order_id
  where l.status = 'active'
    and o.stripe_subscription_id is not null
    and o.stripe_customer_id is not null
  order by l.user_id, l.created_at desc
)
update public.profiles p
set stripe_customer_id = c.stripe_customer_id,
    updated_at = now()
from canonical c
where p.id = c.user_id
  and p.stripe_customer_id is null;

with fallback as (
  select distinct on (o.user_id)
    o.user_id,
    o.stripe_customer_id
  from public.orders o
  where o.status = 'paid'
    and o.stripe_customer_id is not null
  order by o.user_id, o.paid_at desc nulls last, o.created_at desc
)
update public.profiles p
set stripe_customer_id = f.stripe_customer_id,
    updated_at = now()
from fallback f
where p.id = f.user_id
  and p.stripe_customer_id is null;

comment on column public.profiles.stripe_customer_id is
  'Canonical Stripe Customer ID reused for all MarineStruc purchases and billing portal sessions.';
