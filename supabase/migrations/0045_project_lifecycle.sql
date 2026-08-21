-- =====================================================================
-- ZENTRO — Migración 0045 — Ciclo de vida completo de un TRABAJO
--
-- Motivo: el primer usuario de un vertical de OBRA (construcción y
-- remodelación) reveló que Zentro ya tenía todas las piezas para llevar un
-- trabajo por encargo (proyecto, cotización, gastos, facturas, tareas,
-- documentos) pero NO las costuras entre ellas. Ver
-- `Analisis-Construccion-Remodelacion-Zentro.md`.
--
-- Nada de esto es específico de construcción: son campos genéricos que le
-- sirven igual a un freelancer, una agencia, un consultor o un fabricante
-- que trabaja por encargo. No se crea ninguna tabla nueva.
--
-- Qué agrega:
--   1. quotations.project_id     → una cotización pertenece a un trabajo.
--                                  Es lo que convierte un "extra que pidió
--                                  el cliente" en un ADICIONAL rastreable y
--                                  cobrable, en vez de trabajo regalado.
--   2. quotations.cost_*         → costeo PRIVADO de la cotización
--                                  (materiales / mano de obra / subcontratos
--                                  / otros). El cliente nunca lo ve. Sirve
--                                  para no vender por debajo del costo y
--                                  para sembrar el costo estimado del
--                                  proyecto.
--   3. *_items.section/unit/position → presupuesto por PARTIDAS con unidad
--                                  de medida y orden estable. Una cotización
--                                  de 60 líneas agrupada por capítulos deja
--                                  de ser una lista plana ilegible.
--   4. projects.quotation_id     → de qué cotización nació el trabajo.
--      projects.site_address     → dónde se ejecuta (≠ dirección de cobro).
--      projects.warranty_until   → hasta cuándo respondes por el trabajo.
--   5. activation_counts()       → dos conteos nuevos para que la ruta
--                                  guiada del perfil de obra sepa si los
--                                  gastos y las facturas están REALMENTE
--                                  ligados al proyecto (que es donde está
--                                  todo el valor).
--
-- Seguridad: no se tocan políticas RLS. Todas las tablas afectadas
-- (quotations, quotation_items, invoice_items, projects) ya están cubiertas
-- por las políticas de 0044 (`active_org()` + `is_writer_in` / `is_org_manager`),
-- y las columnas nuevas heredan esa protección automáticamente. Tampoco se
-- tocan las guardas financieras de 0040: ninguna columna nueva es dinero
-- cobrado ni saldo.
--
-- Idempotente: `add column if not exists` + bloques DO que ignoran duplicados.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) COTIZACIONES — pertenencia a un trabajo y costeo privado
-- ---------------------------------------------------------------------
alter table public.quotations
  add column if not exists project_id             uuid references public.projects(id),
  add column if not exists cost_materials_minor   bigint not null default 0,
  add column if not exists cost_labor_minor       bigint not null default 0,
  add column if not exists cost_subcontract_minor bigint not null default 0,
  add column if not exists cost_other_minor       bigint not null default 0;

-- Costo total = suma de las cuatro partes. Columna generada para que nunca
-- se desincronice de sus componentes (mismo criterio que balance_minor en
-- invoices y line_total_minor en cost_components).
alter table public.quotations
  add column if not exists cost_minor bigint
    generated always as (
      cost_materials_minor + cost_labor_minor + cost_subcontract_minor + cost_other_minor
    ) stored;

-- Los costos no pueden ser negativos. `add constraint if not exists` no
-- existe en Postgres, así que se ignora el duplicado.
do $$
begin
  alter table public.quotations
    add constraint quotations_costs_non_negative check (
      cost_materials_minor   >= 0 and
      cost_labor_minor       >= 0 and
      cost_subcontract_minor >= 0 and
      cost_other_minor       >= 0
    );
exception when duplicate_object then null;
end $$;

create index if not exists idx_quotations_project on public.quotations(project_id);

-- ---------------------------------------------------------------------
-- 2) LÍNEAS — partidas (section), unidad de medida y orden estable
--
-- `section`  agrupa líneas bajo un capítulo ("Demolición", "Obra gris",
--            "Acabados"; o "Diseño", "Desarrollo", "Soporte"). NULL o ''
--            = línea sin agrupar, que es como se comportan las existentes.
-- `unit`     m², ml, día, punto, unidad… Se pre-llena desde products.unit.
-- `position` orden dentro de la cotización/factura. Las filas existentes
--            quedan en 0 y se siguen ordenando por created_at.
-- ---------------------------------------------------------------------
alter table public.quotation_items
  add column if not exists section  text,
  add column if not exists unit     text,
  add column if not exists position int not null default 0;

alter table public.invoice_items
  add column if not exists section  text,
  add column if not exists unit     text,
  add column if not exists position int not null default 0;

create index if not exists idx_quotation_items_order on public.quotation_items(quotation_id, position, created_at);
create index if not exists idx_invoice_items_order   on public.invoice_items(invoice_id, position, created_at);

