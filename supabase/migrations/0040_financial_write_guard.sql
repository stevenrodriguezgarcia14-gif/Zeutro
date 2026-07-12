-- =====================================================================
-- ZENTRO — Migración 0040 — Guarda de escritura financiera (cierra M-1)
--
-- Problema (Security-Audit-Report M-1, residual): PostgREST expone las
-- tablas y RLS permite a cualquier escritor hacer UPDATE/INSERT/DELETE
-- directo, saltándose las funciones atómicas. Un usuario podía:
--   update accounts set current_balance_minor = 99999999
--   update invoices set status='paid', paid_minor=total_minor  (sin pago)
--   insert into account_transactions (...)                     (libro falso)
--
-- Solución: un candado transaccional. Las funciones financieras oficiales
-- marcan la transacción con set_config('zentro.fin_write','1', true) y
-- triggers BEFORE en las tablas sensibles rechazan cualquier escritura
-- de dinero que no venga marcada. PostgREST no puede ejecutar set_config
-- (solo expone tablas y funciones de `public`), así que el candado no es
-- falsificable desde la API.
--
-- Escrituras directas que SIGUEN permitidas (las usa la app):
--   - INSERT de facturas en 'draft'/'issued' con paid_minor = 0.
--   - UPDATE de factura draft→issued (emitir) y campos no-dinero
--     (payment_link, notas, totales de borradores).
--   - INSERT de cuentas con su saldo inicial (alta de cuenta).
--   - Los borrados en cascada (borrar empresa/cuenta) pasan porque el
--     padre ya no existe cuando el trigger revisa.
--
-- Bono: transfer_between_accounts ahora también rechaza dejar la cuenta
-- origen en negativo (0026 se lo puso a record_account_movement, pero la
-- transferencia se quedó sin la guarda).
--
-- Idempotente: create or replace + drop trigger if exists.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) El candado
-- ---------------------------------------------------------------------
create or replace function public.fin_write_allowed()
returns boolean language sql stable as
$$ select coalesce(current_setting('zentro.fin_write', true), '') = '1' $$;

-- ---------------------------------------------------------------------
-- 1) Facturas: paid_minor y status solo cambian con las funciones
-- ---------------------------------------------------------------------
create or replace function public.guard_invoice_write()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if not public.fin_write_allowed() then
      if coalesce(new.paid_minor, 0) <> 0 then
        raise exception 'Una factura nueva no puede nacer con pagos; registra el pago con register_payment';
      end if;
      if new.status not in ('draft', 'issued') then
        raise exception 'Una factura nueva solo puede crearse en borrador o emitida';
      end if;
    end if;
    if coalesce(new.paid_minor, 0) < 0 or new.total_minor < 0 or coalesce(new.paid_minor, 0) > new.total_minor then
      raise exception 'Importes de factura inconsistentes (pagado fuera del rango del total)';
    end if;
    return new;

  elsif tg_op = 'UPDATE' then
    if not public.fin_write_allowed() then
      if new.paid_minor is distinct from old.paid_minor then
        raise exception 'El importe pagado solo se modifica con register_payment / reverse_payment';
      end if;
      if new.status is distinct from old.status
         and not (old.status = 'draft' and new.status = 'issued') then
        raise exception 'Ese cambio de estado solo se hace con las funciones de Zentro (pagos, reversos o void_invoice)';
      end if;
    end if;
    -- Invariante (aplica siempre que se toquen importes, incluso con candado):
    if (new.paid_minor is distinct from old.paid_minor or new.total_minor is distinct from old.total_minor)
       and (new.paid_minor < 0 or new.paid_minor > new.total_minor) then
      raise exception 'Importes de factura inconsistentes (pagado fuera del rango del total)';
    end if;
    return new;

  else -- DELETE
    if public.fin_write_allowed() then return old; end if;
    -- Cascada legítima: la empresa ya fue borrada.
    if not exists (select 1 from public.organizations o where o.id = old.organization_id) then
      return old;
    end if;
    if coalesce(old.paid_minor, 0) > 0 then
      raise exception 'No se puede borrar una factura con pagos; revierte los pagos y anúlala (void_invoice)';
    end if;
    return old;
  end if;
end;
$$;

drop trigger if exists trg_guard_invoices on public.invoices;
create trigger trg_guard_invoices
  before insert or update or delete on public.invoices
  for each row execute function public.guard_invoice_write();

-- ---------------------------------------------------------------------
-- 2) Cuentas: el saldo solo cambia con movimientos
-- ---------------------------------------------------------------------
create or replace function public.guard_account_write()
returns trigger language plpgsql as $$
begin
  if not public.fin_write_allowed()
     and new.current_balance_minor is distinct from old.current_balance_minor then
    raise exception 'El saldo de una cuenta solo cambia con movimientos, transferencias o pagos (no directamente)';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_accounts on public.accounts;
create trigger trg_guard_accounts
  before update on public.accounts
  for each row execute function public.guard_account_write();

-- ---------------------------------------------------------------------
-- 3) Libro de movimientos: append-only y solo vía funciones
-- ---------------------------------------------------------------------
create or replace function public.guard_ledger_write()
returns trigger language plpgsql as $$
begin
  if public.fin_write_allowed() then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    -- Cascadas legítimas: se borró la empresa o la cuenta entera.
    if not exists (select 1 from public.organizations o where o.id = old.organization_id)
       or not exists (select 1 from public.accounts a where a.id = old.account_id) then
      return old;
    end if;
  end if;
  raise exception 'El libro de movimientos solo se escribe con las funciones de Zentro (movimientos, transferencias, pagos)';
