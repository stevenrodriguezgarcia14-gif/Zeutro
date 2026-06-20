-- =====================================================================
-- ZENTRO — Migración 0030
-- Integridad de pagos:
--   1. register_payment: rechaza pagos MAYORES al saldo (antes inflaba la
--      cuenta y el dashboard con dinero inexistente porque el movimiento de
--      cuenta usaba p_amount_minor sin topar — ver auditoría C1).
--   2. reverse_payment: revierte un pago ya registrado (devuelve saldo a la
--      factura, su estado, y deshace el movimiento de cuenta). Antes no había
--      forma de corregir un pago duplicado o en la factura equivocada (C3).
-- Ambas SECURITY INVOKER: respetan RLS con el usuario actual.
-- =====================================================================

-- 1) register_payment con guarda de sobrepago -------------------------
create or replace function public.register_payment(
  p_invoice_id   uuid,
  p_amount_minor bigint,
  p_account_id   uuid default null,
  p_method       public.payment_method default 'transfer',
  p_paid_at      date default current_date,
  p_reference    text default null
)
returns public.invoices
language plpgsql
as $$
declare
  v_inv      public.invoices;
  v_pay_id   uuid;
  v_new_paid bigint;
  v_status   public.invoice_status;
begin
  select * into v_inv from public.invoices where id = p_invoice_id;
  if not found then
    raise exception 'Factura no encontrada o sin acceso';
  end if;
  if p_amount_minor <= 0 then
    raise exception 'El monto debe ser mayor a 0';
  end if;
  if v_inv.status = 'draft' then
    raise exception 'No se puede pagar una factura en borrador; emítela primero';
  end if;
  if v_inv.status = 'void' then
    raise exception 'La factura está anulada';
  end if;
  if v_inv.balance_minor <= 0 then
    raise exception 'La factura ya está pagada';
  end if;
  -- Guarda clave: no aceptar más de lo que se debe. Así el movimiento de cuenta
  -- (que suma p_amount_minor) siempre coincide con lo asignado a la factura.
  if p_amount_minor > v_inv.balance_minor then
    raise exception 'El pago es mayor al saldo pendiente. Registra como máximo el saldo de la factura.';
  end if;

  insert into public.payments(
    organization_id, customer_id, account_id, amount_minor, currency, method, paid_at, reference
  ) values (
    v_inv.organization_id, v_inv.customer_id, p_account_id, p_amount_minor, v_inv.currency, p_method, p_paid_at, p_reference
  ) returning id into v_pay_id;

  insert into public.payment_allocations(organization_id, payment_id, invoice_id, amount_minor)
  values (v_inv.organization_id, v_pay_id, v_inv.id, p_amount_minor);

  v_new_paid := v_inv.paid_minor + p_amount_minor;
  if v_new_paid >= v_inv.total_minor then
    v_status := 'paid';
  else
    v_status := 'partially_paid';
  end if;

  update public.invoices
     set paid_minor = v_new_paid, status = v_status, updated_at = now()
   where id = v_inv.id
  returning * into v_inv;

  if p_account_id is not null then
    insert into public.account_transactions(
      organization_id, account_id, direction, amount_minor, transaction_date, description, source_type, source_id
    ) values (
      v_inv.organization_id, p_account_id, 'in', p_amount_minor, p_paid_at,
      'Pago factura ' || v_inv.number, 'payment', v_pay_id
    );
    update public.accounts
       set current_balance_minor = current_balance_minor + p_amount_minor, updated_at = now()
     where id = p_account_id;
  end if;

  return v_inv;
end;
$$;

revoke all on function public.register_payment(uuid, bigint, uuid, public.payment_method, date, text) from public;
grant execute on function public.register_payment(uuid, bigint, uuid, public.payment_method, date, text) to authenticated;

-- 2) reverse_payment: deshace un pago registrado -----------------------
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

  -- Devolver el saldo a cada factura que este pago había cubierto.
  for v_alloc in
    select * from public.payment_allocations where payment_id = p_payment_id
  loop
    select * into v_inv from public.invoices where id = v_alloc.invoice_id;
    if found and v_inv.status <> 'void' then
      update public.invoices
         set paid_minor = greatest(0, v_inv.paid_minor - v_alloc.amount_minor),
             status = case
               when (v_inv.paid_minor - v_alloc.amount_minor) <= 0 then 'issued'
               else 'partially_paid'
             end,
             updated_at = now()
       where id = v_inv.id;
    end if;
  end loop;

  delete from public.payment_allocations where payment_id = p_payment_id;

  -- Deshacer el movimiento de cuenta, si lo hubo (correción: se permite incluso
  -- si dejara la cuenta temporalmente baja, porque ese ingreso no debió existir).
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
