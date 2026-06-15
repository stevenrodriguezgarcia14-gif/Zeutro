-- =====================================================================
-- ZENTRO — Sistema Operativo para Emprendedores
-- Migración 0001 — Fase 1: Esquema núcleo + RLS multi-tenant
-- Plataforma: Supabase (PostgreSQL 15+)
-- Convenciones (ver DOCUMENTO_MAESTRO_PROYECTO.md):
--   * Dinero: entero en unidades menores (centavos) -> *_minor (bigint) + moneda char(3) (ADR-006)
--   * Multi-tenant por fila: organization_id + Row Level Security (ADR-005)
--   * Auditoría: created_at / updated_at / created_by en cada tabla
--   * UUID como PK
-- Aplicar en: Supabase Dashboard -> SQL Editor -> pegar y "Run".
-- Es idempotente en lo posible (IF NOT EXISTS). Ejecutar una sola vez.
-- =====================================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Utilidad: trigger updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 1) TENANCY: organizaciones y membresías
-- =====================================================================
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  country       char(2) not null default 'MX',
  base_currency char(3) not null default 'MXN',
  timezone      text not null default 'America/Mexico_City',
  locale        text not null default 'es',
  -- datos del emisor para facturas
  legal_name    text,
  tax_id        text,
  logo_url      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id)
);

do $$ begin
  create type public.membership_role as enum
    ('owner','admin','finance','sales','operations','member','viewer','external_accountant');
exception when duplicate_object then null; end $$;

create table if not exists public.memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.membership_role not null default 'owner',
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index if not exists idx_memberships_user on public.memberships(user_id);
create index if not exists idx_memberships_org  on public.memberships(organization_id);

-- Orgs del usuario actual (SECURITY DEFINER evita recursión de RLS)
create or replace function public.current_user_orgs()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select organization_id from public.memberships where user_id = auth.uid();
$$;

-- =====================================================================
-- 2) CATÁLOGOS: impuestos, clientes, productos, cuentas
-- =====================================================================

-- Tasas de impuesto (IVA/VAT/IGV/retención). rate_bps = puntos base (1600 = 16%)
create table if not exists public.tax_rates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  rate_bps        int  not null check (rate_bps >= 0 and rate_bps <= 100000),
  is_withholding  boolean not null default false,
  country         char(2),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);

-- Clientes
do $$ begin
  create type public.customer_type as enum ('person','company');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.customer_status as enum ('active','inactive','prospect','blocked');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.payment_terms as enum ('contado','net15','net30','net60','custom');
exception when duplicate_object then null; end $$;

create table if not exists public.customers (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  type               public.customer_type not null default 'company',
  legal_name         text not null,
  trade_name         text,
  tax_id             text,
  email              text,
  phone              text,
  whatsapp           text,
  billing_address    jsonb,
  currency           char(3),
  payment_terms      public.payment_terms not null default 'contado',
  credit_limit_minor bigint check (credit_limit_minor is null or credit_limit_minor >= 0),
  status             public.customer_status not null default 'active',
  owner_user_id      uuid references auth.users(id),
  tags               text[] not null default '{}',
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references auth.users(id)
);
create index if not exists idx_customers_org    on public.customers(organization_id);
create index if not exists idx_customers_status on public.customers(organization_id, status);

-- Productos y servicios
do $$ begin
  create type public.product_type as enum ('product','service','bundle');
exception when duplicate_object then null; end $$;

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  type             public.product_type not null default 'service',
  sku              text,
  name             text not null,
  description      text,
  unit             text not null default 'unidad',
  sale_price_minor bigint not null default 0 check (sale_price_minor >= 0),
  cost_price_minor bigint check (cost_price_minor is null or cost_price_minor >= 0),
  tax_rate_id      uuid references public.tax_rates(id),
  track_inventory  boolean not null default false,
  stock_qty        numeric(14,3) not null default 0,
  min_stock        numeric(14,3),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users(id),
  unique (organization_id, sku)
);
create index if not exists idx_products_org on public.products(organization_id);

-- Cuentas financieras
do $$ begin
  create type public.account_type as enum ('bank','cash','petty_cash','credit_card','digital_wallet');
exception when duplicate_object then null; end $$;

create table if not exists public.accounts (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  name                  text not null,
  type                  public.account_type not null default 'bank',
  currency              char(3) not null,
  opening_balance_minor bigint not null default 0,
  current_balance_minor bigint not null default 0,
  institution           text,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id)
);
create index if not exists idx_accounts_org on public.accounts(organization_id);

-- =====================================================================
-- 3) FACTURACIÓN: facturas, líneas, pagos, asignaciones
-- =====================================================================
do $$ begin
  create type public.invoice_status as enum
    ('draft','issued','partially_paid','paid','overdue','void','credited');
exception when duplicate_object then null; end $$;

