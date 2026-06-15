"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";

const groups: { label: string; items: { href: string; name: string; soon?: boolean }[] }[] = [
  {
    label: "Inicio",
    items: [{ href: "/dashboard", name: "Dashboard" }],
  },
  {
    label: "Comercial",
    items: [
      { href: "/customers", name: "Clientes" },
      { href: "/products", name: "Productos y servicios" },
    ],
  },
  {
    label: "Dinero",
    items: [
      { href: "/invoices", name: "Facturas" },
      { href: "/collections", name: "Cobranzas" },
      { href: "/expenses", name: "Gastos" },
      { href: "/accounts", name: "Cuentas" },
    ],
  },
  {
    label: "Cuenta",
    items: [{ href: "/settings", name: "Configuración" }],
  },
];

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <p className="text-lg font-bold text-slate-900">Zentro</p>
        <p className="truncate text-sm text-slate-500">{orgName}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {groups.map((g) => (
          <div key={g.label} className="mb-4">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {g.label}
            </p>
            {g.items.map((it) => {
              const active = pathname === it.href || pathname.startsWith(it.href + "/");
              if (it.soon) {
                return (
                  <span
                    key={it.href}
                    className="flex cursor-not-allowed items-center justify-between rounded-lg px-2 py-2 text-sm text-slate-400"
                  >
                    {it.name}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">pronto</span>
                  </span>
                );
              }
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`block rounded-lg px-2 py-2 text-sm ${
                    active
                      ? "bg-slate-900 font-medium text-white"
                      : "text-slate-700 hover:bg-slate-100"
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
        <button
          type="submit"
          className="w-full rounded-lg px-2 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
        >
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
