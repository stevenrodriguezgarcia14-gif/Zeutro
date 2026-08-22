-- =====================================================================
-- ZENTRO — Migración 0047 — Importar comprobantes electrónicos como gasto
--
-- Motivo: en Costa Rica el proveedor está OBLIGADO a enviarle al comprador
-- el XML del comprobante por correo. Ese archivo ya es del usuario: leerlo
-- no requiere credenciales, llave criptográfica ni permiso de Hacienda.
-- Zentro lo lee para llenar el gasto solo, en vez de que alguien teclee
-- proveedor, fecha, monto e IVA de cada factura de ferretería.
--
-- Esto NO conecta con Hacienda y no pretende hacerlo: emitir comprobantes y
-- mandar el mensaje de aceptación sí exigen llave y credenciales, y eso
-- sigue fuera del alcance de Zentro.
--
-- Qué agrega:
--   1. expenses.einvoice_key    → la clave de 50 dígitos del comprobante.
--   2. expenses.einvoice_number → el consecutivo, para mostrarlo.
--   3. Índice ÚNICO por empresa sobre la clave: el mismo comprobante no se
--      puede registrar dos veces. Sin esto, arrastrar el mismo XML dos
--      veces duplicaría el gasto y falsearía la rentabilidad del trabajo —
--      justo lo que este módulo existe para evitar.
--
-- Seguridad: no se tocan políticas RLS (expenses ya está cubierta por 0044)
-- ni las guardas financieras de 0040. Las columnas nuevas no son dinero.
--
-- Idempotente.
-- =====================================================================

alter table public.expenses
  add column if not exists einvoice_key    text,
  add column if not exists einvoice_number text;

-- Único POR EMPRESA y solo cuando hay clave: dos negocios distintos pueden
-- recibir comprobantes distintos, y los gastos tecleados a mano (sin XML)
-- no deben chocar entre sí.
create unique index if not exists uq_expenses_einvoice_key
  on public.expenses(organization_id, einvoice_key)
  where einvoice_key is not null;

comment on column public.expenses.einvoice_key is
  'Clave de 50 dígitos del comprobante electrónico de Hacienda del que se importó este gasto. Única por empresa: evita registrar dos veces la misma factura de proveedor.';

-- ---------------------------------------------------------------------
-- create_expense acepta los datos del comprobante.
--
-- Se extiende la función en vez de hacer INSERT + UPDATE desde la app: así
-- el gasto nace ya con su clave y el índice único hace su trabajo dentro de
-- la misma transacción. Con dos pasos, un choque dejaría un gasto huérfano
-- sin clave — o sea, el duplicado que queríamos evitar.
--
-- Los dos parámetros nuevos van con DEFAULT NULL, así que las llamadas
-- existentes (11 argumentos con nombre) siguen funcionando igual.
-- ---------------------------------------------------------------------
drop function if exists public.create_expense(uuid, text, bigint, text, text, bigint, date, text, uuid, boolean, uuid);

create or replace function public.create_expense(
  p_org             uuid,
  p_description     text,
  p_amount_minor    bigint,
  p_category        text default null,
  p_vendor          text default null,
  p_tax_minor       bigint default 0,
  p_expense_date    date default current_date,
  p_payment_status  text default 'paid',
  p_account_id      uuid default null,
  p_is_deductible   boolean default false,
  p_project_id      uuid default null,
  p_einvoice_key    text default null,
  p_einvoice_number text default null
)
returns public.expenses
language plpgsql
as $$
declare
  v_exp public.expenses;
begin
  if p_amount_minor <= 0 then raise exception 'El monto debe ser mayor a 0'; end if;
  if p_org not in (select public.current_user_orgs()) then
    raise exception 'Organización sin acceso';
  end if;

  -- Mensaje entendible antes de que salte el índice único con su jerga.
  if p_einvoice_key is not null and exists (
    select 1 from public.expenses
     where organization_id = p_org and einvoice_key = p_einvoice_key
  ) then
    raise exception 'Ese comprobante ya está registrado como gasto';
  end if;

  insert into public.expenses(
    organization_id, description, category, vendor, amount_minor, tax_minor,
    currency, expense_date, payment_status, account_id, is_deductible, project_id,
    einvoice_key, einvoice_number, created_by
  ) values (
    p_org, p_description, p_category, p_vendor, p_amount_minor, coalesce(p_tax_minor,0),
    (select base_currency from public.organizations where id = p_org),
    coalesce(p_expense_date, current_date), p_payment_status, p_account_id, p_is_deductible, p_project_id,
    p_einvoice_key, p_einvoice_number, auth.uid()
  ) returning * into v_exp;

  if p_payment_status = 'paid' and p_account_id is not null then
    perform public.record_account_movement(
      p_account_id, 'out', p_amount_minor, coalesce(p_expense_date, current_date),
      'Gasto: ' || p_description);
  end if;

  return v_exp;
end;
$$;

revoke all on function public.create_expense(uuid, text, bigint, text, text, bigint, date, text, uuid, boolean, uuid, text, text) from public;
grant execute on function public.create_expense(uuid, text, bigint, text, text, bigint, date, text, uuid, boolean, uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Comprobación: si la columna o el índice no quedaron, la migración falla
-- en vez de dejar la app pidiendo algo que no existe.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='expenses'
                    and column_name='einvoice_key') then
    raise exception 'Falta expenses.einvoice_key';
  end if;
  if not exists (select 1 from pg_indexes
                  where schemaname='public' and indexname='uq_expenses_einvoice_key') then
    raise exception 'Falta el índice único uq_expenses_einvoice_key';
  end if;
  -- La app llama create_expense con 13 argumentos con nombre.
  if not exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'create_expense'
       and p.pronargs = 13
  ) then
    raise exception 'create_expense no quedó con los 13 parámetros esperados';
  end if;
end $$;

-- =====================================================================
-- FIN migración 0047
-- =====================================================================
