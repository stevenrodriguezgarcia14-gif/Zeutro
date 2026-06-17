-- =====================================================================
-- ZENTRO — Migración 0026 — Integridad financiera (auditoría de lanzamiento)
-- Objetivos:
--  RC-2  Borrar venta rápida / gasto revierte el saldo de la cuenta.
--  RC-3  Operaciones de dinero atómicas (insert + movimiento en 1 transacción).
--  RC-5  Folios de factura/cotización atómicos (sin count(*)+1).
--  PI-1  Venta rápida con producto descuenta inventario.
--  PI-6  Sin saldo negativo en cuentas no-crédito; sin stock negativo.
--  PI-9  Gasto pendiente -> pagado mueve la cuenta.
--  PI-3  Anular factura (void) restaura stock.
-- Todas SECURITY INVOKER: respetan RLS con el usuario actual.
-- Idempotente (create or replace / if not exists).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Guardas de saldo: no permitir negativo salvo tarjeta de crédito
-- ---------------------------------------------------------------------
create or replace function public.record_account_movement(
  p_account_id   uuid,
  p_direction    public.txn_direction,
  p_amount_minor bigint,
  p_date         date default current_date,
  p_description  text default null
)
returns public.accounts
language plpgsql
as $$
declare v_acc public.accounts;
declare v_new bigint;
begin
  select * into v_acc from public.accounts where id = p_account_id;
  if not found then raise exception 'Cuenta no encontrada o sin acceso'; end if;
  if p_amount_minor <= 0 then raise exception 'El monto debe ser mayor a 0'; end if;

  v_new := v_acc.current_balance_minor
           + (case when p_direction = 'in' then p_amount_minor else -p_amount_minor end);
  if v_new < 0 and v_acc.type <> 'credit_card' then
    raise exception 'Saldo insuficiente en "%": el movimiento dejaría la cuenta en negativo', v_acc.name;
  end if;

  insert into public.account_transactions(
    organization_id, account_id, direction, amount_minor, transaction_date, description, source_type
  ) values (
    v_acc.organization_id, p_account_id, p_direction, p_amount_minor, p_date, p_description, 'manual'
  );

  update public.accounts
     set current_balance_minor = v_new, updated_at = now()
   where id = p_account_id
  returning * into v_acc;

  return v_acc;
end;
$$;

-- ---------------------------------------------------------------------
-- 1) Folios atómicos por organización y tipo de documento
-- ---------------------------------------------------------------------
create table if not exists public.doc_counters (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  doc_type        text not null,                 -- 'invoice' | 'quotation'
  seq             bigint not null default 0,
  primary key (organization_id, doc_type)
);
alter table public.doc_counters enable row level security;
drop policy if exists doc_counters_all on public.doc_counters;
create policy doc_counters_all on public.doc_counters for all
  using (organization_id in (select public.current_user_orgs()))
  with check (organization_id in (select public.current_user_orgs()));

-- Devuelve el siguiente folio formateado (prefijo + número con ceros).
-- p_seed: valor mínimo inicial (p. ej. la cantidad de documentos ya existentes)
-- usado SOLO la primera vez que se crea el contador, para no chocar con folios viejos.
create or replace function public.next_doc_number(
  p_org    uuid,
  p_type   text,
  p_prefix text,
  p_seed   bigint default 0
)
returns text
language plpgsql
as $$
declare v_seq bigint;
begin
  if p_org not in (select public.current_user_orgs()) then
    raise exception 'Organización sin acceso';
  end if;

  insert into public.doc_counters(organization_id, doc_type, seq)
  values (p_org, p_type, greatest(p_seed, 0) + 1)
  on conflict (organization_id, doc_type)
  do update set seq = public.doc_counters.seq + 1
  returning seq into v_seq;

  return p_prefix || lpad(v_seq::text, 4, '0');
end;
$$;
revoke all on function public.next_doc_number(uuid, text, text, bigint) from public;
grant execute on function public.next_doc_number(uuid, text, text, bigint) to authenticated;

