-- =====================================================================
-- ZENTRO — Migración 0036 — Rendimiento del camino crítico
-- Antes: cada navegación hacía 4 round-trips secuenciales a la base
-- (accept_pending_invitations → my_organizations → active_org →
-- is_platform_admin) y el dashboard disparaba 17 consultas de conteo.
-- Ahora: 1 solo round-trip por navegación (app_bootstrap) y 1 para los
-- conteos de activación (activation_counts).
-- =====================================================================

-- 1) Bootstrap de la app: todo lo que el layout necesita, en UNA llamada.
--    SECURITY INVOKER: delega en funciones existentes que ya manejan sus
--    propios permisos (accept_pending_invitations y my_organizations son
--    SECURITY DEFINER; active_org respeta RLS).
create or replace function public.app_bootstrap()
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_orgs jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('orgs', '[]'::jsonb, 'active_org', null, 'is_platform_admin', false);
  end if;

  -- Si el usuario fue invitado a un negocio, se une automáticamente.
  perform public.accept_pending_invitations();

  select coalesce(jsonb_agg(to_jsonb(o)), '[]'::jsonb)
    into v_orgs
    from public.my_organizations() o;

  return jsonb_build_object(
    'orgs', v_orgs,
    'active_org', public.active_org(),
    'is_platform_admin', public.is_platform_admin()
  );
end;
$$;
grant execute on function public.app_bootstrap() to authenticated;
revoke execute on function public.app_bootstrap() from anon;

-- 2) Conteos de activación en una sola consulta (antes: 17 requests HTTP).
--    SECURITY INVOKER: la RLS por empresa activa (0033) aplica a cada tabla.
create or replace function public.activation_counts()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'customers',              (select count(*) from customers),
    'products',               (select count(*) from products),
    'productsWithPrice',      (select count(*) from products where sale_price_minor > 0),
    'purchases',              (select count(*) from purchases),
    'purchaseItems',          (select count(*) from purchase_items),
    'purchaseItemsWithPrice', (select count(*) from purchase_items where sale_price_minor > 0),
    'resaleSales',            (select count(*) from purchase_items where units_sold > 0),
    'quickSales',             (select count(*) from quick_sales),
    'quotations',             (select count(*) from quotations),
    'invoices',               (select count(*) from invoices),
    'payments',               (select count(*) from payments),
    'expenses',               (select count(*) from expenses),
    'accounts',               (select count(*) from accounts),
    'opportunities',          (select count(*) from opportunities where status = 'open'),
    'projects',               (select count(*) from projects),
    'overdueInvoices',        (select count(*) from invoices where balance_minor > 0 and due_date < current_date and status not in ('paid','void')),
    'openQuotations',         (select count(*) from quotations where status = 'sent')
  );
$$;
grant execute on function public.activation_counts() to authenticated;
revoke execute on function public.activation_counts() from anon;
