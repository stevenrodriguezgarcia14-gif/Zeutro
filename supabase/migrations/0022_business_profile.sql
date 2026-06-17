-- =====================================================================
-- ZENTRO -- Migracion 0022 -- Perfil de negocio (Centro de Orientacion)
-- Guarda el tipo de negocio para personalizar la experiencia: qué módulos
-- priorizar, la ruta recomendada y el checklist de activación.
-- =====================================================================

alter table public.organizations
  add column if not exists business_type text;

-- Extender create_organization para recibir el tipo de negocio en el alta.
drop function if exists public.create_organization(text, text, text);
create or replace function public.create_organization(
  p_name          text,
  p_country       text default 'MX',
  p_currency      text default 'MXN',
  p_business_type text default null
)
returns public.organizations
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_org public.organizations;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'El nombre del negocio es obligatorio'; end if;

  insert into public.organizations (name, country, base_currency, business_type, created_by)
  values (btrim(p_name), p_country, p_currency, p_business_type, v_uid)
  returning * into v_org;

  insert into public.memberships (organization_id, user_id, role)
  values (v_org.id, v_uid, 'owner');

  return v_org;
end;
$$;

revoke all on function public.create_organization(text, text, text, text) from public;
grant execute on function public.create_organization(text, text, text, text) to authenticated;
