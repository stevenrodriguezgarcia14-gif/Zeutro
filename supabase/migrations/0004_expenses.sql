-- =====================================================================
-- ZENTRO — Migración 0004 — Gastos
-- Tabla de gastos (salidas de dinero) con RLS multi-tenant.
-- MVP: categoría y proveedor como texto (se normalizan a tablas más adelante).
-- =====================================================================

do $$ begin
  create type public.expense_status as enum ('pending','paid');
exception when duplicate_object then null; end $$;

create table if not exists public.expenses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  description     text not null,
  category        text,
  vendor          text,
  amount_minor    bigint not null check (amount_minor > 0),
  tax_minor       bigint not null default 0 check (tax_minor >= 0),
  currency        char(3) not null,
  expense_date    date not null default current_date,
  payment_status  public.expense_status not null default 'paid',
  account_id      uuid references public.accounts(id),
  is_deductible   boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);

create index if not exists idx_expenses_org      on public.expenses(organization_id);
create index if not exists idx_expenses_org_date on public.expenses(organization_id, expense_date);

-- updated_at
drop trigger if exists trg_expenses_updated on public.expenses;
create trigger trg_expenses_updated before update on public.expenses
  for each row execute function public.set_updated_at();

-- RLS
alter table public.expenses enable row level security;

drop policy if exists expenses_sel on public.expenses;
create policy expenses_sel on public.expenses for select
  using (organization_id in (select public.current_user_orgs()));

drop policy if exists expenses_ins on public.expenses;
create policy expenses_ins on public.expenses for insert
  with check (organization_id in (select public.current_user_orgs()));

drop policy if exists expenses_upd on public.expenses;
create policy expenses_upd on public.expenses for update
  using (organization_id in (select public.current_user_orgs()))
  with check (organization_id in (select public.current_user_orgs()));

drop policy if exists expenses_del on public.expenses;
create policy expenses_del on public.expenses for delete
  using (organization_id in (select public.current_user_orgs()));
