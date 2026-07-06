"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { setActiveOrg } from "@/app/(app)/org-actions";

/** Acciones de registro más frecuentes: 1 toque desde cualquier pantalla. */
const quickActions: { href: string; name: string; hint: string }[] = [
  { href: "/quick-sale", name: "Venta rápida", hint: "Anota una venta de contado" },
  { href: "/expenses/new", name: "Gasto", hint: "Registra una salida de dinero" },
  { href: "/invoices/new", name: "Factura", hint: "Cobra a un cliente con fecha límite" },
  { href: "/customers/new", name: "Cliente", hint: "Agrega un cliente nuevo" },
];

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5",
  today: "M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  collect: "M3 8h18v10H3zM3 11h18M7 15h4",
  menu: "M4 6h16M4 12h16M4 18h16",
  plus: "M12 5v14M5 12h14",
} as const;

const groups: { label: string; items: { href: string; name: string }[] }[] = [
  {
    label: "Inicio",
    items: [
      { href: "/dashboard", name: "Dashboard" },
      { href: "/guide", name: "Centro de Orientación" },
      { href: "/academy", name: "Academia" },
      { href: "/priorities", name: "Centro de Prioridades" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { href: "/customers", name: "Clientes" },
      { href: "/sales", name: "Ventas (Embudo)" },
      { href: "/quotations", name: "Cotizaciones" },
      { href: "/products", name: "Productos y servicios" },
      { href: "/purchases", name: "Compras (reventa)" },
      { href: "/inventory", name: "Inventario" },
    ],
  },
  {
    label: "Dinero",
    items: [
      { href: "/quick-sale", name: "Venta rápida" },
      { href: "/invoices", name: "Facturas" },
      { href: "/collections", name: "Cobranzas" },
      { href: "/expenses", name: "Gastos" },
      { href: "/accounts", name: "Cuentas" },
      { href: "/cashflow", name: "Flujo de caja" },
      { href: "/profitability", name: "Rentabilidad" },
    ],
  },
  {
    label: "Operación",
    items: [
      { href: "/tasks", name: "Tareas" },
      { href: "/projects", name: "Proyectos" },
      { href: "/calendar", name: "Calendario" },
      { href: "/documents", name: "Documentos" },
    ],
  },
  { label: "Cuenta", items: [{ href: "/settings", name: "Configuración" }] },
];

export function AppShell({
  orgName,
  orgs,
  activeId,
  isPlatformAdmin,
  priorityHrefs = [],
  children,
}: {
  orgName: string;
  orgs: { id: string; name: string }[];
  activeId: string;
  isPlatformAdmin?: boolean;
  priorityHrefs?: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const close = () => setOpen(false);
  const closeAll = () => {
    setOpen(false);
    setQuickOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barra superior (solo móvil) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-1 text-slate-700 hover:bg-slate-100"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="font-bold text-slate-900">Zentro</span>
        <span className="w-7" />
      </header>

      {/* Capa oscura al abrir el menú en móvil */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={close} />}

      <div className="md:flex">
        {/* Barra lateral */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-slate-200 bg-white transition-transform md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="min-w-0">
              <p className="text-lg font-bold text-slate-900">Zentro</p>
              {orgs.length > 1 ? (
                <form action={setActiveOrg} className="mt-1">
                  <select
                    name="org_id"
                    defaultValue={activeId}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="w-full max-w-[11rem] truncate rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-slate-700 outline-none focus:border-slate-900"
                    title="Cambiar de empresa"
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </form>
              ) : (
                <p className="truncate text-sm text-slate-500">{orgName}</p>
              )}
            </div>
            <button
              onClick={close}
              aria-label="Cerrar menú"
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            {/* Registro en 1 clic: las acciones que se hacen todos los días */}
            <div className="mb-4 hidden md:block">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Registrar</p>
              <div className="grid grid-cols-2 gap-1.5 px-1">
                {quickActions.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    title={a.hint}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    + {a.name}
                  </Link>
                ))}
              </div>
            </div>
            {groups.map((g) => (
              <div key={g.label} className="mb-4">
                <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{g.label}</p>
                {g.items.map((it) => {
                  const active = pathname === it.href || pathname.startsWith(it.href + "/");
                  const isPriority = priorityHrefs.includes(it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={close}
                      className={`flex items-center justify-between rounded-lg px-2 py-2 text-sm ${
                        active ? "bg-slate-900 font-medium text-white" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{it.name}</span>
                      {isPriority && !active && <span className="text-amber-500" title="Clave para tu negocio">★</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
            {isPlatformAdmin && (
              <div className="mb-4">
                <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Plataforma</p>
                <Link href="/admin" onClick={close} className="block rounded-lg bg-slate-900 px-2 py-2 text-sm font-medium text-white hover:bg-slate-800">
                  Administración
                </Link>
              </div>
            )}
          </nav>

          <form action={signOut} className="border-t border-slate-200 p-3">
            <button type="submit" className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-100">
              Cerrar sesión
            </button>
          </form>
        </aside>

        {/* Contenido */}
        <main className="min-w-0 flex-1 pb-24 md:pb-0">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Hoja de registro rápido (móvil) */}
      {quickOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setQuickOpen(false)} />
          <div className="fixed inset-x-3 bottom-24 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:hidden">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Registrar</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {quickActions.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  onClick={closeAll}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-emerald-50"
                >
                  <span className="block text-sm font-semibold text-slate-900">+ {a.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{a.hint}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Barra inferior (móvil): lo diario a un toque */}
      <nav
        aria-label="Navegación rápida"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {[
          { href: "/dashboard", name: "Inicio", icon: ICONS.home },
          { href: "/priorities", name: "Hoy", icon: ICONS.today },
        ].map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={closeAll}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${
                active ? "font-semibold text-emerald-700" : "text-slate-500"
              }`}
            >
              <Icon d={it.icon} />
              {it.name}
            </Link>
          );
        })}
        <button
          onClick={() => {
            setOpen(false);
            setQuickOpen((v) => !v);
          }}
          aria-label="Registrar venta, gasto, factura o cliente"
          className="flex flex-col items-center justify-center"
        >
          <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
            <Icon d={ICONS.plus} className={`transition-transform ${quickOpen ? "rotate-45" : ""}`} />
          </span>
          <span className="mt-0.5 text-[10px] text-slate-500">Registrar</span>
        </button>
        {(() => {
          const active = pathname === "/collections" || pathname.startsWith("/collections/");
          return (
            <Link
              href="/collections"
              onClick={closeAll}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${
                active ? "font-semibold text-emerald-700" : "text-slate-500"
              }`}
            >
              <Icon d={ICONS.collect} />
              Cobrar
            </Link>
          );
        })()}
        <button
          onClick={() => {
            setQuickOpen(false);
            setOpen(true);
          }}
          aria-label="Abrir menú completo"
          className="flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] text-slate-500"
        >
          <Icon d={ICONS.menu} />
          Menú
        </button>
      </nav>
    </div>
  );
}
