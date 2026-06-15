-- =====================================================================
-- ZENTRO — Migración 0011 — Equipo: invitaciones y roles
-- Invitar personas por correo; al registrarse/entrar con ese correo se unen.
-- =====================================================================

create table if not exists public.invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           text not null,
  role            public.membership_role not null default 'member',
  status          text not null default 'pending',  -- pending | accepted
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  unique (organization_id, email)
);
create index if not exists idx_invitations_email on public.invitations(lower(email));

-- ¿El usuario actual es dueño/admin de la organización?
create or replace function public.is_org_admin(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where organization_id = p_org and user_id = auth.uid() and role in ('owner','admin')
  );
$$;

-- Rol del usuario en su organización actual
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role::text from public.memberships where user_id = auth.uid() order by created_at limit 1;
$$;

-- Acepta invitaciones pendientes que coincidan con el correo del usuario actual
create or replace function public.accept_pending_invitations()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  inv record;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then return; end if;

  for inv in
    select * from public.invitations
    where status = 'pending' and lower(email) = lower(v_email)
  loop
    insert into public.memberships (organization_id, user_id, role)
    values (inv.organization_id, auth.uid(), inv.role)
    on conflict (organization_id, user_id) do nothing;
    update public.invitations set status = 'accepted' where id = inv.id;
  end loop;
end;
$$;

-- Lista de miembros de una organización (con correo)
create or replace function public.list_org_members(p_org uuid)
returns table (user_id uuid, email text, role public.membership_role)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from public.memberships where organization_id = p_org and user_id = auth.uid()) then
    return;
  end if;
  return query
    select m.user_id, u.email::text, m.role
    from public.memberships m
    join auth.users u on u.id = m.user_id
    where m.organization_id = p_org
    order by m.created_at;
end;
$$;

grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.accept_pending_invitations() to authenticated;
grant execute on function public.list_org_members(uuid) to authenticated;

-- RLS invitaciones
alter table public.invitations enable row level security;
drop policy if exists inv_sel on public.invitations;
create policy inv_sel on public.invitations for select
  using (organization_id in (select public.current_user_orgs()));
drop policy if exists inv_ins on public.invitations;
create policy inv_ins on public.invitations for insert
  with check (public.is_org_admin(organization_id));
drop policy if exists inv_upd on public.invitations;
create policy inv_upd on public.invitations for update
  using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
drop policy if exists inv_del on public.invitations;
create policy inv_del on public.invitations for delete
  using (public.is_org_admin(organization_id));

-- Gestión de miembros: solo admin puede cambiar rol o quitar
drop policy if exists mem_update on public.memberships;
create policy mem_update on public.memberships for update
  using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id));
drop policy if exists mem_delete on public.memberships;
create policy mem_delete on public.memberships for delete
  using (public.is_org_admin(organization_id) or user_id = auth.uid());
