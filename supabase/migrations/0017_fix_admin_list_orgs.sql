-- =====================================================================
-- ZENTRO — Migración 0017 — Fix tipos en admin_list_orgs
-- country es character(2) y base_currency character(3); casteamos a text
-- para que coincida con la firma RETURNS TABLE (evita "structure of query
-- does not match function result type").
-- =====================================================================

drop function if exists public.admin_list_orgs();
create or replace function public.admin_list_orgs()
returns table (id uuid, name text, country text, base_currency text, status text, plan text, created_at timestamptz, members bigint, invoices bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;
  return query
    select o.id, o.name::text, o.country::text, o.base_currency::text, o.status::text, o.plan::text, o.created_at,
      (select count(*) from public.memberships m where m.organization_id = o.id),
      (select count(*) from public.invoices i where i.organization_id = o.id)
    from public.organizations o
    order by o.created_at desc;
end;
$$;
grant execute on function public.admin_list_orgs() to authenticated;

notify pgrst, 'reload schema';
