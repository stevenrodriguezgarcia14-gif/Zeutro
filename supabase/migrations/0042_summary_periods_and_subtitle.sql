-- =====================================================================
-- ZENTRO — Migración 0042
--   A) Resúmenes por período CERRADO: reminder_log deja de ser solo
--      "correos enviados" y pasa a ser "períodos ya procesados".
--   B) products.subtitle: subtítulo libre para la ficha de producto.
-- =====================================================================

-- ---------------------------------------------------------------------
-- A) reminder_log.sent — "revisado" ≠ "enviado"
--
-- El motor de resúmenes reserva la fila ANTES de enviar (para que dos
-- ejecuciones simultáneas no dupliquen el correo) y la marca enviada al
-- confirmar. Además, una semana sin movimiento se registra como procesada
-- SIN correo: así no se vuelve a evaluar cada día, y sobre todo ya no se
-- manda cada lunes un resumen idéntico con cifras de semanas viejas.
-- Las filas históricas sí se enviaron, por eso el default es true.
-- ---------------------------------------------------------------------
alter table public.reminder_log
  add column if not exists sent boolean not null default true;

comment on column public.reminder_log.sent is
  'true = el correo salió. false = el período se revisó y no había nada que contar (o el envío está en curso).';

comment on column public.reminder_log.period is
  'Período YA CERRADO que cubre el registro. collection/upcoming: fecha (YYYY-MM-DD). weekly: semana ISO (YYYY-Www). monthly: mes (YYYY-MM).';

-- ---------------------------------------------------------------------
-- Corrección del histórico: hasta ahora `period` guardaba la semana en la
-- que se ENVIÓ el correo (el lunes siguiente), no la semana que el correo
-- RESUMÍA. Con el nuevo motor `period` es siempre la semana resumida, así
-- que hay que correr las filas viejas una semana hacia atrás; si no, el
-- historial mentiría y la semana recién cerrada se daría por procesada.
--
-- Se hace en dos pasos con un prefijo temporal porque el índice único es
-- inmediato: renumerar en un solo UPDATE podría chocar con una fila que
-- todavía no se ha movido.
--
-- Es idempotente por construcción: solo toca las filas que todavía tienen la
-- semántica vieja, o sea aquellas cuyo `period` coincide con la semana en que
-- se enviaron. Después del ajuste `period` es la semana ANTERIOR a la del
-- envío, así que una segunda ejecución no encuentra nada que mover.
-- (Los registros 'monthly' ya guardaban el mes resumido: no se tocan.)
-- ---------------------------------------------------------------------
do $$
declare moved int;
begin
  update public.reminder_log
     set period = 'wk-fix:' || period
   where kind = 'weekly'
     and period like '____-W__'
     and period = to_char(sent_at, 'IYYY-"W"IW');
  get diagnostics moved = row_count;

  update public.reminder_log
     set period = to_char(to_date(substring(period from 8), 'IYYY-"W"IW') - 7, 'IYYY-"W"IW')
   where kind = 'weekly' and starts_with(period, 'wk-fix:');

  raise notice 'reminder_log: % filas semanales recorridas una semana atrás', moved;
end $$;

-- ---------------------------------------------------------------------
-- B) products.subtitle — subtítulo opcional de la ficha de producto.
--    Solo presentación: no entra en ningún cálculo de costo, precio,
--    margen ni inventario. NULL = no se muestra nada.
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists subtitle text;

comment on column public.products.subtitle is
  'Subtítulo libre bajo el nombre del producto (p. ej. "Productos elaborados para venta individual"). Solo visual.';
