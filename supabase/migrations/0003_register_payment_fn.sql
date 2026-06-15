-- =====================================================================
-- ZENTRO — Migración 0003
-- Función atómica para registrar un pago contra una factura.
-- SECURITY INVOKER (por defecto): respeta RLS con el usuario actual.
-- Hace en una sola transacción:
--   1. crea el pago
--   2. lo asigna a la factura (payment_allocation), tope = saldo
--   3. actualiza paid_minor y estado de la factura
--   4. si hay cuenta, registra el movimiento de entrada y suma al saldo
-- =====================================================================

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
  v_alloc    bigint;
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

  v_alloc := least(p_amount_minor, v_inv.balance_minor);
  if v_alloc <= 0 then
    raise exception 'La factura ya está pagada';
  end if;

  insert into public.payments(
    organization_id, customer_id, account_id, amount_minor, currency, method, paid_at, reference
  ) values (
    v_inv.organization_id, v_inv.customer_id, p_account_id, p_amount_minor, v_inv.currency, p_method, p_paid_at, p_reference
  ) returning id into v_pay_id;

  insert into public.payment_allocations(organization_id, payment_id, invoice_id, amount_minor)
  values (v_inv.organization_id, v_pay_id, v_inv.id, v_alloc);

  v_new_paid := v_inv.paid_minor + v_alloc;
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
