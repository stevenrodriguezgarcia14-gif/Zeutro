-- =====================================================================
-- ZENTRO — Migración 0018 — Endurecimiento de seguridad
-- A1: memberships INSERT solo por admin de la org (el alta normal va por
--     funciones SECURITY DEFINER que saltan RLS, así que esto no rompe nada).
-- A2: bucket privado 'documents' restringido por carpeta = organization_id.
-- M1: bucket 'logos' escritura/borrado restringido por carpeta = org.
-- Convención de ruta: '<organization_id>/<archivo>' (primer folder = org).
-- =====================================================================

-- ---- A1: cerrar auto-inscripción a organizaciones ajenas ----
drop policy if exists mem_insert on public.memberships;
create policy mem_insert on public.memberships for insert
  with check (public.is_org_admin(organization_id));

-- ---- A2: documentos privados por organización ----
drop policy if exists "documents_rw" on storage.objects;

drop policy if exists "documents_sel" on storage.objects;
create policy "documents_sel" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and exists (
    select 1 from public.current_user_orgs() org
    where org::text = (storage.foldername(name))[1]));

drop policy if exists "documents_ins" on storage.objects;
create policy "documents_ins" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and exists (
    select 1 from public.current_user_orgs() org
    where org::text = (storage.foldername(name))[1]));

drop policy if exists "documents_upd" on storage.objects;
create policy "documents_upd" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and exists (
    select 1 from public.current_user_orgs() org
    where org::text = (storage.foldername(name))[1]))
  with check (bucket_id = 'documents' and exists (
    select 1 from public.current_user_orgs() org
    where org::text = (storage.foldername(name))[1]));

drop policy if exists "documents_del" on storage.objects;
create policy "documents_del" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and exists (
    select 1 from public.current_user_orgs() org
    where org::text = (storage.foldername(name))[1]));

-- ---- M1: logos (lectura pública, escritura por organización) ----
drop policy if exists "logos_auth_insert" on storage.objects;
create policy "logos_auth_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and exists (
    select 1 from public.current_user_orgs() org
    where org::text = (storage.foldername(name))[1]));

drop policy if exists "logos_auth_update" on storage.objects;
create policy "logos_auth_update" on storage.objects for update to authenticated
  using (bucket_id = 'logos' and exists (
    select 1 from public.current_user_orgs() org
    where org::text = (storage.foldername(name))[1]))
  with check (bucket_id = 'logos' and exists (
    select 1 from public.current_user_orgs() org
    where org::text = (storage.foldername(name))[1]));

drop policy if exists "logos_auth_delete" on storage.objects;
create policy "logos_auth_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and exists (
    select 1 from public.current_user_orgs() org
    where org::text = (storage.foldername(name))[1]));
