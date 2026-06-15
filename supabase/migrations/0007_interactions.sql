-- =====================================================================
-- ZENTRO — Migración 0007 — Interacciones con clientes
-- Historial de contacto: llamadas, reuniones, correos, notas, etc.
-- =====================================================================

do $$ begin
  create type public.interaction_type as enum ('call','meeting','email','whatsapp','note','visit');
exception when duplicate_object then null; end $$;

create table if not exists public.interactions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid not null references public.customers(id) on delete cascade,
  type            public.interaction_type not null default 'note',
  direction       text,                       -- 'in' | 'out' | null
  subject         text,
  body            text,
  occurred_at     timestamptz not null default now(),
  next_action_at  timestamptz,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);
create index if not exists idx_interactions_customer on public.interactions(customer_id, occurred_at desc);

alter table public.interactions enable row level security;

drop policy if exists interactions_sel on public.interactions;
create policy interactions_sel on public.interactions for select
  using (organization_id in (select public.current_user_orgs()));
drop policy if exists interactions_ins on public.interactions;
create policy interactions_ins on public.interactions for insert
  with check (organization_id in (select public.current_user_orgs()));
drop policy if exists interactions_upd on public.interactions;
create policy interactions_upd on public.interactions for update
  using (organization_id in (select public.current_user_orgs()))
  with check (organization_id in (select public.current_user_orgs()));
drop policy if exists interactions_del on public.interactions;
create policy interactions_del on public.interactions for delete
  using (organization_id in (select public.current_user_orgs()));
