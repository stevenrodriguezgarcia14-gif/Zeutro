-- =====================================================================
-- ZENTRO -- Migracion 0020 -- Nombres y beneficios de los planes
-- Corrige acentos (mojibake) y describe los beneficios de cada plan.
-- Se usan escapes Unicode (E'\u00xx') para evitar problemas de codificacion
-- en cualquier cliente. IMPORTANTE: esto es SOLO descriptivo; todavia no se
-- aplica ninguna restriccion por plan (enforcement pendiente para cobrar).
-- =====================================================================

update public.plans set name = 'Gratis',
  notes = E'1 usuario · 1 empresa · clientes, productos y facturas básicas · sin recordatorios automáticos'
  where id = 'free';

update public.plans set name = E'Básico', monthly_price_minor = 1200,
  notes = E'Hasta 3 usuarios · recordatorios de cobranza por correo · cotizaciones · reportes básicos'
  where id = 'basic';

update public.plans set name = 'Profesional', monthly_price_minor = 3900,
  notes = E'Hasta 10 usuarios · multiempresa · inventario y compras · rentabilidad y costeo · todos los módulos'
  where id = 'pro';

update public.plans set name = 'Empresarial', monthly_price_minor = 0,
  notes = E'Usuarios ilimitados · soporte prioritario · personalización · precio a medida'
  where id = 'enterprise';
