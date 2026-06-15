-- =====================================================================
-- ZENTRO — Migración 0006 — Movimientos de cuenta (atómicos)
-- record_account_movement: ingreso/egreso manual que ajusta el saldo.
-- transfer_between_accounts: transferencia entre dos cuentas.
-- SECURITY INVOKER: respeta RLS con el usuario actual.
-- =====================================================================

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
begin
  select * into v_acc from public.accounts where id = p_account_id;
  if not found then raise exception 'Cuenta no encontrada o sin acceso'; end if;
  if p_amount_minor <= 0 then raise exception 'El monto debe ser mayor a 0'; end if;

  insert into public.account_transactions(
    organization_id, account_id, direction, amount_minor, transaction_date, description, source_type
  ) values (
    v_acc.organization_id, p_account_id, p_direction, p_amount_minor, p_date, p_description, 'manual'
  );

  update public.accounts
     set current_balance_minor = current_balance_minor
         + (case when p_direction = 'in' then p_amount_minor else -p_amount_minor end),
         updated_at = now()
   where id = p_account_id
  returning * into v_acc;

  return v_acc;
end;
$$;

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
  if p_from = p_to then raise exception 'Las cuentas origen y destino deben ser distintas'; end if;
  if p_amount_minor <= 0 then raise exception 'El monto debe ser mayor a 0'; end if;
  select * into v_from from public.accounts where id = p_from;
  if not found then raise exception 'Cuenta origen no encontrada'; end if;
  select * into v_to from public.accounts where id = p_to;
  if not found then raise exception 'Cuenta destino no encontrada'; end if;

  insert into public.account_transactions(organization_id, account_id, direction, amount_minor, transaction_date, description, source_type)
  values (v_from.organization_id, p_from, 'out', p_amount_minor, p_date, v_desc || ' (salida)', 'transfer');
  insert into public.account_transactions(organization_id, account_id, direction, amount_minor, transaction_date, description, source_type)
  values (v_to.organization_id, p_to, 'in', p_amount_minor, p_date, v_desc || ' (entrada)', 'transfer');

  update public.accounts set current_balance_minor = current_balance_minor - p_amount_minor, updated_at = now() where id = p_from;
  update public.accounts set current_balance_minor = current_balance_minor + p_amount_minor, updated_at = now() where id = p_to;
end;
$$;

revoke all on function public.record_account_movement(uuid, public.txn_direction, bigint, date, text) from public;
grant execute on function public.record_account_movement(uuid, public.txn_direction, bigint, date, text) to authenticated;
revoke all on function public.transfer_between_accounts(uuid, uuid, bigint, date, text) from public;
grant execute on function public.transfer_between_accounts(uuid, uuid, bigint, date, text) to authenticated;
