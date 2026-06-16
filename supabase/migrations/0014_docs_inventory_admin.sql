-- =====================================================================
-- ZENTRO — Migración 0014 — Documentos, Inventario y Panel de Administración (base)
-- =====================================================================

-- ===================== DOCUMENTOS =====================
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  file_path       text not null,         -- ruta en el bucket 'documents'
  mime_type       text,
  size_bytes      bigint,
  entity_type     text,                  -- opcional: customer | invoice | project...
  entity_id       uuid,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);
create index if not exists idx_documents_org on public.documents(organization_id, created_at desc);

-- Bucket privado para documentos (se sirven con URL firmada temporal)
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "documents_rw" on storage.objects;
create policy "documents_rw" on storage.objects for all to authenticated
  using (bucket_id = 'documents') with check (bucket_id = 'documents');

-- ===================== INVENTARIO =====================
do $$ begin
  create type public.inv_reason as enum ('purchase','sale','adjustment','return','initial');
exception when duplicate_object then null; end $$;

create table if not exists public.inventory_movements (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  direction       public.txn_direction not null,  -- in | out
  qty             numeric(14,3) not null check (qty > 0),
  reason          public.inv_reason not null default 'adjustment',
  note            text,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);
create index if not exists idx_inv_mov_product on public.inventory_movements(product_id, created_at desc);

-- Ajuste de stock atómico (entra/sale) que registra el movimiento y actualiza products.stock_qty
create or replace function public.adjust_stock(
  p_product_id uuid, p_direction public.txn_direction, p_qty numeric,
  p_reason public.inv_reason default 'adjustment', p_note text default null
)
returns public.products language plpgsql as $$
declare v_prod public.products;
begin
  select * into v_prod from public.products where id = p_product_id;
  if not found then raise exception 'Producto no encontrado'; end if;
  if p_qty <= 0 then raise exception 'La cantidad debe ser mayor a 0'; end if;

  insert into public.inventory_movements(organization_id, product_id, direction, qty, reason, note)
  values (v_prod.organization_id, p_product_id, p_direction, p_qty, p_reason, p_note);

  update public.products
     set stock_qty = coalesce(stock_qty,0) + (case when p_direction='in' then p_qty else -p_qty end),
         track_inventory = true,
         updated_at = now()
   where id = p_product_id
  returning * into v_prod;
  return v_prod;
end;
$$;
grant execute on function public.adjust_stock(uuid, public.txn_direction, numeric, public.inv_reason, text) to authenticated;

-- RLS docs + inventario
do $$
declare t text;
begin
  foreach t in array array['documents','inventory_movements'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %1$s_sel on public.%1$s;', t);
    execute format('create policy %1$s_sel on public.%1$s for select using (organization_id in (select public.current_user_orgs()));', t);
    execute format('drop policy if exists %1$s_ins on public.%1$s;', t);
    execute format('create policy %1$s_ins on public.%1$s for insert with check (organization_id in (select public.current_user_orgs()));', t);
    execute format('drop policy if exists %1$s_del on public.%1$s;', t);
    execute format('create policy %1$s_del on public.%1$s for delete using (organization_id in (select public.current_user_orgs()));', t);
  end loop;
end $$;

-- ===================== PANEL DE ADMINISTRACIÓN (base) =====================
create table if not exists public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
drop policy if exists pa_self on public.platform_admins;
create policy pa_self on public.platform_admins for select using (user_id = auth.uid());

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

create or replace function public.admin_overview()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;
  return json_build_object(
    'users', (select count(*) from auth.users),
    'orgs', (select count(*) from public.organizations),
    'new_orgs_7d', (select count(*) from public.organizations where created_at > now() - interval '7 days'),
    'new_users_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'invoices', (select count(*) from public.invoices),
    'customers', (select count(*) from public.customers),
    'memberships', (select count(*) from public.memberships)
  );
end;
$$;

create or replace function public.admin_list_orgs()
returns table (id uuid, name text, country text, base_currency char(3), created_at timestamptz, members bigint, invoices bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'No autorizado'; end if;
  return query
    select o.id, o.name, o.country, o.base_currency, o.created_at,
      (select count(*) from public.memberships m where m.organization_id = o.id) as members,
      (select count(*) from public.invoices i where i.organization_id = o.id) as invoices
    from public.organizations o
    order by o.created_at desc;
end;
$$;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_list_orgs() to authenticated;
