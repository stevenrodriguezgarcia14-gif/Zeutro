-- =====================================================================
-- ZENTRO -- Migracion 0025 -- Academia 2.0 (Fase A): progreso de aprendizaje
-- El progreso es de la PERSONA (user_id), no de la organizacion.
-- Guarda: guias leidas y desafios de escenario aprobados.
-- Las "acciones reales" NO se guardan aqui: se calculan en vivo con
-- getActivation() para no duplicar la verdad.
-- =====================================================================

create table if not exists public.academy_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,            -- 'guide' | 'challenge'
  item_slug  text not null,
  status     text not null default 'done',  -- 'done' | 'passed'
  score      int,
  created_at timestamptz not null default now(),
  unique (user_id, kind, item_slug)
);
create index if not exists idx_academy_progress_user on public.academy_progress(user_id);

alter table public.academy_progress enable row level security;

drop policy if exists academy_sel on public.academy_progress;
create policy academy_sel on public.academy_progress for select using (user_id = auth.uid());

drop policy if exists academy_ins on public.academy_progress;
create policy academy_ins on public.academy_progress for insert with check (user_id = auth.uid());

drop policy if exists academy_upd on public.academy_progress;
create policy academy_upd on public.academy_progress for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists academy_del on public.academy_progress;
create policy academy_del on public.academy_progress for delete using (user_id = auth.uid());
