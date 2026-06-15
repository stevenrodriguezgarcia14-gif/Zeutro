-- =====================================================================
-- ZENTRO — Migración 0008 — Costeo de productos + foto
-- cost_sheets: una hoja de costo por producto (rinde + márgenes objetivo).
-- cost_components: ingredientes, mano de obra y otros costos.
-- products.image_url: foto del producto. Bucket 'products' en Storage.
-- =====================================================================

-- Foto de producto
alter table public.products add column if not exists image_url text;

-- Tipo de componente de costo
do $$ begin
  create type public.cost_component_type as enum ('material','labor','other');
exception when duplicate_object then null; end $$;

-- Hoja de costo (1 por producto)
create table if not exists public.cost_sheets (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  product_id        uuid not null references public.products(id) on delete cascade,
  output_qty        numeric(14,3) not null default 1 check (output_qty > 0),
  margin_min_bps    int not null default 2500,   -- 25%
  margin_target_bps int not null default 4500,   -- 45%
  margin_max_bps    int not null default 6500,   -- 65%
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  unique (product_id)
);
create index if not exists idx_cost_sheets_org on public.cost_sheets(organization_id);

-- Componentes de costo
create table if not exists public.cost_components (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  cost_sheet_id    uuid not null references public.cost_sheets(id) on delete cascade,
  type             public.cost_component_type not null default 'material',
  name             text not null,
  quantity         numeric(14,3) not null default 1 check (quantity > 0),
  unit_cost_minor  bigint not null default 0 check (unit_cost_minor >= 0),
  line_total_minor bigint generated always as ((round(quantity * unit_cost_minor))::bigint) stored,
  created_at       timestamptz not null default now()
);
create index if not exists idx_cost_components_sheet on public.cost_components(cost_sheet_id);

-- updated_at en cost_sheets
drop trigger if exists trg_cost_sheets_updated on public.cost_sheets;
create trigger trg_cost_sheets_updated before update on public.cost_sheets
  for each row execute function public.set_updated_at();

-- RLS estándar por organización
do $$
declare t text;
begin
  foreach t in array array['cost_sheets','cost_components'] loop
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

-- Bucket de Storage para fotos de productos
insert into storage.buckets (id, name, public) values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "products_public_read" on storage.objects;
create policy "products_public_read" on storage.objects for select using (bucket_id = 'products');
drop policy if exists "products_auth_insert" on storage.objects;
create policy "products_auth_insert" on storage.objects for insert to authenticated with check (bucket_id = 'products');
drop policy if exists "products_auth_update" on storage.objects;
create policy "products_auth_update" on storage.objects for update to authenticated using (bucket_id = 'products') with check (bucket_id = 'products');
drop policy if exists "products_auth_delete" on storage.objects;
create policy "products_auth_delete" on storage.objects for delete to authenticated using (bucket_id = 'products');
