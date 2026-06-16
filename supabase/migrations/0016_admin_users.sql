-- =====================================================================
-- ZENTRO — Migración 0016 — Admin: listado de usuarios
-- =====================================================================

create or replace function public.admin_list_users()
returns table (id uuid, email text, created_at timestamptz, last_sign_in timestamptz, orgs bigint, is_admin boolean)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at,
      (select count(*) from public.memberships m where m.user_id = u.id),
      exists(select 1 from public.platform_admins p where p.user_id = u.id)
    from auth.users u
    order by u.created_at desc;
end;
$$;
grant execute on function public.admin_list_users() to authenticated;
