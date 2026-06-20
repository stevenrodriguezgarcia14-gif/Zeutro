-- =====================================================================
-- ZENTRO — Migración 0032
-- Corrige errores de CAST a enum que solo se manifiestan en EJECUCIÓN
-- (Postgres no castea text→enum implícitamente al insertar). Detectados con
-- una prueba E2E real contra la base:
--   - create_quick_sale: p_method (text) → quick_sales.method (payment_method)
--     [ROTO desde 0026: "Venta rápida" por RPC fallaba con 42804]
--   - create_expense: p_payment_status (text) → expenses.payment_status (expense_status)
--     [ROTO desde 0026: alta de "Gasto" por RPC fallaba con 42804]
--   - reverse_payment: el CASE de status (text) → invoices.status (invoice_status)
--     [introducido en 0030]
-- Se recrean idénticas salvo el cast explícito.
-- =====================================================================

-- 1) create_quick_sale: castear p_method --------------------------------
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
    p_method::public.payment_method, p_account_id, coalesce(p_sold_at, current_date), auth.uid(),
    p_product_id, p_qty
  ) returning * into v_qs;

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

-- 2) create_expense: castear p_payment_status --------------------------
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
  p_is_deductible  boolean default false,
  p_project_id     uuid default null
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
    currency, expense_date, payment_status, account_id, is_deductible, project_id, created_by
  ) values (
    p_org, p_description, p_category, p_vendor, p_amount_minor, coalesce(p_tax_minor,0),
    (select base_currency from public.organizations where id = p_org),
    coalesce(p_expense_date, current_date), p_payment_status::public.expense_status,
    p_account_id, p_is_deductible, p_project_id, auth.uid()
  ) returning * into v_exp;

  if p_payment_status = 'paid' and p_account_id is not null then
    perform public.record_account_movement(
      p_account_id, 'out', p_amount_minor, coalesce(p_expense_date, current_date),
      'Gasto: ' || p_description);
  end if;

  return v_exp;
end;
$$;
revoke all on function public.create_expense(uuid, text, bigint, text, text, bigint, date, text, uuid, boolean, uuid) from public;
grant execute on function public.create_expense(uuid, text, bigint, text, text, bigint, date, text, uuid, boolean, uuid) to authenticated;

-- 3) reverse_payment: castear el CASE de status ------------------------
create or replace function public.reverse_payment(p_payment_id uuid)
returns void
language plpgsql
as $$
declare
  v_pay   public.payments;
  v_alloc record;
  v_inv   public.invoices;
begin
  select * into v_pay from public.payments where id = p_payment_id;
  if not found then
    raise exception 'Pago no encontrado o sin acceso';
  end if;

  for v_alloc in
    select * from public.payment_allocations where payment_id = p_payment_id
  loop
    select * into v_inv from public.invoices where id = v_alloc.invoice_id;
    if found and v_inv.status <> 'void' then
      update public.invoices
         set paid_minor = greatest(0, v_inv.paid_minor - v_alloc.amount_minor),
             status = (case
               when (v_inv.paid_minor - v_alloc.amount_minor) <= 0 then 'issued'
               else 'partially_paid'
             end)::public.invoice_status,
             updated_at = now()
       where id = v_inv.id;
    end if;
  end loop;

  delete from public.payment_allocations where payment_id = p_payment_id;

  if v_pay.account_id is not null then
    insert into public.account_transactions(
      organization_id, account_id, direction, amount_minor, transaction_date, description, source_type, source_id
    ) values (
      v_pay.organization_id, v_pay.account_id, 'out', v_pay.amount_minor, current_date,
      'Reverso de pago', 'payment_reversal', v_pay.id
    );
    update public.accounts
       set current_balance_minor = current_balance_minor - v_pay.amount_minor, updated_at = now()
     where id = v_pay.account_id;
  end if;

  delete from public.payments where id = p_payment_id;
end;
$$;

revoke all on function public.reverse_payment(uuid) from public;
grant execute on function public.reverse_payment(uuid) to authenticated;
