-- =====================================================================
-- ZENTRO -- Migracion 0023 -- my_organizations incluye business_type
-- Para que la app conozca el perfil de negocio sin consultas extra.
-- =====================================================================

drop function if exists public.my_organizations();
create or replace function public.my_organizations()
returns table (id uuid, name text, country text, base_currency text,
               timezone text, locale text, legal_name text, tax_id text,
               status text, business_type text)
language sql stable security definer set search_path = public as $$
  select o.id, o.name, o.country::text, o.base_currency::text, o.timezone,
         o.locale, o.legal_name, o.tax_id, o.status::text, o.business_type
  from public.organizations o
  join public.memberships m on m.organization_id = o.id
  where m.user_id = auth.uid()
  order by m.created_at;
$$;
grant execute on function public.my_organizations() to authenticated;