-- ---------------------------------------------------------------------
-- 2) adjust_stock con guarda de stock negativo
-- ---------------------------------------------------------------------
create or replace function public.adjust_stock(
  p_product_id uuid, p_direction public.txn_direction, p_qty numeric,
  p_reason public.inv_reason default 'adjustment', p_note text default null
)
returns public.products language plpgsql as $$
declare v_prod public.products;
declare v_new numeric;
begin
  select * into v_prod from public.products where id = p_product_id;
  if not found then raise exception 'Producto no encontrado'; end if;
  if p_qty <= 0 then raise exception 'La cantidad debe ser mayor a 0'; end if;

  v_new := coalesce(v_prod.stock_qty,0) + (case when p_direction='in' then p_qty else -p_qty end);
  if v_new < 0 then
    raise exception 'Stock insuficiente de "%": quedaría en negativo', v_prod.name;
  end if;

  insert into public.inventory_movements(organization_id, product_id, direction, qty, reason, note)
  values (v_prod.organization_id, p_product_id, p_direction, p_qty, p_reason, p_note);

  update public.products
     set stock_qty = v_new, track_inventory = true, updated_at = now()
   where id = p_product_id
  returning * into v_prod;
  return v_prod;
end;
$$;
grant execute on function public.adjust_stock(uuid, public.txn_direction, numeric, public.inv_reason, text) to authenticated;

-- ---------------------------------------------------------------------
-- 3) Venta rápida atómica (insert + movimiento + descuento de stock)
-- ---------------------------------------------------------------------
create or replace function public.create_quick_sale(
  p_org          uuid,
  p_amount_minor bigint,
  p_description  text default null,
  p_method       text default 'cash',
  p_account_id   uuid default null,
  p_sold_at      date default current_date,
  p_product_id   uuid default null,
  p_qty          numeric default null
)
returns public.quick_sales
language plpgsql
as $$
declare
  v_qs  public.quick_sales;
begin
  if p_amount_minor <= 0 then raise exception 'El monto debe ser mayor a 0'; end if;
  if p_org not in (select public.current_user_orgs()) then
    raise exception 'Organización sin acceso';
  end if;

  insert into public.quick_sales(
    organization_id, description, amount_minor,
    currency, method, account_id, sold_at, created_by, product_id, qty
  ) values (
    p_org, p_description, p_amount_minor,
    (select base_currency from public.organizations where id = p_org),
    p_method, p_account_id, coalesce(p_sold_at, current_date), auth.uid(),
    p_product_id, p_qty
  ) returning * into v_qs;

  if p_account_id is not null then
    perform public.record_account_movement(
      p_account_id, 'in', p_amount_minor, coalesce(p_sold_at, current_date),
      coalesce(p_description, 'Venta rápida'));
  end if;

  if p_product_id is not null and coalesce(p_qty,0) > 0 then
    perform public.adjust_stock(p_product_id, 'out', p_qty, 'sale', 'Venta rápida');
  end if;

  return v_qs;
end;
$$;
revoke all on function public.create_quick_sale(uuid, bigint, text, text, uuid, date, uuid, numeric) from public;
grant execute on function public.create_quick_sale(uuid, bigint, text, text, uuid, date, uuid, numeric) to authenticated;

create or replace function public.delete_quick_sale(p_id uuid)
returns void
language plpgsql
as $$
declare v_qs public.quick_sales;
begin
  select * into v_qs from public.quick_sales where id = p_id;
  if not found then raise exception 'Venta no encontrada o sin acceso'; end if;

  -- Revertir el ingreso a la cuenta (salida por el mismo monto).
  if v_qs.account_id is not null then
    perform public.record_account_movement(
      v_qs.account_id, 'out', v_qs.amount_minor, current_date,
      'Reverso de venta rápida eliminada');
  end if;

  -- Reponer stock si la venta había descontado producto.
  if v_qs.product_id is not null and coalesce(v_qs.qty,0) > 0 then
    perform public.adjust_stock(v_qs.product_id, 'in', v_qs.qty, 'adjustment', 'Reverso de venta rápida eliminada');
  end if;

  delete from public.quick_sales where id = p_id;
