# Zentro — Guía de arranque

Proyecto: **Zentro**, Sistema Operativo para Emprendedores.
Stack MVP: **Next.js + Supabase** (ver `DOCUMENTO_MAESTRO_PROYECTO.md`, ADR-011).

## Paso 1 — Crear la base de datos (NO requiere instalar nada)

1. Entra a tu proyecto en https://supabase.com → **SQL Editor**.
2. Abre `supabase/migrations/0001_fase1_core.sql` (en esta carpeta), copia TODO el contenido.
3. Pégalo en el SQL Editor y pulsa **Run**.
4. Verifica en **Table Editor** que aparecen las tablas: `organizations`, `memberships`,
   `customers`, `products`, `tax_rates`, `accounts`, `invoices`, `invoice_items`,
   `payments`, `payment_allocations`, `account_transactions`.

Esto crea el esquema multi-tenant con seguridad RLS (cada negocio solo ve sus datos).

## Paso 2 — Datos que necesito de ti (todos son públicos y seguros de compartir)

- **Project URL**: Supabase → Settings → Data API → `Project URL` (ej. `https://xxxx.supabase.co`).
- **Publishable key** (`sb_publishable_...`): ya la tengo. Es pública, va en el navegador.

> NUNCA compartas la `sb_secret_...` ni la contraseña de la base de datos.

## Paso 3 — Frontend Next.js (requiere instalar Node.js)

Pendiente: instalar Node.js + Git para poder crear y ejecutar la app web.
Cuando esté instalado, se hace:
- `npm create next-app` con TypeScript + Tailwind
- conexión a Supabase con la Project URL + publishable key (en `.env.local`)
- pantallas Fase 1: login, alta de organización, clientes, productos, facturas, pagos.

## Estructura prevista del repositorio

```
zentro/
  supabase/
    migrations/        <- SQL versionado (0001 ya creado)
  app/                 <- Next.js (pendiente)
  SETUP.md
```
