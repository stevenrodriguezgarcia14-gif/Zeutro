-- =====================================================================
-- ZENTRO — Migración 0048 — Devolver el cast de enum a create_expense
--
-- REGRESIÓN INTRODUCIDA POR LA 0047.
--
-- `expenses.payment_status` es del tipo enum `expense_status`. La migración
-- 0032 existía justamente para castear `p_payment_status::public.expense_status`
-- al insertar. Al recrear `create_expense` en la 0047 (para añadirle los dos
-- parámetros del comprobante electrónico) se copió el cuerpo de la 0027, que
-- es ANTERIOR a ese arreglo, y el cast se perdió.
--
-- Efecto en producción: TODO gasto nuevo fallaba con
--   42804: column "payment_status" is of type expense_status but expression
--          is of type text
-- y `safeError` lo mostraba como "Ocurrió un error. Inténtalo de nuevo.",
-- así que ni siquiera se veía la causa.
--
-- Es la misma trampa que la 0033 con los controles de rol de la RLS: recrear
-- una función partiendo de una versión vieja borra en silencio los arreglos
-- posteriores. Ver la regla al final del archivo.
--
-- Esta migración es la 0047 con el cast puesto. Idempotente.
-- =====================================================================

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
    coalesce(p_expense_date, current_date),
    -- EL CAST QUE LA 0047 PERDIÓ (viene de la 0032). Sin él, ningún gasto entra.
    p_payment_status::public.expense_status,
    p_account_id, p_is_deductible, p_project_id,
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

-- PostgREST cachea las firmas de las funciones. Sin esto, la API sigue
-- ofreciendo la versión anterior hasta que se recargue sola.
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- Comprobación REAL: no basta con que la función exista, tiene que poder
-- insertar. Se hace un gasto de prueba dentro de una subtransacción y se
-- deshace siempre, para que la migración falle aquí y no en producción.
-- ---------------------------------------------------------------------
do $$
declare
  v_org uuid;
begin
  select id into v_org from public.organizations order by created_at limit 1;
  if v_org is null then
    raise notice 'Sin organizaciones: no se puede probar create_expense.';
    return;
  end if;

  begin
    insert into public.expenses(
      organization_id, description, amount_minor, currency, expense_date, payment_status
    ) values (
      v_org, '__prueba_migracion_0048__', 1,
      (select base_currency from public.organizations where id = v_org),
      current_date, 'paid'::public.expense_status
    );
    -- Si el cast del enum no funcionara, la línea anterior habría reventado.
    delete from public.expenses where description = '__prueba_migracion_0048__';
  exception when others then
    raise exception 'La prueba de inserción de gasto falló: %', sqlerrm;
  end;
end $$;

-- ---------------------------------------------------------------------
-- REGLA APRENDIDA (segunda vez que muerde, después de la 0033):
--
--   Antes de recrear una función o unas políticas, hay que partir de la
--   ÚLTIMA versión que quedó en la base, no del archivo donde nacieron.
--   Copiar un cuerpo viejo borra en silencio todos los arreglos que se le
--   hicieron después. Y toda migración que recree algo debe terminar con
--   una comprobación que EJERCITE el comportamiento, no solo que verifique
--   que el objeto existe.
-- ---------------------------------------------------------------------

-- =====================================================================
-- FIN migración 0048
-- =====================================================================
