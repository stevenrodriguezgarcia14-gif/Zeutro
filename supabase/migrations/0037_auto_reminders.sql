-- =====================================================================
-- ZENTRO — Migración 0037 — Cobranza automática y resumen semanal
-- El motor de retención: Zentro deja de ser pasivo. Un cron diario envía
-- recordatorios de pago a clientes con facturas vencidas y un resumen
-- semanal al dueño. Esta migración crea la auditoría/idempotencia y los
-- interruptores por negocio.
-- =====================================================================

-- 1) Interruptores por negocio (encendidos por defecto; toggle en Configuración)
alter table public.organizations
  add column if not exists auto_reminders boolean not null default true,
  add column if not exists weekly_summary boolean not null default true;

-- 2) Registro de correos automáticos: auditoría + idempotencia.
--    La unicidad garantiza que aunque el endpoint se invoque varias veces,
--    jamás se duplique un correo (máx. 1 por factura/día y 1 resumen/semana).
create table if not exists public.reminder_log (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind            text not null check (kind in ('collection','weekly')),
  invoice_id      uuid references public.invoices(id) on delete cascade,
  recipient       text not null,
  period          text not null, -- collection: fecha de envío (YYYY-MM-DD); weekly: semana ISO (YYYY-Www)
  sent_at         timestamptz not null default now()
);
create unique index if not exists reminder_log_collection_uq
  on public.reminder_log (invoice_id, period) where kind = 'collection';
create unique index if not exists reminder_log_weekly_uq
  on public.reminder_log (organization_id, period, recipient) where kind = 'weekly';

alter table public.reminder_log enable row level security;
drop policy if exists reminder_log_sel on public.reminder_log;
create policy reminder_log_sel on public.reminder_log
  for select using (organization_id = public.active_org());
-- Sin políticas de escritura: solo el rol de servicio (cron) inserta.

-- 3) Correos de los dueños por negocio, para el resumen semanal.
--    SOLO el rol de servicio puede llamarla (expone correos de auth.users).
create or replace function public.org_owner_emails()
returns table (organization_id uuid, email text)
language sql stable security definer set search_path = public as $$
  select m.organization_id, u.email::text
  from public.memberships m
  join auth.users u on u.id = m.user_id
  where m.role = 'owner' and u.email is not null;
$$;
revoke execute on function public.org_owner_emails() from public;
revoke execute on function public.org_owner_emails() from anon;
revoke execute on function public.org_owner_emails() from authenticated;
grant execute on function public.org_owner_emails() to service_role;
