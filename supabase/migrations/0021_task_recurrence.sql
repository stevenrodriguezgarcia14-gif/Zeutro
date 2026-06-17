-- =====================================================================
-- ZENTRO -- Migracion 0021 -- Recurrencia de tareas
-- Al completar una tarea recurrente, la app crea automaticamente la
-- siguiente ocurrencia con la fecha avanzada segun el periodo.
-- =====================================================================

alter table public.tasks
  add column if not exists recurrence text not null default 'none';
-- valores: none | daily | weekly | monthly
