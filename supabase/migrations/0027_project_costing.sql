-- =====================================================================
-- ZENTRO — Migración 0027 — Costeo de proyectos (presupuesto vs real)
-- PI-7: enlazar gastos y facturas a un proyecto para comparar
-- presupuesto vs. gastado real y facturado.
-- Idempotente.
-- =====================================================================

alter table public.expenses add column if not exists project_id uuid references public.projects(id);
alter table public.invoices add column if not exists project_id uuid references public.projects(id);
create index if not exists idx_expenses_project on public.expenses(project_id);
create index if not exists idx_invoices_project on public.invoices(project_id);

-- Recrear create_expense para aceptar p_project_id (opcional). Se elimina la
-- versión anterior para evitar ambigüedad de sobrecarga.
drop function if exists public.create_expense(uuid, text, bigint, text, text, bigint, date, text, uuid, boolean);

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
    coalesce(p_expense_date, current_date), p_payment_status, p_account_id, p_is_deductible, p_project_id, auth.uid()
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

-- =====================================================================
-- FIN migración 0027
-- =====================================================================
