begin;

alter table public.orders
  add column if not exists purchase_term text,
  add column if not exists seat_count integer,
  add column if not exists module_codes text[],
  add column if not exists full_suite boolean,
  add column if not exists pricing_snapshot jsonb;

alter table public.licenses
  add column if not exists purchase_term text,
  add column if not exists seat_count integer,
  add column if not exists module_codes text[],
  add column if not exists full_suite boolean;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_purchase_term_check') then
    alter table public.orders add constraint orders_purchase_term_check
      check (purchase_term is null or purchase_term in ('monthly','annual','four_year'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_seat_count_check') then
    alter table public.orders add constraint orders_seat_count_check
      check (seat_count is null or seat_count between 1 and 20);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'licenses_purchase_term_check') then
    alter table public.licenses add constraint licenses_purchase_term_check
      check (purchase_term is null or purchase_term in ('monthly','annual','four_year'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'licenses_seat_count_check') then
    alter table public.licenses add constraint licenses_seat_count_check
      check (seat_count is null or seat_count between 1 and 20);
  end if;
end $$;

commit;
