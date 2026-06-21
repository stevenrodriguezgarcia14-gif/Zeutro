-- =====================================================================
-- ZENTRO — Migración 0033
-- Aislamiento por EMPRESA ACTIVA (multi-tenant scoping) — arreglo de raíz.
-- Antes: las pantallas confiaban en RLS, que permite ver TODAS las empresas
-- del usuario → con 2+ empresas los datos se mezclaban (clientes, dashboard…).
-- Ahora: la base de datos conoce la empresa activa y la RLS la impone, así
-- ninguna pantalla (ni futura) puede mezclar empresas.
-- =====================================================================

-- 1) Empresa activa por usuario (fuente de verdad persistente, no una cookie)
create table if not exists public.user_active_org (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  updated_at      timestamptz not null default now()
);
alter table public.user_active_org enable row level security;
drop policy if exists uao_sel on public.user_active_org;
create policy uao_sel on public.user_active_org for select using (user_id = auth.uid());
drop policy if exists uao_ins on public.user_active_org;
create policy uao_ins on public.user_active_org for insert
  with check (user_id = auth.uid() and organization_id in (select public.current_user_orgs()));
drop policy if exists uao_upd on public.user_active_org;
create policy uao_upd on public.user_active_org for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and organization_id in (select public.current_user_orgs()));

-- 2) Empresa activa del usuario. Fallback robusto: si no eligió una, usa su
--    empresa más reciente. Nunca devuelve null si el usuario tiene ≥1 empresa,
--    así jamás queda sin acceso a sus datos.
create or replace function public.active_org()
returns uuid
language sql
stable
security invoker
as $$
  select coalesce(
    (select uao.organization_id
       from public.user_active_org uao
      where uao.user_id = auth.uid()
        and exists (select 1 from public.memberships m
                     where m.user_id = auth.uid() and m.organization_id = uao.organization_id)),
    (select m.organization_id from public.memberships m
      where m.user_id = auth.uid()
      order by m.created_at desc
      limit 1)
  );
$$;
grant execute on function public.active_org() to authenticated;

-- 3) Cambiar de empresa (valida pertenencia). La app llama a esta función.
create or replace function public.set_active_org(p_org uuid)
returns void
language plpgsql
security definer
set search_path to public
as $$
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if p_org not in (select public.current_user_orgs()) then
    raise exception 'Empresa sin acceso';
  end if;
  insert into public.user_active_org(user_id, organization_id, updated_at)
  values (auth.uid(), p_org, now())
  on conflict (user_id) do update
    set organization_id = excluded.organization_id, updated_at = now();
end;
$$;
grant execute on function public.set_active_org(uuid) to authenticated;

-- 4) Al crear una empresa, queda como la activa.
create or replace function public.create_organization(
  p_name text, p_country text default 'MX', p_currency text default 'MXN', p_business_type text default null
)
returns public.organizations
language plpgsql
security definer
set search_path to public
as $$
declare
  v_uid uuid := auth.uid();
  v_org public.organizations;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'El nombre del negocio es obligatorio'; end if;

  insert into public.organizations (name, country, base_currency, business_type, created_by)
  values (btrim(p_name), p_country, p_currency, p_business_type, v_uid)
  returning * into v_org;

  insert into public.memberships (organization_id, user_id, role)
  values (v_org.id, v_uid, 'owner');

  insert into public.user_active_org(user_id, organization_id, updated_at)
  values (v_uid, v_org.id, now())
  on conflict (user_id) do update
    set organization_id = excluded.organization_id, updated_at = now();

  return v_org;
end;
$$;

-- 5) Reescribir las políticas de las 27 tablas de negocio: scope = empresa
--    activa. TODO en un único bloque DO → atómico: si algo falla, no queda
--    ninguna tabla con la política borrada (sin riesgo de bloqueo).
do $$
declare t text;
begin
  foreach t in array array[
    'customers','products','accounts','invoices','invoice_items','payments',
    'payment_allocations','account_transactions','tax_rates','quick_sales','expenses',
    'quotations','quotation_items','opportunities','pipelines','stages','tasks',
    'projects','appointments','purchases','purchase_items','purchase_expenses',
    'documents','inventory_movements','cost_sheets','cost_components','interactions'
  ] loop
    execute format('drop policy if exists %I on public.%I;', t || '_sel', t);
    execute format('drop policy if exists %I on public.%I;', t || '_ins', t);
    execute format('drop policy if exists %I on public.%I;', t || '_upd', t);
    execute format('drop policy if exists %I on public.%I;', t || '_del', t);
    execute format('create policy %I on public.%I for select using (organization_id = public.active_org());', t || '_sel', t);
    execute format('create policy %I on public.%I for insert with check (organization_id = public.active_org());', t || '_ins', t);
    execute format('create policy %I on public.%I for update using (organization_id = public.active_org()) with check (organization_id = public.active_org());', t || '_upd', t);
    execute format('create policy %I on public.%I for delete using (organization_id = public.active_org());', t || '_del', t);
  end loop;
end $$;
