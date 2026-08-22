-- =====================================================================
-- ZENTRO — Migración 0046 — Quitar el vínculo redundante proyecto→cotización
--
-- BUG DE PRODUCCIÓN detectado en la prueba E2E del perfil de obra
-- (2026-08-21): la pantalla de detalle de una cotización devolvía 404.
--
-- Causa: la 0045 agregó `projects.quotation_id`, y con eso quedaron DOS
-- llaves foráneas entre `quotations` y `projects`:
--     quotations.project_id  → projects.id
--     projects.quotation_id  → quotations.id
--
-- PostgREST resuelve los embeds (`select=*,projects(id,name)`) buscando LA
-- relación entre las dos tablas. Con dos candidatas no puede decidir y
-- devuelve error en vez de datos; el `.single()` de la app veía "sin
-- resultado" y disparaba notFound(). O sea: la cotización se guardaba bien
-- —el PDF la imprimía completa— pero su ficha en la app daba 404.
--
-- Arreglo de raíz, no rodeo: `projects.quotation_id` es REDUNDANTE. El
-- código nunca la lee; solo la escribía al abrir un trabajo desde una
-- cotización. La pregunta "¿de qué cotización nació este trabajo?" ya la
-- responde `quotations.project_id` (la primera cotización aceptada del
-- proyecto), que es la dirección que la app sí usa en todas partes.
--
-- Al quitarla vuelve a haber UNA sola relación y el embed es inequívoco.
-- Además desaparece la trampa: cualquier consulta futura que embeba
-- proyectos desde cotizaciones (o al revés) habría chocado con lo mismo.
--
-- Sin pérdida de datos: 0 filas tenían valor cuando se aplicó esta
-- migración (verificado). La 0045 se deja intacta como historia.
--
-- Idempotente: `drop column if exists`.
-- =====================================================================

alter table public.projects drop column if exists quotation_id;

-- Comprobación: debe quedar exactamente UNA llave foránea entre las dos
-- tablas. Si quedaran dos, el 404 volvería y es mejor que falle aquí.
do $$
declare v_fks int;
begin
  select count(*)
    into v_fks
    from pg_constraint c
    join pg_class  t  on t.oid  = c.conrelid
    join pg_class  ft on ft.oid = c.confrelid
   where c.contype = 'f'
     and (   (t.relname = 'quotations' and ft.relname = 'projects')
          or (t.relname = 'projects'   and ft.relname = 'quotations'));

  if v_fks <> 1 then
    raise exception 'Se esperaba 1 llave foránea entre quotations y projects, hay %. El embed de PostgREST volvería a ser ambiguo.', v_fks;
  end if;
end $$;

-- =====================================================================
-- FIN migración 0046
-- =====================================================================
