create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.sync_profile_stripe_customer_from_paid_order()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'paid' and new.stripe_customer_id is not null then
    update public.profiles
    set stripe_customer_id = coalesce(stripe_customer_id, new.stripe_customer_id),
        updated_at = case when stripe_customer_id is null then now() else updated_at end
    where id = new.user_id;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_profile_stripe_customer_from_paid_order() from public, anon, authenticated;

drop trigger if exists trg_orders_sync_profile_stripe_customer on public.orders;
create trigger trg_orders_sync_profile_stripe_customer
after insert or update of status, stripe_customer_id on public.orders
for each row
execute function private.sync_profile_stripe_customer_from_paid_order();
