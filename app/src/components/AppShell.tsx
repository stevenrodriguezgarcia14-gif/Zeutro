"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { setActiveOrg } from "@/app/(app)/org-actions";

const groups: { label: string; items: { href: string; name: string }[] }[] = [
  {
    label: "Inicio",
    items: [
      { href: "/dashboard", name: "Dashboard" },
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
    ],
  },
  {
    label: "Dinero",
    items: [
      { href: "/invoices", name: "Facturas" },
      { href: "/collections", name: "Cobranzas" },
      { href: "/expenses", name: "Gastos" },
      { href: "/accounts", name: "Cuentas" },
      { href: "/cashflow", name: "Flujo de caja" },
      { href: "/profitability", name: "Rentabilidad" },
    ],
  },
  { label: "Cuenta", items: [{ href: "/settings", name: "Configuración" }] },
];

export function AppShell({
  orgName,
  orgs,
  activeId,
  children,
}: {
  orgName: string;
  orgs: { id: string; name: string }[];
  activeId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
            {groups.map((g) => (
              <div key={g.label} className="mb-4">
                <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{g.label}</p>
                {g.items.map((it) => {
                  const active = pathname === it.href || pathname.startsWith(it.href + "/");
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={close}
                      className={`block rounded-lg px-2 py-2 text-sm ${
                        active ? "bg-slate-900 font-medium text-white" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {it.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <form action={signOut} className="border-t border-slate-200 p-3">
            <button type="submit" className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-100">
              Cerrar sesión
            </button>
          </form>
        </aside>

        {/* Contenido */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
