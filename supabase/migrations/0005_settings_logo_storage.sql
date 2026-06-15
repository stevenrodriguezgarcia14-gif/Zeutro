-- =====================================================================
-- ZENTRO — Migración 0005 — Configuración: borrado de organización + logos
-- 1) Política RLS para que un miembro pueda borrar su organización.
-- 2) Bucket de Storage público "logos" + políticas.
-- =====================================================================

-- 1) Permitir borrar organización a sus miembros
drop policy if exists org_delete on public.organizations;
create policy org_delete on public.organizations for delete
  using (id in (select public.current_user_orgs()));

-- 2) Bucket público para logos
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Políticas de Storage para el bucket 'logos'
drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "logos_auth_insert" on storage.objects;
create policy "logos_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'logos');

drop policy if exists "logos_auth_update" on storage.objects;
create policy "logos_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'logos') with check (bucket_id = 'logos');

drop policy if exists "logos_auth_delete" on storage.objects;
create policy "logos_auth_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'logos');
