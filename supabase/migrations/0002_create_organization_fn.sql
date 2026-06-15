-- =====================================================================
-- ZENTRO — Migración 0002
-- Función atómica para crear organización + membership del creador.
-- Evita el problema "huevo y gallina" de RLS: al crear una organización
-- el usuario aún no es miembro, por lo que no podría leerla de vuelta.
-- SECURITY DEFINER ejecuta con privilegios del dueño (salta RLS) pero
-- usa auth.uid() para asignar al usuario autenticado actual.
-- =====================================================================

create or replace function public.create_organization(
  p_name     text,
  p_country  text default 'MX',
  p_currency text default 'MXN'
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org public.organizations;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'El nombre del negocio es obligatorio';
  end if;

  insert into public.organizations (name, country, base_currency, created_by)
  values (btrim(p_name), p_country, p_currency, v_uid)
  returning * into v_org;

  insert into public.memberships (organization_id, user_id, role)
  values (v_org.id, v_uid, 'owner');

  return v_org;
end;
$$;

revoke all on function public.create_organization(text, text, text) from public;
grant execute on function public.create_organization(text, text, text) to authenticated;
