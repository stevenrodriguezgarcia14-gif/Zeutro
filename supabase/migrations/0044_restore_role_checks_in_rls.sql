-- =====================================================================
-- ZENTRO — Migración 0044 — Restaurar el control de ROLES en la RLS
--
-- REGRESIÓN DE SEGURIDAD detectada el 2026-08-21.
--
-- La migración 0019 dejó las políticas de las tablas de negocio así:
--     INSERT/UPDATE/DELETE  →  pertenece a la org  AND  is_writer_in(org)
-- y la 0029 endureció el DELETE financiero con is_org_manager(org).
--
-- La migración 0033 (aislamiento por empresa activa) las reescribió TODAS
-- para usar `organization_id = active_org()`. El aislamiento por empresa
-- quedó bien, pero en el camino se perdieron tres controles:
--
--   1. M3 — is_writer_in: los roles 'viewer' y 'external_accountant'
--      volvieron a poder INSERTAR, MODIFICAR y BORRAR. Un contador externo
--      invitado en modo lectura podía escribir en el libro.
--   2. A-1 — is_org_manager: cualquier miembro podía BORRAR facturas,
--      pagos, gastos y movimientos de cuenta, no solo owner/admin/finance.
--   3. M2 — suspensión: active_org() no excluye organizaciones suspendidas,
--      así que la suspensión dejó de aplicarse en la base de datos.
--
-- Hoy no es explotable porque las 11 membresías existentes son 'owner',
-- pero se vuelve explotable en cuanto se invite al primer empleado o
-- contador — que es justo el gancho del plan Pro.
--
-- Esta migración conserva el aislamiento por empresa activa de 0033 y le
-- vuelve a sumar los tres controles. Todo en bloques DO atómicos: si algo
-- falla, ninguna tabla se queda sin política.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) M2 — active_org() vuelve a respetar la suspensión.
--
-- Si la empresa activa está suspendida, se busca otra empresa activa del
-- usuario; si no tiene ninguna, devuelve NULL y la RLS bloquea todo. La
-- app sigue viendo la empresa suspendida vía my_organizations()
-- (SECURITY DEFINER) para poder mostrar la pantalla de suspensión.
--
-- Se añade `set search_path` (convención del proyecto para funciones
-- usadas dentro de políticas).
-- ---------------------------------------------------------------------
create or replace function public.active_org()
returns uuid
language sql
stable
security invoker
set search_path to public
as $$
  select coalesce(
    -- La elegida explícitamente, si sigue siendo suya y no está suspendida.
    (select uao.organization_id
       from public.user_active_org uao
       join public.memberships m
         on m.user_id = auth.uid() and m.organization_id = uao.organization_id
       join public.organizations o
         on o.id = uao.organization_id and o.status is distinct from 'suspended'
      where uao.user_id = auth.uid()),
    -- Si no, la más reciente que no esté suspendida.
    (select m.organization_id
       from public.memberships m
       join public.organizations o
         on o.id = m.organization_id and o.status is distinct from 'suspended'
      where m.user_id = auth.uid()
      order by m.created_at desc
      limit 1)
  );
$$;
grant execute on function public.active_org() to authenticated;

-- ---------------------------------------------------------------------
-- 2) M3 — escribir exige ser escritor; borrar dinero exige ser gestor.
--
-- Las 27 tablas de negocio de 0033, con el mismo scope de empresa activa
-- y los controles de rol de vuelta. Las 7 tablas del libro financiero
-- llevan además is_org_manager en el DELETE (separación de funciones).
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  financieras text[] := array[
    'invoices','payments','payment_allocations','account_transactions',
    'accounts','expenses','quick_sales'
  ];
  negocio text[] := array[
    'customers','products','accounts','invoices','invoice_items','payments',
    'payment_allocations','account_transactions','tax_rates','quick_sales','expenses',
    'quotations','quotation_items','opportunities','pipelines','stages','tasks',
    'projects','appointments','purchases','purchase_items','purchase_expenses',
    'documents','inventory_movements','cost_sheets','cost_components','interactions'
  ];
begin
  foreach t in array negocio loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists %I on public.%I;', t || '_sel', t);
    execute format('drop policy if exists %I on public.%I;', t || '_ins', t);
    execute format('drop policy if exists %I on public.%I;', t || '_upd', t);
    execute format('drop policy if exists %I on public.%I;', t || '_del', t);

    -- LEER: cualquier miembro de la empresa activa.
    execute format(
      'create policy %I on public.%I for select using (organization_id = public.active_org());',
      t || '_sel', t);

    -- CREAR y MODIFICAR: además, no ser un rol de solo lectura.
    execute format(
      'create policy %I on public.%I for insert with check (organization_id = public.active_org() and public.is_writer_in(organization_id));',
      t || '_ins', t);
    execute format(
      'create policy %I on public.%I for update using (organization_id = public.active_org() and public.is_writer_in(organization_id)) with check (organization_id = public.active_org() and public.is_writer_in(organization_id));',
      t || '_upd', t);

    -- BORRAR: escritor; y si es una tabla del libro financiero, gestor.
    if t = any (financieras) then
      execute format(
        'create policy %I on public.%I for delete using (organization_id = public.active_org() and public.is_org_manager(organization_id));',
        t || '_del', t);
    else
      execute format(
        'create policy %I on public.%I for delete using (organization_id = public.active_org() and public.is_writer_in(organization_id));',
        t || '_del', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 3) Comprobación: ninguna tabla de negocio puede quedar sin control de
--    rol en sus políticas de escritura. Si algo salió mal, esta migración
--    falla en vez de dejar el agujero abierto en silencio.
-- ---------------------------------------------------------------------
do $$
declare faltantes text;
begin
  select string_agg(distinct tablename, ', ')
    into faltantes
    from pg_policies
   where schemaname = 'public'
     and cmd in ('INSERT','UPDATE','DELETE')
     and tablename in (
       'customers','products','accounts','invoices','invoice_items','payments',
       'payment_allocations','account_transactions','tax_rates','quick_sales','expenses',
       'quotations','quotation_items','opportunities','pipelines','stages','tasks',
       'projects','appointments','purchases','purchase_items','purchase_expenses',
       'documents','inventory_movements','cost_sheets','cost_components','interactions')
     and coalesce(with_check, '') || coalesce(qual, '') not like '%is_writer_in%'
     and coalesce(with_check, '') || coalesce(qual, '') not like '%is_org_manager%';

  if faltantes is not null then
    raise exception 'Quedaron tablas sin control de rol en escritura: %', faltantes;
  end if;
end $$;
