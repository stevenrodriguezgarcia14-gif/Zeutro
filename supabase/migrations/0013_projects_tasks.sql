-- =====================================================================
-- ZENTRO — Migración 0013 — Proyectos y Tareas (Fase 3)
-- =====================================================================

do $$ begin
  create type public.project_status as enum ('planning','active','on_hold','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum ('todo','in_progress','done','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_priority as enum ('low','medium','high','urgent');
exception when duplicate_object then null; end $$;

create table if not exists public.projects (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  name                text not null,
  customer_id         uuid references public.customers(id),
  status              public.project_status not null default 'active',
  start_date          date,
  end_date            date,
  budget_amount_minor bigint,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id)
);
create index if not exists idx_projects_org on public.projects(organization_id, status);

create table if not exists public.tasks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title           text not null,
  description     text,
  status          public.task_status not null default 'todo',
  priority        public.task_priority not null default 'medium',
  due_date        date,
  project_id      uuid references public.projects(id) on delete set null,
  customer_id     uuid references public.customers(id) on delete set null,
  assignee_id     uuid references auth.users(id),
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);
create index if not exists idx_tasks_org on public.tasks(organization_id, status, due_date);
create index if not exists idx_tasks_project on public.tasks(project_id);

do $$
declare t text;
begin
  foreach t in array array['projects','tasks'] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s for each row execute function public.set_updated_at();', t);
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %1$s_sel on public.%1$s;', t);
    execute format('create policy %1$s_sel on public.%1$s for select using (organization_id in (select public.current_user_orgs()));', t);
    execute format('drop policy if exists %1$s_ins on public.%1$s;', t);
    execute format('create policy %1$s_ins on public.%1$s for insert with check (organization_id in (select public.current_user_orgs()));', t);
    execute format('drop policy if exists %1$s_upd on public.%1$s;', t);
    execute format('create policy %1$s_upd on public.%1$s for update using (organization_id in (select public.current_user_orgs())) with check (organization_id in (select public.current_user_orgs()));', t);
    execute format('drop policy if exists %1$s_del on public.%1$s;', t);
    execute format('create policy %1$s_del on public.%1$s for delete using (organization_id in (select public.current_user_orgs()));', t);
  end loop;
end $$;
