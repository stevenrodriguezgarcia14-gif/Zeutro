-- =====================================================================
-- ZENTRO -- Migracion 0024 -- Ventas rapidas (ingresos sin factura)
-- Para negocios de mostrador (helados, comida, tienda) que venden de
-- contado y no necesitan emitir una factura por cada venta.
-- Cuenta como ingreso en Rentabilidad y Dashboard; si se elige una cuenta,
-- mueve su saldo.
-- =====================================================================

create table if not exists public.quick_sales (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  description     text,
  amount_minor    bigint not null check (amount_minor > 0),
  currency        char(3) not null,
  method          public.payment_method not null default 'cash',
  account_id      uuid references public.accounts(id),
  sold_at         date not null default current_date,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);
create index if not exists idx_quick_sales_org on public.quick_sales(organization_id, sold_at desc);

alter table public.quick_sales enable row level security;

drop policy if exists quick_sales_sel on public.quick_sales;
create policy quick_sales_sel on public.quick_sales for select
  using (organization_id in (select public.current_user_orgs()));

drop policy if exists quick_sales_ins on public.quick_sales;
create policy quick_sales_ins on public.quick_sales for insert
  with check (organization_id in (select public.current_user_orgs()) and public.is_writer_in(organization_id));

drop policy if exists quick_sales_upd on public.quick_sales;
create policy quick_sales_upd on public.quick_sales for update
  using (organization_id in (select public.current_user_orgs()) and public.is_writer_in(organization_id))
  with check (organization_id in (select public.current_user_orgs()) and public.is_writer_in(organization_id));

drop policy if exists quick_sales_del on public.quick_sales;
create policy quick_sales_del on public.quick_sales for delete
  using (organization_id in (select public.current_user_orgs()) and public.is_writer_in(organization_id));