-- ---------------------------------------------------------------------
-- 3) PROYECTOS — de dónde nacen, dónde se ejecutan, hasta cuándo responden
--
-- OJO con `budget_amount_minor`: se compara contra los GASTOS, o sea que
-- siempre significó COSTO ESTIMADO, no el precio que se le cobra al
-- cliente. La interfaz decía "Presupuesto" y eso hacía que un contratista
-- escribiera ahí su precio de venta, lo que volvía mentiroso el indicador
-- de "presupuesto vs gastado". No se renombra la columna (rompería código
-- y no aporta), pero la interfaz ya dice "Costo estimado" en todas partes.
-- El PRECIO del trabajo no se guarda aquí: se deriva de las cotizaciones
-- aceptadas del proyecto, así los adicionales suman solos.
-- ---------------------------------------------------------------------
alter table public.projects
  add column if not exists quotation_id   uuid references public.quotations(id),
  add column if not exists site_address   text,
  add column if not exists warranty_until date;

create index if not exists idx_projects_warranty
  on public.projects(organization_id, warranty_until)
  where warranty_until is not null;

-- ---------------------------------------------------------------------
-- 3b) Borrar un trabajo no puede quedar bloqueado ni llevarse el dinero
--
-- `expenses.project_id` (0027), `invoices.project_id` (0027) y las nuevas
-- `quotations.project_id` / `projects.quotation_id` nacieron sin cláusula
-- ON DELETE, o sea NO ACTION: en cuanto un trabajo tuviera un gasto o una
-- factura ligada, borrarlo fallaría con violación de llave foránea. La app
-- no mostraba ese error, así que el usuario veía el botón "Eliminar
-- proyecto" sin efecto alguno.
--
-- SET NULL es la respuesta correcta: el trabajo desaparece, pero sus gastos
-- y facturas siguen existiendo como registros del negocio (solo dejan de
-- estar ligados). CASCADE habría borrado facturas cobradas, que es
-- exactamente lo que la guarda financiera de 0040 existe para impedir.
-- ---------------------------------------------------------------------
do $$
declare
  r  record;
  fk record;
begin
  for r in
    select 'expenses'::text   as tbl, 'project_id'::text   as col, 'projects'::text   as ref union all
    select 'invoices',           'project_id',                'projects'              union all
    select 'quotations',         'project_id',                'projects'              union all
    select 'projects',           'quotation_id',              'quotations'
  loop
    -- Se eliminan las restricciones existentes sobre esa columna, se llamen
    -- como se llamen, y se vuelve a crear una con ON DELETE SET NULL.
    for fk in
      select c.conname
        from pg_constraint c
        join pg_class     t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        join pg_attribute a on a.attrelid = t.oid and a.attname = r.col
       where n.nspname = 'public'
         and t.relname = r.tbl
         and c.contype = 'f'
         and array_length(c.conkey, 1) = 1
         and c.conkey[1] = a.attnum
    loop
      execute format('alter table public.%I drop constraint %I;', r.tbl, fk.conname);
    end loop;

    execute format(
      'alter table public.%I add constraint %I foreign key (%I) references public.%I(id) on delete set null;',
      r.tbl, r.tbl || '_' || r.col || '_fkey', r.col, r.ref);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4) ACTIVACIÓN — saber si el usuario está ligando su operación al trabajo
--
-- `projectExpenses` / `projectInvoices` son la diferencia entre "usa
-- Zentro" y "sabe si la obra le está dejando dinero". La ruta guiada del
-- perfil de obra los usa para no dar por hecho un paso que no ocurrió.
-- Se recrea la función completa (es `create or replace`, sin pérdida).
-- ---------------------------------------------------------------------
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
    'openQuotations',         (select count(*) from quotations where status = 'sent'),
    -- Nuevos: la operación REALMENTE ligada al trabajo.
    'projectExpenses',        (select count(*) from expenses where project_id is not null),
    'projectInvoices',        (select count(*) from invoices where project_id is not null)
  );
$$;
grant execute on function public.activation_counts() to authenticated;
revoke execute on function public.activation_counts() from anon;

-- ---------------------------------------------------------------------
-- 5) Comprobación: las columnas nuevas quedaron donde debían.
--    Si algo falló, la migración falla en vez de dejar la app pidiendo
--    columnas que no existen (que es un 500 en producción).
-- ---------------------------------------------------------------------
do $$
declare faltantes text := '';
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='quotations' and column_name='project_id')
    then faltantes := faltantes || 'quotations.project_id '; end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='quotations' and column_name='cost_minor')
    then faltantes := faltantes || 'quotations.cost_minor '; end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='quotation_items' and column_name='section')
    then faltantes := faltantes || 'quotation_items.section '; end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='invoice_items' and column_name='section')
    then faltantes := faltantes || 'invoice_items.section '; end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='projects' and column_name='warranty_until')
    then faltantes := faltantes || 'projects.warranty_until '; end if;

  if faltantes <> '' then
    raise exception 'Faltaron columnas de la migración 0045: %', faltantes;
  end if;
end $$;

-- =====================================================================
-- FIN migración 0045
-- =====================================================================
