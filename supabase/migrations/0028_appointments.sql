-- =====================================================================
-- ZENTRO — Migración 0028 — Citas / agenda (perfil de servicios)
-- Convierte el "Calendario" en una agenda real: citas con fecha y hora,
-- opcionalmente ligadas a un cliente.
-- Idempotente.
-- =====================================================================

create table if not exists public.appointments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title           text not null,
  customer_id     uuid references public.customers(id),
  starts_at       timestamptz not null,
  duration_min    int not null default 60 check (duration_min > 0),
  location        text,
  notes           text,
  status          text not null default 'scheduled' check (status in ('scheduled','done','cancelled')),
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);
create index if not exists idx_appointments_org on public.appointments(organization_id, starts_at);

alter table public.appointments enable row level security;
drop policy if exists appointments_sel on public.appointments;
create policy appointments_sel on public.appointments for select
  using (organization_id in (select public.current_user_orgs()));
drop policy if exists appointments_ins on public.appointments;
create policy appointments_ins on public.appointments for insert
  with check (organization_id in (select public.current_user_orgs()));
drop policy if exists appointments_upd on public.appointments;
create policy appointments_upd on public.appointments for update
  using (organization_id in (select public.current_user_orgs()))
  with check (organization_id in (select public.current_user_orgs()));
drop policy if exists appointments_del on public.appointments;
create policy appointments_del on public.appointments for delete
  using (organization_id in (select public.current_user_orgs()));

-- =====================================================================
-- FIN migración 0028
-- =====================================================================