create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid not null references public.customers(id),
  number          text not null,
  currency        char(3) not null,
  issue_date      date not null default current_date,
  due_date        date not null,
  subtotal_minor  bigint not null default 0 check (subtotal_minor >= 0),
  discount_minor  bigint not null default 0 check (discount_minor >= 0),
  tax_minor       bigint not null default 0 check (tax_minor >= 0),
  total_minor     bigint not null default 0 check (total_minor >= 0),
  paid_minor      bigint not null default 0 check (paid_minor >= 0),
  balance_minor   bigint generated always as (total_minor - paid_minor) stored,
  status          public.invoice_status not null default 'draft',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  unique (organization_id, number)
);
create index if not exists idx_invoices_org_status   on public.invoices(organization_id, status);
create index if not exists idx_invoices_org_due      on public.invoices(organization_id, due_date);
create index if not exists idx_invoices_org_customer on public.invoices(organization_id, customer_id);

create table if not exists public.invoice_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  invoice_id       uuid not null references public.invoices(id) on delete cascade,
  product_id       uuid references public.products(id),
  description      text not null,
  quantity         numeric(14,3) not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  discount_pct     numeric(5,2) not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  tax_rate_bps     int not null default 0 check (tax_rate_bps >= 0),
  line_total_minor bigint not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists idx_invoice_items_invoice on public.invoice_items(invoice_id);

do $$ begin
  create type public.payment_method as enum ('cash','transfer','card','check','gateway','other');
exception when duplicate_object then null; end $$;

create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid not null references public.customers(id),
  account_id      uuid references public.accounts(id),
  amount_minor    bigint not null check (amount_minor > 0),
  currency        char(3) not null,
  method          public.payment_method not null default 'transfer',
  paid_at         date not null default current_date,
  reference       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);
create index if not exists idx_payments_org      on public.payments(organization_id);
create index if not exists idx_payments_customer on public.payments(organization_id, customer_id);

-- Asignación pago -> factura (permite pagos parciales y a múltiples facturas)
create table if not exists public.payment_allocations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  payment_id      uuid not null references public.payments(id) on delete cascade,
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  amount_minor    bigint not null check (amount_minor > 0),
  created_at      timestamptz not null default now(),
  unique (payment_id, invoice_id)
);
create index if not exists idx_alloc_invoice on public.payment_allocations(invoice_id);

-- Movimientos de cuenta
do $$ begin
  create type public.txn_direction as enum ('in','out');
exception when duplicate_object then null; end $$;

create table if not exists public.account_transactions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  account_id       uuid not null references public.accounts(id) on delete cascade,
  direction        public.txn_direction not null,
  amount_minor     bigint not null check (amount_minor > 0),
  transaction_date date not null default current_date,
  description      text,
  source_type      text,   -- 'payment' | 'expense' | 'transfer' | 'manual'
  source_id        uuid,
  reconciled       boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists idx_acct_txn on public.account_transactions(account_id, transaction_date);

-- =====================================================================
-- 4) Triggers updated_at
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','tax_rates','customers','products','accounts',
    'invoices','payments'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- =====================================================================
-- 5) ROW LEVEL SECURITY
-- =====================================================================

-- 5.1 Organizations (acceso por pertenencia)
alter table public.organizations enable row level security;
drop policy if exists org_select on public.organizations;
create policy org_select on public.organizations for select
  using (id in (select public.current_user_orgs()));
drop policy if exists org_insert on public.organizations;
create policy org_insert on public.organizations for insert
  with check (auth.uid() is not null);  -- la app crea la membership inmediatamente después
drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations for update
  using (id in (select public.current_user_orgs()))
  with check (id in (select public.current_user_orgs()));

-- 5.2 Memberships
alter table public.memberships enable row level security;
drop policy if exists mem_select on public.memberships;
create policy mem_select on public.memberships for select
  using (user_id = auth.uid() or organization_id in (select public.current_user_orgs()));
drop policy if exists mem_insert on public.memberships;
create policy mem_insert on public.memberships for insert
  with check (user_id = auth.uid() or organization_id in (select public.current_user_orgs()));
drop policy if exists mem_delete on public.memberships;
create policy mem_delete on public.memberships for delete
  using (organization_id in (select public.current_user_orgs()));

-- 5.3 Tablas de negocio: política estándar por organización (CRUD para miembros)
--     RBAC fino por rol se añade en una migración posterior.
do $$
declare t text;
begin
  foreach t in array array[
    'tax_rates','customers','products','accounts',
    'invoices','invoice_items','payments','payment_allocations','account_transactions'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %1$s_sel on public.%1$s;', t);
    execute format('create policy %1$s_sel on public.%1$s for select
                      using (organization_id in (select public.current_user_orgs()));', t);
    execute format('drop policy if exists %1$s_ins on public.%1$s;', t);
    execute format('create policy %1$s_ins on public.%1$s for insert
                      with check (organization_id in (select public.current_user_orgs()));', t);
    execute format('drop policy if exists %1$s_upd on public.%1$s;', t);
    execute format('create policy %1$s_upd on public.%1$s for update
                      using (organization_id in (select public.current_user_orgs()))
                      with check (organization_id in (select public.current_user_orgs()));', t);
    execute format('drop policy if exists %1$s_del on public.%1$s;', t);
    execute format('create policy %1$s_del on public.%1$s for delete
                      using (organization_id in (select public.current_user_orgs()));', t);
  end loop;
end $$;

-- =====================================================================
-- FIN migración 0001
-- =====================================================================
