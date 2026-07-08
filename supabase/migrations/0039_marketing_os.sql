-- =====================================================================
-- ZENTRO — Migración 0039 — Marketing OS (/admin/marketing)
-- Almacén clave→JSON para el estado mutable del sistema operativo de
-- marketing del fundador: estados de video (grabado/editado/publicado),
-- checks de calendario y checklists, métricas manuales por video, meta
-- de usuarios fundadores e ideas propias.
--
-- El contenido editorial (guiones, calendario, manual) NO vive aquí:
-- es estático en src/lib/marketing/*. Esta tabla solo guarda progreso.
-- Convención de claves:
--   video:<id>        → { "status": "pendiente|grabado|editado|publicado" }
--   cal:<fecha>:<id>  → { "done": true }
--   chk:<scope>:<listId>:<idx> → { "done": true }
--   res:<id>          → { "done": true }
--   metrics:<videoId> → { views, ret3s, completion, comments, shares, saves, clicks, notes }
--   goal:funders      → { "current": n, "waitlist": n, "registros": n }
--   idea:<timestamp>  → { title, pillar, hook, notes, createdAt }
-- =====================================================================

create table if not exists public.marketing_state (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.marketing_state enable row level security;

-- Solo el fundador (platform admin) lee y escribe. No hay datos de
-- clientes aquí, pero el contenido es interno de la operación.
drop policy if exists mkst_sel on public.marketing_state;
create policy mkst_sel on public.marketing_state
  for select using (public.is_platform_admin());

drop policy if exists mkst_ins on public.marketing_state;
create policy mkst_ins on public.marketing_state
  for insert with check (public.is_platform_admin());

drop policy if exists mkst_upd on public.marketing_state;
create policy mkst_upd on public.marketing_state
  for update using (public.is_platform_admin());

drop policy if exists mkst_del on public.marketing_state;
create policy mkst_del on public.marketing_state
  for delete using (public.is_platform_admin());
