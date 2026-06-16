-- =====================================================================
-- ZENTRO — Migración 0012 — Compras para reventa
-- Modelo centrado en cómo piensa un revendedor: "hice una compra, invertí,
-- compré productos, tuve gastos, ¿cuánto me costó de verdad?, ¿ya recuperé?".
-- Entidad principal: COMPRA (no Proveedor→Orden→Lote).
-- =====================================================================

create table if not exists public.purchases (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  name              text not null,                 -- "Compra Shein Junio 2026"
  purchase_date     date not null default current_date,
  description       text,
  currency          char(3) not null,
  status            text not null default 'open',  -- open | closed
  margin_min_bps    int not null default 2000,     -- 20%
  margin_target_bps int not null default 4000,     -- 40%
  margin_max_bps    int not null default 6000,     -- 60%
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id)
);
create index if not exists idx_purchases_org on public.purchases(organization_id, purchase_date desc);

-- Gastos asociados a la compra (envío, casillero, aduanas, comisiones, etc.)
create table if not exists public.purchase_expenses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  purchase_id     uuid not null references public.purchases(id) on delete cascade,
  type            text not null default 'other',   -- envio|casillero|transporte|aduanas|impuestos|comision_bancaria|comision_plataforma|other
  description     text,
  amount_minor    bigint not null check (amount_minor >= 0),
  created_at      timestamptz not null default now()
);
create index if not exists idx_purchase_expenses_p on public.purchase_expenses(purchase_id);

-- Productos comprados (independientes del catálogo)
create table if not exists public.purchase_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  purchase_id      uuid not null references public.purchases(id) on delete cascade,
  name             text not null,
  category         text,
  sku              text,
  quantity         numeric(14,3) not null default 1 check (quantity > 0),
  unit_cost_minor  bigint not null default 0 check (unit_cost_minor >= 0),  -- costo de compra por unidad (sin gastos)
  sale_price_minor bigint not null default 0,        -- precio de venta elegido
  units_sold       numeric(14,3) not null default 0 check (units_sold >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_purchase_items_p on public.purchase_items(purchase_id);

-- updated_at
do $$
declare t text;
begin
  foreach t in array array['purchases','purchase_items'] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- RLS estándar por organización
do $$
declare t text;
begin
  foreach t in array array['purchases','purchase_expenses','purchase_items'] loop
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
