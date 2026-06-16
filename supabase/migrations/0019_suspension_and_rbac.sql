-- =====================================================================
-- ZENTRO — Migración 0019 — M2 (suspensión en RLS) + M3 (RBAC básico)
--
-- M2: current_user_orgs() ahora EXCLUYE organizaciones suspendidas. Como
--     esa función es la base de todas las políticas RLS de negocio, un
--     negocio suspendido queda bloqueado (lectura y escritura) también a
--     nivel base de datos, no solo en la pantalla. La app sigue detectando
--     la suspensión vía my_organizations() (SECURITY DEFINER, ve la org).
--
-- M3: is_writer_in(org) -> false para roles 'viewer' y 'external_accountant'.
--     Las políticas INSERT/UPDATE/DELETE de las tablas de negocio exigen
--     ser "escritor", así que esos roles quedan en solo-lectura.
-- =====================================================================

-- ---- M2: orgs activas del usuario (excluye suspendidas) ----
create or replace function public.current_user_orgs()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.organization_id
  from public.memberships m
  join public.organizations o on o.id = m.organization_id
  where m.user_id = auth.uid() and o.status is distinct from 'suspended';
$$;

-- ---- M3: ¿el usuario puede escribir en esta org? ----
create or replace function public.is_writer_in(p_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_org and user_id = auth.uid()
      and role not in ('viewer','external_accountant')
  );
$$;
grant execute on function public.is_writer_in(uuid) to authenticated;

-- ---- App: leer las organizaciones del usuario SIN pasar por RLS ----
-- (necesario para que la app vea una org suspendida y muestre su pantalla)
create or replace function public.my_organizations()
returns table (id uuid, name text, country text, base_currency text,
               timezone text, locale text, legal_name text, tax_id text, status text)
language sql stable security definer set search_path = public as $$
  select o.id, o.name, o.country::text, o.base_currency::text, o.timezone,
         o.locale, o.legal_name, o.tax_id, o.status::text
  from public.organizations o
  join public.memberships m on m.organization_id = o.id
  where m.user_id = auth.uid()
  order by m.created_at;
$$;
grant execute on function public.my_organizations() to authenticated;

-- ---- Regenerar políticas de las tablas de negocio ----
do $$
declare
  tbls text[] := array[
    'tax_rates','customers','products','accounts','invoices','invoice_items',
    'payments','payment_allocations','account_transactions','expenses',
    'interactions','cost_sheets','cost_components','opportunities','pipelines',
    'stages','quotations','quotation_items','purchases','purchase_items',
    'purchase_expenses','projects','tasks','documents','inventory_movements'
  ];
  t text;
  r record;
begin
  foreach t in array tbls loop
    -- borrar políticas existentes de la tabla
    for r in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I;', r.policyname, t);
    end loop;

    execute format('alter table public.%I enable row level security;', t);

    -- SELECT: miembros de una org activa
    execute format($f$create policy %1$s_sel on public.%1$s for select
        using (organization_id in (select public.current_user_orgs()));$f$, t);

    -- INSERT/UPDATE/DELETE: además, no ser solo-lectura
    execute format($f$create policy %1$s_ins on public.%1$s for insert
        with check (organization_id in (select public.current_user_orgs())
                    and public.is_writer_in(organization_id));$f$, t);

    execute format($f$create policy %1$s_upd on public.%1$s for update
        using (organization_id in (select public.current_user_orgs())
               and public.is_writer_in(organization_id))
        with check (organization_id in (select public.current_user_orgs())
                    and public.is_writer_in(organization_id));$f$, t);

    execute format($f$create policy %1$s_del on public.%1$s for delete
        using (organization_id in (select public.current_user_orgs())
               and public.is_writer_in(organization_id));$f$, t);
  end loop;
end $$;
