-- =====================================================================
-- ZENTRO — Migración 0015 — Panel de Administración: estado, planes, auditoría
-- =====================================================================

alter table public.organizations add column if not exists status text not null default 'active'; -- active | suspended
alter table public.organizations add column if not exists plan text not null default 'free';

create table if not exists public.plans (
  id                 text primary key,   -- free | basic | pro | enterprise
  name               text not null,
  monthly_price_minor bigint not null default 0,
  notes              text
);
insert into public.plans (id, name, monthly_price_minor, notes) values
  ('free','Gratis',0,'1 usuario, lo básico'),
  ('basic','Básico',1200,'3 usuarios, recordatorios'),
  ('pro','Profesional',3900,'10 usuarios, todo'),
  ('enterprise','Empresarial',0,'Personalizado')
on conflict (id) do nothing;
-- plans visible para usuarios autenticados (catálogo)
alter table public.plans enable row level security;
drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select to authenticated using (true);

create table if not exists public.admin_audit (
  id         uuid primary key default gen_random_uuid(),
  actor      uuid references auth.users(id),
  action     text not null,
  target_org uuid,
  detail     jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security; -- sin políticas: solo accesible vía RPC SECURITY DEFINER

-- Overview con activos/suspendidos
create or replace function public.admin_overview()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;
  return json_build_object(
    'users', (select count(*) from auth.users),
    'orgs', (select count(*) from public.organizations),
    'orgs_active', (select count(*) from public.organizations where status = 'active'),
    'orgs_suspended', (select count(*) from public.organizations where status = 'suspended'),
    'new_orgs_7d', (select count(*) from public.organizations where created_at > now() - interval '7 days'),
    'new_users_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'invoices', (select count(*) from public.invoices),
    'customers', (select count(*) from public.customers),
    'memberships', (select count(*) from public.memberships)
  );
end;
$$;

-- Lista de empresas con estado y plan
drop function if exists public.admin_list_orgs();
create or replace function public.admin_list_orgs()
returns table (id uuid, name text, country text, base_currency char(3), status text, plan text, created_at timestamptz, members bigint, invoices bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;
  return query
    select o.id, o.name, o.country, o.base_currency, o.status, o.plan, o.created_at,
      (select count(*) from public.memberships m where m.organization_id = o.id),
      (select count(*) from public.invoices i where i.organization_id = o.id)
    from public.organizations o
    order by o.created_at desc;
end;
$$;

create or replace function public.admin_set_org_status(p_org uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;
  if p_status not in ('active','suspended') then raise exception 'Estado inválido'; end if;
  update public.organizations set status = p_status where id = p_org;
  insert into public.admin_audit(actor, action, target_org, detail) values (auth.uid(), 'set_status', p_org, json_build_object('status', p_status));
end;
$$;

create or replace function public.admin_set_org_plan(p_org uuid, p_plan text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;
  update public.organizations set plan = p_plan where id = p_org;
  insert into public.admin_audit(actor, action, target_org, detail) values (auth.uid(), 'set_plan', p_org, json_build_object('plan', p_plan));
end;
$$;

create or replace function public.admin_delete_org(p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;
  insert into public.admin_audit(actor, action, target_org, detail) values (auth.uid(), 'delete_org', p_org, null);
  delete from public.organizations where id = p_org;
end;
$$;

create or replace function public.admin_recent_audit()
returns table (action text, target_org uuid, detail jsonb, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;
  return query select a.action, a.target_org, a.detail, a.created_at from public.admin_audit a order by a.created_at desc limit 50;
end;
$$;

grant execute on function public.admin_set_org_status(uuid, text) to authenticated;
grant execute on function public.admin_set_org_plan(uuid, text) to authenticated;
grant execute on function public.admin_delete_org(uuid) to authenticated;
grant execute on function public.admin_recent_audit() to authenticated;
