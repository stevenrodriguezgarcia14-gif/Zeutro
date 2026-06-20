-- =====================================================================
-- ZENTRO — Migración 0031
-- IVA configurable POR NEGOCIO en ventas rápidas (auditoría C2/C4).
--   - quick_sales.tax_rate_bps: IVA (en bps) incluido en el monto de cada
--     venta rápida. 0 = sin IVA (default → no cambia nada para quien vende de
--     contado sin IVA). El monto se sigue guardando IVA-incluido (lo recibido).
--   - organizations.quick_sale_tax_bps: tasa por defecto del negocio para
--     pre-llenar el formulario. La fija el dueño en Configuración.
-- El ingreso (Dashboard/Rentabilidad) se netea con netOfTaxInclusive, igual
-- que las facturas, para que dejen de divergir.
-- =====================================================================

alter table public.quick_sales    add column if not exists tax_rate_bps       bigint not null default 0;
alter table public.organizations  add column if not exists quick_sale_tax_bps bigint not null default 0;

-- create_quick_sale + p_tax_rate_bps (se elimina la firma anterior para no dejar
-- dos sobrecargas que confundan a PostgREST).
drop function if exists public.create_quick_sale(uuid, bigint, text, text, uuid, date, uuid, numeric);

create or replace function public.create_quick_sale(
  p_org          uuid,
  p_amount_minor bigint,
  p_description  text default null,
  p_method       text default 'cash',
  p_account_id   uuid default null,
  p_sold_at      date default current_date,
  p_product_id   uuid default null,
  p_qty          numeric default null,
  p_tax_rate_bps bigint default 0
)
returns public.quick_sales
language plpgsql
as $$
declare
  v_qs public.quick_sales;
begin
  if p_amount_minor <= 0 then raise exception 'El monto debe ser mayor a 0'; end if;
  if p_org not in (select public.current_user_orgs()) then
    raise exception 'Organización sin acceso';
  end if;

  insert into public.quick_sales(
    organization_id, description, amount_minor, tax_rate_bps,
    currency, method, account_id, sold_at, created_by, product_id, qty
  ) values (
    p_org, p_description, p_amount_minor, greatest(0, coalesce(p_tax_rate_bps, 0)),
    (select base_currency from public.organizations where id = p_org),
    p_method, p_account_id, coalesce(p_sold_at, current_date), auth.uid(),
    p_product_id, p_qty
  ) returning * into v_qs;

  -- La cuenta recibe el monto COMPLETO (lo realmente cobrado, IVA incluido).
  if p_account_id is not null then
    perform public.record_account_movement(
      p_account_id, 'in', p_amount_minor, coalesce(p_sold_at, current_date),
      coalesce(p_description, 'Venta rápida'));
  end if;

  if p_product_id is not null and coalesce(p_qty, 0) > 0 then
    perform public.adjust_stock(p_product_id, 'out', p_qty, 'sale', 'Venta rápida');
  end if;

  return v_qs;
end;
$$;

revoke all on function public.create_quick_sale(uuid, bigint, text, text, uuid, date, uuid, numeric, bigint) from public;
grant execute on function public.create_quick_sale(uuid, bigint, text, text, uuid, date, uuid, numeric, bigint) to authenticated;