end;
$$;
revoke all on function public.delete_quick_sale(uuid) from public;
grant execute on function public.delete_quick_sale(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 4) Gastos: crear atómico, marcar pagado, eliminar revirtiendo saldo
-- ---------------------------------------------------------------------
create or replace function public.create_expense(
  p_org            uuid,
  p_description    text,
  p_amount_minor   bigint,
  p_category       text default null,
  p_vendor         text default null,
  p_tax_minor      bigint default 0,
  p_expense_date   date default current_date,
  p_payment_status text default 'paid',
  p_account_id     uuid default null,
  p_is_deductible  boolean default false
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

  insert into public.expenses(
    organization_id, description, category, vendor, amount_minor, tax_minor,
    currency, expense_date, payment_status, account_id, is_deductible, created_by
  ) values (
    p_org, p_description, p_category, p_vendor, p_amount_minor, coalesce(p_tax_minor,0),
    (select base_currency from public.organizations where id = p_org),
    coalesce(p_expense_date, current_date), p_payment_status, p_account_id, p_is_deductible, auth.uid()
  ) returning * into v_exp;

  if p_payment_status = 'paid' and p_account_id is not null then
    perform public.record_account_movement(
      p_account_id, 'out', p_amount_minor, coalesce(p_expense_date, current_date),
      'Gasto: ' || p_description);
  end if;

  return v_exp;
end;
$$;
revoke all on function public.create_expense(uuid, text, bigint, text, text, bigint, date, text, uuid, boolean) from public;
grant execute on function public.create_expense(uuid, text, bigint, text, text, bigint, date, text, uuid, boolean) to authenticated;

-- Marca un gasto pendiente como pagado y descuenta de la cuenta elegida.
create or replace function public.set_expense_paid(
  p_id uuid,
  p_account_id uuid default null,
  p_paid_date date default current_date
)
returns public.expenses
language plpgsql
as $$
declare v_exp public.expenses;
begin
  select * into v_exp from public.expenses where id = p_id;
  if not found then raise exception 'Gasto no encontrado o sin acceso'; end if;
  if v_exp.payment_status = 'paid' then raise exception 'El gasto ya está pagado'; end if;

  update public.expenses
     set payment_status = 'paid',
         account_id = coalesce(p_account_id, account_id),
         updated_at = now()
   where id = p_id
  returning * into v_exp;

  if v_exp.account_id is not null then
    perform public.record_account_movement(
      v_exp.account_id, 'out', v_exp.amount_minor, coalesce(p_paid_date, current_date),
      'Gasto: ' || v_exp.description);
  end if;

  return v_exp;
end;
$$;
revoke all on function public.set_expense_paid(uuid, uuid, date) from public;
grant execute on function public.set_expense_paid(uuid, uuid, date) to authenticated;

create or replace function public.delete_expense(p_id uuid)
returns void
language plpgsql
as $$
declare v_exp public.expenses;
begin
  select * into v_exp from public.expenses where id = p_id;
  if not found then raise exception 'Gasto no encontrado o sin acceso'; end if;

  -- Si estaba pagado desde una cuenta, devolver el dinero (entrada).
  if v_exp.payment_status = 'paid' and v_exp.account_id is not null then
    perform public.record_account_movement(
      v_exp.account_id, 'in', v_exp.amount_minor, current_date,
      'Reverso de gasto eliminado');
  end if;

  delete from public.expenses where id = p_id;
end;
$$;
revoke all on function public.delete_expense(uuid) from public;
grant execute on function public.delete_expense(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5) Anular factura (void): restaura stock de las líneas con producto
-- ---------------------------------------------------------------------
create or replace function public.void_invoice(p_id uuid)
returns public.invoices
language plpgsql
as $$
declare
  v_inv public.invoices;
  v_item record;
begin
  select * into v_inv from public.invoices where id = p_id;
  if not found then raise exception 'Factura no encontrada o sin acceso'; end if;
  if v_inv.status = 'void' then raise exception 'La factura ya está anulada'; end if;
  if v_inv.paid_minor > 0 then
    raise exception 'No se puede anular una factura con pagos; primero revierte los pagos';
  end if;

  -- Reponer stock solo si la factura estaba emitida (había descontado).
  if v_inv.status in ('issued','partially_paid','overdue') then
    for v_item in
      select ii.product_id, ii.quantity
        from public.invoice_items ii
        join public.products p on p.id = ii.product_id
       where ii.invoice_id = p_id and ii.product_id is not null and p.track_inventory
    loop
      perform public.adjust_stock(v_item.product_id, 'in', v_item.quantity, 'adjustment', 'Reposición por factura anulada');
    end loop;
  end if;

  update public.invoices set status = 'void', updated_at = now()
   where id = p_id returning * into v_inv;
  return v_inv;
end;
$$;
revoke all on function public.void_invoice(uuid) from public;
grant execute on function public.void_invoice(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 6) Columnas nuevas para venta rápida (producto + cantidad)
-- ---------------------------------------------------------------------
alter table public.quick_sales add column if not exists product_id uuid references public.products(id);
alter table public.quick_sales add column if not exists qty numeric(14,3);

-- ---------------------------------------------------------------------
-- 7) Enlace ítem de compra -> producto del catálogo (idempotencia PI-2)
-- ---------------------------------------------------------------------
alter table public.purchase_items add column if not exists product_id uuid references public.products(id);

-- =====================================================================
-- FIN migración 0026
-- =====================================================================
