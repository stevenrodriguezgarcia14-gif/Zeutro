-- =====================================================================
-- ZENTRO — Migración 0009 — Ventas (embudo de oportunidades)
-- Pipeline + etapas + oportunidades. Una oportunidad puede tener cliente
-- o ser un prospecto (sin cliente todavía).
-- =====================================================================

create table if not exists public.pipelines (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null default 'Ventas',
  is_default      boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists idx_pipelines_org on public.pipelines(organization_id);

create table if not exists public.stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pipeline_id     uuid not null references public.pipelines(id) on delete cascade,
  name            text not null,
  position        int not null default 0,
  probability_bps int not null default 0,   -- 5000 = 50%
  is_won          boolean not null default false,
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists idx_stages_pipeline on public.stages(pipeline_id, position);

do $$ begin
  create type public.opportunity_status as enum ('open','won','lost');
exception when duplicate_object then null; end $$;

create table if not exists public.opportunities (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  title               text not null,
  customer_id         uuid references public.customers(id),
  prospect_name       text,
  prospect_contact    text,
  pipeline_id         uuid not null references public.pipelines(id) on delete cascade,
  stage_id            uuid not null references public.stages(id),
  amount_minor        bigint not null default 0 check (amount_minor >= 0),
  expected_close_date date,
  source              text,
  status              public.opportunity_status not null default 'open',
  lost_reason         text,
  owner_user_id       uuid references auth.users(id),
  notes               text,
  stage_entered_at    timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id)
);
create index if not exists idx_opps_org on public.opportunities(organization_id);
create index if not exists idx_opps_stage on public.opportunities(organization_id, stage_id);

drop trigger if exists trg_opps_updated on public.opportunities;
create trigger trg_opps_updated before update on public.opportunities
  for each row execute function public.set_updated_at();

-- RLS
do $$
declare t text;
begin
  foreach t in array array['pipelines','stages','opportunities'] loop
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

-- Crea (si no existe) un pipeline por defecto con etapas estándar y devuelve su id
create or replace function public.ensure_default_pipeline()
returns uuid
language plpgsql
security definer set search_path = public as $$
declare
  v_org uuid;
  v_pipe uuid;
begin
  select organization_id into v_org from public.memberships where user_id = auth.uid() limit 1;
  if v_org is null then raise exception 'Sin organización'; end if;

  select id into v_pipe from public.pipelines where organization_id = v_org order by created_at limit 1;
  if v_pipe is not null then return v_pipe; end if;

  insert into public.pipelines(organization_id, name) values (v_org, 'Ventas') returning id into v_pipe;
  insert into public.stages(organization_id, pipeline_id, name, position, probability_bps, is_won, is_lost) values
    (v_org, v_pipe, 'Prospecto',   1, 1000, false, false),
    (v_org, v_pipe, 'Calificado',  2, 2500, false, false),
    (v_org, v_pipe, 'Propuesta',   3, 5000, false, false),
    (v_org, v_pipe, 'Negociación', 4, 7500, false, false),
    (v_org, v_pipe, 'Ganada',      5, 10000, true,  false),
    (v_org, v_pipe, 'Perdida',     6, 0,     false, true);
  return v_pipe;
end;
$$;
grant execute on function public.ensure_default_pipeline() to authenticated;