end;
$$;

drop trigger if exists trg_guard_account_transactions on public.account_transactions;
create trigger trg_guard_account_transactions
  before insert or update or delete on public.account_transactions
  for each row execute function public.guard_ledger_write();

-- ---------------------------------------------------------------------
-- 4) Pagos y sus asignaciones: solo vía register_payment / reverse_payment
-- ---------------------------------------------------------------------
create or replace function public.guard_payment_write()
returns trigger language plpgsql as $$
begin
  if public.fin_write_allowed() then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE'
     and not exists (select 1 from public.organizations o where o.id = old.organization_id) then
    return old; -- cascada por borrado de empresa
  end if;
  raise exception 'Los pagos solo se registran o revierten con register_payment / reverse_payment';
end;
$$;

drop trigger if exists trg_guard_payments on public.payments;
create trigger trg_guard_payments
  before insert or update or delete on public.payments
  for each row execute function public.guard_payment_write();

create or replace function public.guard_allocation_write()
returns trigger language plpgsql as $$
begin
  if public.fin_write_allowed() then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE'
     and (not exists (select 1 from public.organizations o where o.id = old.organization_id)
          or not exists (select 1 from public.payments p where p.id = old.payment_id)
          or not exists (select 1 from public.invoices i where i.id = old.invoice_id)) then
    return old; -- cascada por borrado de empresa/pago/factura
  end if;
  raise exception 'Las asignaciones de pago solo se modifican con register_payment / reverse_payment';
end;
$$;

drop trigger if exists trg_guard_payment_allocations on public.payment_allocations;
create trigger trg_guard_payment_allocations
  before insert or update or delete on public.payment_allocations
  for each row execute function public.guard_allocation_write();

-- ---------------------------------------------------------------------
-- 5) Las funciones oficiales levantan el candado.
--    Se recrean desde su versión MÁS RECIENTE:
--    record_account_movement (0026) · register_payment (0030) ·
--    reverse_payment (0032) · void_invoice (0026) ·
--    transfer_between_accounts (0006, + guarda de saldo negativo)
-- ---------------------------------------------------------------------

-- 5.1 record_account_movement (0026 + candado)
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
  perform set_config('zentro.fin_write', '1', true);

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

-- 5.2 register_payment (0030 + candado)
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
  perform set_config('zentro.fin_write', '1', true);

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

-- 5.3 reverse_payment (0032 + candado)
create or replace function public.reverse_payment(p_payment_id uuid)
returns void
language plpgsql
as $$
declare
  v_pay   public.payments;
  v_alloc record;
  v_inv   public.invoices;
begin
  perform set_config('zentro.fin_write', '1', true);

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

-- 5.4 void_invoice (0026 + candado)
create or replace function public.void_invoice(p_id uuid)
returns public.invoices
language plpgsql
as $$
declare
  v_inv public.invoices;
  v_item record;
begin
  perform set_config('zentro.fin_write', '1', true);

  select * into v_inv from public.invoices where id = p_id;
  if not found then raise exception 'Factura no encontrada o sin acceso'; end if;
  if v_inv.status = 'void' then raise exception 'La factura ya está anulada'; end if;
  if v_inv.paid_minor > 0 then
    raise exception 'No se puede anular una factura con pagos; primero revierte los pagos';
  end if;

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

-- 5.5 transfer_between_accounts (0006 + candado + guarda de saldo negativo)
create or replace function public.transfer_between_accounts(
  p_from         uuid,
  p_to           uuid,
  p_amount_minor bigint,
  p_date         date default current_date,
  p_description  text default null
)
returns void
language plpgsql
as $$
declare
  v_from public.accounts;
  v_to   public.accounts;
  v_desc text := coalesce(nullif(btrim(p_description), ''), 'Transferencia');
begin
  perform set_config('zentro.fin_write', '1', true);

  if p_from = p_to then raise exception 'Las cuentas origen y destino deben ser distintas'; end if;
  if p_amount_minor <= 0 then raise exception 'El monto debe ser mayor a 0'; end if;
  select * into v_from from public.accounts where id = p_from;
  if not found then raise exception 'Cuenta origen no encontrada'; end if;
  select * into v_to from public.accounts where id = p_to;
  if not found then raise exception 'Cuenta destino no encontrada'; end if;

  -- Misma regla que record_account_movement (0026): sin negativos salvo crédito.
  if v_from.current_balance_minor - p_amount_minor < 0 and v_from.type <> 'credit_card' then
    raise exception 'Saldo insuficiente en "%": la transferencia dejaría la cuenta en negativo', v_from.name;
  end if;

  insert into public.account_transactions(organization_id, account_id, direction, amount_minor, transaction_date, description, source_type)
  values (v_from.organization_id, p_from, 'out', p_amount_minor, p_date, v_desc || ' (salida)', 'transfer');
  insert into public.account_transactions(organization_id, account_id, direction, amount_minor, transaction_date, description, source_type)
  values (v_to.organization_id, p_to, 'in', p_amount_minor, p_date, v_desc || ' (entrada)', 'transfer');

  update public.accounts set current_balance_minor = current_balance_minor - p_amount_minor, updated_at = now() where id = p_from;
  update public.accounts set current_balance_minor = current_balance_minor + p_amount_minor, updated_at = now() where id = p_to;
end;
$$;

-- =====================================================================
-- FIN migración 0040
-- =====================================================================
