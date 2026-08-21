-- =====================================================================
-- ZENTRO — Migración 0043 — Crear negocio deja de poder duplicarse
--
-- En producción hay un negocio creado DOS veces con 4 segundos de
-- diferencia: el formulario se envió dos veces (doble toque antes de que
-- hidrate el botón, o "volver atrás" y reenviar). El resultado para el
-- emprendedor es peor que un registro de más: sus datos quedan repartidos
-- entre dos negocios, ve dos entradas en el selector y recibe dos correos
-- automáticos por semana.
--
-- El botón de la interfaz ya se deshabilita al enviar; eso no alcanza,
-- porque una interfaz nunca puede garantizar "exactamente una vez". La
-- garantía tiene que estar aquí: si el mismo usuario pide crear un negocio
-- con el mismo nombre que acaba de crear, se le devuelve el que ya tiene en
-- lugar de crear otro. Es la misma idea que hace idempotente al cron.
--
-- La ventana de 5 minutos es deliberada: ataca el reenvío accidental sin
-- impedir que meses después alguien abra una segunda sucursal homónima.
-- =====================================================================

create or replace function public.create_organization(
  p_name          text,
  p_country       text default 'MX',
  p_currency      text default 'MXN',
  p_business_type text default null
)
returns public.organizations
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_org public.organizations;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'El nombre del negocio es obligatorio'; end if;

  -- ¿Este mismo usuario acaba de crear un negocio con este mismo nombre?
  -- Entonces esto es un reenvío, no un negocio nuevo.
  select o.* into v_org
    from public.organizations o
    join public.memberships m
      on m.organization_id = o.id and m.user_id = v_uid and m.role = 'owner'
   where lower(btrim(o.name)) = lower(btrim(p_name))
     and o.created_at > now() - interval '5 minutes'
   order by o.created_at desc
   limit 1;

  if v_org.id is null then
    insert into public.organizations (name, country, base_currency, business_type, created_by)
    values (btrim(p_name), p_country, p_currency, p_business_type, v_uid)
    returning * into v_org;

    insert into public.memberships (organization_id, user_id, role)
    values (v_org.id, v_uid, 'owner');
  end if;

  -- Siempre se deja activo el negocio resultante (creado o reutilizado).
  insert into public.user_active_org(user_id, organization_id, updated_at)
  values (v_uid, v_org.id, now())
  on conflict (user_id) do update
    set organization_id = excluded.organization_id, updated_at = now();

  return v_org;
end;
$function$;

revoke all on function public.create_organization(text, text, text, text) from public;
grant execute on function public.create_organization(text, text, text, text) to authenticated;
