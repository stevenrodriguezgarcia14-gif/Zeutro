# Zentro

**Sistema operativo para emprendedores** — unifica clientes, ventas, facturación, cobranza y
finanzas de un micronegocio en un solo lugar, y dice qué hacer cada día para cobrar y ganar más.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL con RLS multi-tenant, Auth, Storage)
- **Despliegue:** Vercel (web) + Supabase (datos)

## Estructura

```
zentro/
  app/                  Aplicación Next.js
  supabase/migrations/  Esquema de base de datos (SQL versionado)
  SETUP.md              Guía de configuración
  COMO-VER-LA-APP.md    Cómo correr la app en local
```

## Correr en local

```bash
cd app
npm install
# crea app/.env.local a partir de app/.env.example con tus claves de Supabase
npm run dev
# abre http://localhost:3000
```

## Base de datos

Aplica en orden las migraciones de `supabase/migrations/` en el SQL Editor de Supabase
(o con la CLI de Supabase). Incluyen el esquema multi-tenant con Row Level Security.

## Estado

MVP en construcción (Fase 1): autenticación, organizaciones, clientes, productos,
facturas, pagos y cobranzas. La visión completa del producto está documentada en
`DOCUMENTO_MAESTRO_PROYECTO.md`.
