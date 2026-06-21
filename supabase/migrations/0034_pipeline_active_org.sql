-- =====================================================================
-- ZENTRO — Migración 0034
-- ensure_default_pipeline() elegía la empresa con "memberships ... limit 1"
-- (arbitraria), no la EMPRESA ACTIVA. Con 2+ empresas, abrir el embudo de
-- una empresa podía crear/usar el pipeline de OTRA → embudo vacío o cruzado.
-- Ahora usa public.active_org() (la misma fuente que la RLS).
-- =====================================================================

create or replace function public.ensure_default_pipeline()
returns uuid
language plpgsql
security definer
set search_path to public
as $$
declare
  v_org  uuid;
  v_pipe uuid;
begin
  v_org := public.active_org();
  if v_org is null then raise exception 'Sin organización'; end if;

  select id into v_pipe from public.pipelines where organization_id = v_org order by created_at limit 1;
  if v_pipe is not null then return v_pipe; end if;

  insert into public.pipelines(organization_id, name) values (v_org, 'Ventas') returning id into v_pipe;
  insert into public.stages(organization_id, pipeline_id, name, position, probability_bps, is_won, is_lost) values
    (v_org, v_pipe, 'Prospecto',   1, 1000,  false, false),
    (v_org, v_pipe, 'Calificado',  2, 2500,  false, false),
    (v_org, v_pipe, 'Propuesta',   3, 5000,  false, false),
    (v_org, v_pipe, 'Negociación', 4, 7500,  false, false),
    (v_org, v_pipe, 'Ganada',      5, 10000, true,  false),
    (v_org, v_pipe, 'Perdida',     6, 0,     false, true);
  return v_pipe;
end;
$$;
