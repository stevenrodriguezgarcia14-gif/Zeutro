-- =====================================================================
-- ZENTRO — Migración 0010 — Cotizaciones + link de pago en facturas
-- =====================================================================

-- Link de pago manual en facturas (SINPE, PayPal, etc.)
alter table public.invoices add column if not exists payment_link text;

do $$ begin
  create type public.quotation_status as enum ('draft','sent','accepted','rejected','expired','converted');
exception when duplicate_object then null; end $$;

create table if not exists public.quotations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  number          text not null,
  customer_id     uuid not null references public.customers(id),
  opportunity_id  uuid references public.opportunities(id),
  currency        char(3) not null,
  issue_date      date not null default current_date,
  valid_until     date not null,
  status          public.quotation_status not null default 'draft',
  subtotal_minor  bigint not null default 0,
  tax_minor       bigint not null default 0,
  total_minor     bigint not null default 0,
  notes           text,
  invoice_id      uuid references public.invoices(id),  -- si se convirtió
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  unique (organization_id, number)
);
create index if not exists idx_quotations_org on public.quotations(organization_id, status);

create table if not exists public.quotation_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  quotation_id     uuid not null references public.quotations(id) on delete cascade,
  product_id       uuid references public.products(id),
  description      text not null,
  quantity         numeric(14,3) not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  tax_rate_bps     int not null default 0,
  line_total_minor bigint not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists idx_quotation_items_q on public.quotation_items(quotation_id);

drop trigger if exists trg_quotations_updated on public.quotations;
create trigger trg_quotations_updated before update on public.quotations
  for each row execute function public.set_updated_at();

do $$
declare t text;
begin
  foreach t in array array['quotations','quotation_items'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %1$s_sel on public.%1$s;', t);
    execute format('create policy %1$s_sel on public.%1$s for select using (organization_id in (select public.current_user_orgs()));', t);
    execute format('drop policy if exists %1$s_ins on public.%1$s;', t);
    execute format('create policy %1$s_ins on public.%1$s for insert with check (organization_id in (select public.current_user_orgs()));', t);
    execute format('drop policy if exists %1$s_upd on public.%1$s;', t);
    execute format('create policy %1$s_upd on public.%1$s for update using (organization_id in (select public.current_user_orgs())) with check (organization_id in (select public.current_user_orgs()));', t);
    execute format('drop policy if exists %1$s_del on public.%1$s;', t);
    execute format('create policy %1$s_del on public.%1$s for delete using (organization_id in (select public.current_user_orgs()));', t);
  end loop;
end $$;
