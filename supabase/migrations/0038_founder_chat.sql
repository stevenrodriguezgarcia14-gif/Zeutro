-- =====================================================================
-- ZENTRO — Migración 0038 — Chat con el fundador + nuevos correos automáticos
-- 1) Tabla support_messages: conversación en vivo entre cada negocio y el
--    fundador (widget in-app + panel /admin/support).
-- 2) reminder_log acepta dos kinds nuevos: 'upcoming' (aviso "vence mañana",
--    prevención antes del atraso) y 'monthly' (resumen mensual al dueño).
-- =====================================================================

-- 1) Chat con el fundador -------------------------------------------------
create table if not exists public.support_messages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  sender          text not null check (sender in ('user','founder')),
  body            text not null check (length(btrim(body)) between 1 and 4000),
  created_at      timestamptz not null default now(),
  read_by_founder boolean not null default false,
  read_by_user    boolean not null default false
);
create index if not exists support_messages_org_idx
  on public.support_messages (organization_id, created_at);

alter table public.support_messages enable row level security;

-- El negocio ve su conversación; el fundador (platform admin) las ve todas.
drop policy if exists sm_sel on public.support_messages;
create policy sm_sel on public.support_messages
  for select using (organization_id = public.active_org() or public.is_platform_admin());

-- El usuario escribe como 'user' en su empresa activa; el fundador como 'founder'.
drop policy if exists sm_ins on public.support_messages;
create policy sm_ins on public.support_messages
  for insert with check (
    (sender = 'user' and organization_id = public.active_org() and user_id = auth.uid())
    or (sender = 'founder' and public.is_platform_admin())
  );

-- Sin política de UPDATE/DELETE: los mensajes son inmutables. Marcar como
-- leído pasa por esta RPC (así nadie puede editar el texto de la otra parte).
create or replace function public.mark_support_read(p_org uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.is_platform_admin() then
    update public.support_messages
      set read_by_founder = true
      where organization_id = p_org and sender = 'user' and not read_by_founder;
  end if;
  if p_org = public.active_org() then
    update public.support_messages
      set read_by_user = true
      where organization_id = p_org and sender = 'founder' and not read_by_user;
  end if;
end $$;
grant execute on function public.mark_support_read(uuid) to authenticated;

-- Bandeja del fundador: una fila por negocio con último mensaje, no leídos y
-- correo del dueño (para avisarle por email cuando el fundador responde).
create or replace function public.admin_support_overview()
returns table (
  organization_id uuid,
  org_name        text,
  owner_email     text,
  last_body       text,
  last_sender     text,
  last_at         timestamptz,
  unread          bigint
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;
  return query
    select
      o.id,
      o.name::text,
      (select u.email::text from public.memberships m join auth.users u on u.id = m.user_id
        where m.organization_id = o.id and m.role = 'owner' limit 1),
      lm.body,
      lm.sender,
      lm.created_at,
      (select count(*) from public.support_messages s
        where s.organization_id = o.id and s.sender = 'user' and not s.read_by_founder)
    from public.organizations o
    join lateral (
      select s.body, s.sender, s.created_at
      from public.support_messages s
      where s.organization_id = o.id
      order by s.created_at desc limit 1
    ) lm on true
    order by lm.created_at desc;
end $$;
revoke execute on function public.admin_support_overview() from public;
revoke execute on function public.admin_support_overview() from anon;
grant execute on function public.admin_support_overview() to authenticated;

-- 2) Nuevos correos automáticos en reminder_log ---------------------------
alter table public.reminder_log drop constraint if exists reminder_log_kind_check;
alter table public.reminder_log
  add constraint reminder_log_kind_check
  check (kind in ('collection','weekly','upcoming','monthly'));

-- 'upcoming': 1 aviso por factura y fecha de vencimiento (si la fecha cambia,
-- puede avisarse de nuevo). period = due_date (YYYY-MM-DD).
create unique index if not exists reminder_log_upcoming_uq
  on public.reminder_log (invoice_id, period) where kind = 'upcoming';

-- 'monthly': 1 resumen por negocio/mes/destinatario. period = YYYY-MM.
create unique index if not exists reminder_log_monthly_uq
  on public.reminder_log (organization_id, period, recipient) where kind = 'monthly';
