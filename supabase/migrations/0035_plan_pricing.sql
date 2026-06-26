-- =====================================================================
-- ZENTRO — Migración 0035 — Precios y nombres de planes (alineados a la landing)
-- SOLO DESCRIPTIVO: todavía NO se aplica enforcement por plan ni cobro.
-- Precios en unidades menores de USD (1200 = $12.00).
-- Investigación de precio (LatAm/España): un plan de entrada accesible (~$12)
-- y uno de crecimiento (~$29) están en línea con la disposición a pagar de
-- micro-negocios de la región (referencias del segmento: Alegra, Bind, Holded),
-- por debajo de un ERP y por encima de "gratis para siempre".
-- Aplicar manualmente cuando el PAT de Supabase esté disponible.
-- =====================================================================

update public.plans set name = 'Gratis', monthly_price_minor = 0,
  notes = E'1 usuario · 1 empresa · clientes, productos, ventas, cotizaciones y facturas · Centro de Prioridades · importar desde Excel'
  where id = 'free';

update public.plans set name = 'Pro', monthly_price_minor = 1200,
  notes = E'Todo lo de Gratis · cobranza con recordatorios · compras, inventario y rentabilidad real · flujo de caja y KPIs · proyectos y tareas · hasta 3 usuarios'
  where id = 'basic';

update public.plans set name = 'Negocio', monthly_price_minor = 2900,
  notes = E'Todo lo de Pro · multiempresa · hasta 10 usuarios · reportes avanzados · roles y permisos · soporte prioritario'
  where id = 'pro';

update public.plans set name = 'Empresarial', monthly_price_minor = 0,
  notes = E'Usuarios ilimitados · personalización · soporte dedicado · precio a medida'
  where id = 'enterprise';
