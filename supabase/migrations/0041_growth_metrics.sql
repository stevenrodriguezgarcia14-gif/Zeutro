-- =====================================================================
-- ZENTRO — Migración 0041 — Métricas de crecimiento (los 3 números)
--
-- La North Star de Zentro es el MOMENTO DE COBRO. Estas métricas miden
-- si el producto acerca a la gente a ese momento:
--   1. Activación: % de empresas que registraron su PRIMER cobro
--      (un pago de factura o una venta rápida).
--   2. Retención semana 2: % de empresas (con ≥14 días de vida) que
--      volvieron a usar Zentro entre su día 8 y su día 14. La actividad
--      se lee de audit_log (0029), que registra toda mutación de negocio.
--   3. PWA: cuántos usuarios instalaron Zentro en su pantalla de inicio
--      y cuántos lo abrieron instalado en los últimos 7 días.
--
-- Para PWA hace falta un evento del cliente → tabla product_events
-- (mínima, deduplicada por usuario/evento/día, RLS de solo-insertar-propio).
--
-- Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Eventos de producto (hoy: solo PWA; extensible)
-- ---------------------------------------------------------------------
create table if not exists public.product_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  kind            text not null check (kind in ('pwa_installed', 'pwa_standalone')),
  day             date not null default current_date,
  created_at      timestamptz not null default now(),
  unique (user_id, kind, day)
);

alter table public.product_events enable row level security;

-- Cada quien inserta solo sus propios eventos; nadie los edita ni borra.
drop policy if exists product_events_ins on public.product_events;
create policy product_events_ins on public.product_events for insert
  with check (user_id = auth.uid());

drop policy if exists product_events_sel on public.product_events;
create policy product_events_sel on public.product_events for select
  using (user_id = auth.uid());

create index if not exists idx_product_events_kind_day on public.product_events(kind, day desc);

-- ---------------------------------------------------------------------
-- 2) Métricas para el panel admin
-- ---------------------------------------------------------------------
create or replace function public.admin_growth_metrics()
returns json language plpgsql stable security definer set search_path = public as $$
declare
  v_orgs_total      bigint;
  v_orgs_activated  bigint;
  v_ret_base        bigint;
  v_ret_kept        bigint;
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;

  select count(*) into v_orgs_total from public.organizations;

  -- Activación: la empresa vivió su primer momento de cobro.
  select count(*) into v_orgs_activated
    from public.organizations o
   where exists (select 1 from public.payments p where p.organization_id = o.id)
      or exists (select 1 from public.quick_sales q where q.organization_id = o.id);

  -- Retención semana 2: empresas con ≥14 días de vida que registraron
  -- actividad de negocio (audit_log) entre su día 8 y su día 14.
  select count(*) into v_ret_base
    from public.organizations o
   where o.created_at <= now() - interval '14 days';

  select count(*) into v_ret_kept
    from public.organizations o
   where o.created_at <= now() - interval '14 days'
     and exists (
       select 1 from public.audit_log al
        where al.organization_id = o.id
          and al.created_at >= o.created_at + interval '7 days'
          and al.created_at <  o.created_at + interval '14 days'
     );

  return json_build_object(
    'orgs_total',       v_orgs_total,
    'orgs_activated',   v_orgs_activated,
    'activation_pct',   case when v_orgs_total > 0
                             then round(v_orgs_activated * 100.0 / v_orgs_total)
                             else null end,
    'retention_base',   v_ret_base,
    'retention_kept',   v_ret_kept,
    'retention_pct',    case when v_ret_base > 0
                             then round(v_ret_kept * 100.0 / v_ret_base)
                             else null end,
    'pwa_installed',    (select count(distinct user_id) from public.product_events where kind = 'pwa_installed'),
    'pwa_active_7d',    (select count(distinct user_id) from public.product_events
                          where kind = 'pwa_standalone' and day >= current_date - 7)
  );
end;
$$;

revoke all on function public.admin_growth_metrics() from public;
grant execute on function public.admin_growth_metrics() to authenticated;

-- =====================================================================
-- FIN migración 0041
-- =====================================================================
