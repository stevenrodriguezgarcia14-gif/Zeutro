-- =====================================================================
-- ZENTRO — Migración 0029 — Endurecimiento de seguridad (auditoría final 2026-06-18)
-- Corrige los hallazgos de Security-Audit-Report.md:
--   A-2  organizations: UPDATE solo admin, DELETE solo owner, plan/status inmutables.
--   A-1  Separación de funciones: DELETE financiero solo owner/admin/finance.
--   M-1  Guardas de integridad en BD: saldo no-negativo, stock no-negativo (todo path).
--   M-2  Traza de auditoría append-only de mutaciones de datos de negocio.
--   M-3  Throttle de invitaciones por correo (anti-spam/bombing).
--   B-2  appointments: escritura solo para roles "escritor" (no viewer/contador).
-- Idempotente. SOLO endurece; los flujos legítimos del owner/admin siguen funcionando.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: ¿el usuario es "gestor" (owner/admin/finance) de la org?
-- ---------------------------------------------------------------------
create or replace function public.is_org_manager(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_org and user_id = auth.uid()
      and role in ('owner','admin','finance')
  );
$$;
grant execute on function public.is_org_manager(uuid) to authenticated;

-- =====================================================================
-- A-2 — ORGANIZATIONS: control de acceso por rol + columnas protegidas
-- =====================================================================
-- UPDATE solo para admin/owner (antes: cualquier miembro, incluso viewer).
drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations for update
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

-- DELETE solo para el owner (antes: cualquier miembro podía borrar la empresa).
drop policy if exists org_delete on public.organizations;
create policy org_delete on public.organizations for delete
  using (exists (
    select 1 from public.memberships m
    where m.organization_id = organizations.id and m.user_id = auth.uid() and m.role = 'owner'
  ));

-- 'plan' y 'status' solo los puede cambiar el administrador de plataforma.
-- Evita el bypass de cobro (auto-asignarse plan) y la auto-reactivación.
-- Las funciones admin_* son SECURITY DEFINER y is_platform_admin() es true ahí,
-- así que el panel de administración sigue pudiendo cambiarlos.
create or replace function public.guard_org_protected_cols()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.plan is distinct from old.plan or new.status is distinct from old.status)
     and not public.is_platform_admin() then
    new.plan := old.plan;
    new.status := old.status;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_org_protect on public.organizations;
create trigger trg_org_protect before update on public.organizations
  for each row execute function public.guard_org_protected_cols();

-- =====================================================================
-- A-1 — Separación de funciones: DELETE de datos financieros solo gestores
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'invoices','payments','payment_allocations','account_transactions',
    'accounts','expenses','quick_sales'
  ] loop
    execute format('drop policy if exists %1$s_del on public.%1$s;', t);
    execute format($f$create policy %1$s_del on public.%1$s for delete
        using (organization_id in (select public.current_user_orgs())
               and public.is_org_manager(organization_id));$f$, t);
  end loop;
end $$;

-- =====================================================================
-- M-1 — Guardas de integridad financiera a nivel de BD (cualquier path)
-- =====================================================================
-- Saldo no-negativo salvo tarjeta de crédito (también ante escritura directa).
create or replace function public.guard_account_balance()
returns trigger language plpgsql as $$
begin
  if new.current_balance_minor < 0 and new.type <> 'credit_card' then
    raise exception 'El saldo de "%" no puede quedar negativo', new.name;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_accounts_balance_guard on public.accounts;
create trigger trg_accounts_balance_guard before insert or update on public.accounts
  for each row execute function public.guard_account_balance();

-- Stock no-negativo en productos con inventario (también ante escritura directa).
create or replace function public.guard_stock()
returns trigger language plpgsql as $$
begin
  if new.track_inventory and new.stock_qty < 0 then
    raise exception 'El stock de "%" no puede quedar negativo', new.name;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_products_stock_guard on public.products;
create trigger trg_products_stock_guard before insert or update on public.products
  for each row execute function public.guard_stock();

-- =====================================================================
-- M-2 — Traza de auditoría append-only de mutaciones de datos de negocio
-- =====================================================================
create table if not exists public.audit_log (
  id              bigint generated always as identity primary key,
  organization_id uuid,
  actor           uuid,
  table_name      text not null,
  op              text not null,        -- INSERT | UPDATE | DELETE
  row_id          uuid,
  changed         jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_audit_org on public.audit_log(organization_id, created_at desc);

alter table public.audit_log enable row level security;
-- Lectura: miembros ven la auditoría de su organización. Escritura: solo el
-- trigger SECURITY DEFINER (no hay política INSERT/UPDATE/DELETE -> nadie la altera).
drop policy if exists audit_sel on public.audit_log;
create policy audit_sel on public.audit_log for select
  using (organization_id in (select public.current_user_orgs()));

create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_org uuid;
  v_id  uuid;
  v_changed jsonb;
begin
  if tg_op = 'DELETE' then
    v_org := (to_jsonb(old)->>'organization_id')::uuid;
    v_id  := (to_jsonb(old)->>'id')::uuid;
    v_changed := to_jsonb(old);
  elsif tg_op = 'UPDATE' then
    v_org := (to_jsonb(new)->>'organization_id')::uuid;
    v_id  := (to_jsonb(new)->>'id')::uuid;
    v_changed := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
  else
    v_org := (to_jsonb(new)->>'organization_id')::uuid;
    v_id  := (to_jsonb(new)->>'id')::uuid;
    v_changed := to_jsonb(new);
  end if;

  insert into public.audit_log(organization_id, actor, table_name, op, row_id, changed)
  values (v_org, auth.uid(), tg_table_name, tg_op, v_id, v_changed);
  return null;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'invoices','payments','account_transactions','accounts','expenses',
    'quick_sales','customers','products','memberships'
  ] loop
    execute format('drop trigger if exists trg_audit_%1$s on public.%1$s;', t);
    execute format('create trigger trg_audit_%1$s after insert or update or delete on public.%1$s
        for each row execute function public.audit_row();', t);
  end loop;
end $$;

-- =====================================================================
-- M-3 — Throttle de invitaciones (anti-spam / email bombing)
-- =====================================================================
create or replace function public.guard_invitation_rate()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  select count(*) into v_count from public.invitations
   where created_by = auth.uid() and created_at > now() - interval '1 hour';
  if v_count >= 30 then
    raise exception 'Límite de invitaciones por hora alcanzado. Intenta más tarde.';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_invitations_rate on public.invitations;
create trigger trg_invitations_rate before insert on public.invitations
  for each row execute function public.guard_invitation_rate();

-- =====================================================================
-- B-2 — appointments: escritura solo para roles "escritor"
-- =====================================================================
drop policy if exists appointments_ins on public.appointments;
create policy appointments_ins on public.appointments for insert
  with check (organization_id in (select public.current_user_orgs())
              and public.is_writer_in(organization_id));
drop policy if exists appointments_upd on public.appointments;
create policy appointments_upd on public.appointments for update
  using (organization_id in (select public.current_user_orgs())
         and public.is_writer_in(organization_id))
  with check (organization_id in (select public.current_user_orgs())
              and public.is_writer_in(organization_id));
drop policy if exists appointments_del on public.appointments;
create policy appointments_del on public.appointments for delete
  using (organization_id in (select public.current_user_orgs())
         and public.is_writer_in(organization_id));

-- =====================================================================
-- FIN migración 0029
-- =====================================================================
