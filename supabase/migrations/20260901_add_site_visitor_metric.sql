create table if not exists public.site_metrics (
  metric text primary key,
  value bigint not null default 0 check (value >= 0),
  updated_at timestamptz not null default now()
);

alter table public.site_metrics enable row level security;

insert into public.site_metrics (metric, value)
values ('total_visitors', 0)
on conflict (metric) do nothing;

create or replace function public.increment_site_metric(metric_name text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_value bigint;
begin
  update public.site_metrics
  set value = value + 1,
      updated_at = now()
  where metric = metric_name
  returning value into new_value;

  if new_value is null then
    insert into public.site_metrics (metric, value)
    values (metric_name, 1)
    returning value into new_value;
  end if;

  return new_value;
end;
$$;

revoke all on function public.increment_site_metric(text) from public;
revoke all on function public.increment_site_metric(text) from anon;
revoke all on function public.increment_site_metric(text) from authenticated;
grant execute on function public.increment_site_metric(text) to service_role;
