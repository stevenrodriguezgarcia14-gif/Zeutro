"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  IconBook, IconBox, IconBulb, IconCalendar, IconChart, IconCheckSquare,
  IconDots, IconFilm, IconHome, IconSparkle, IconX,
} from "./icons";

const NAV = [
  { href: "/marketing-os", label: "Hoy", icon: IconHome, group: "Operación" },
  { href: "/marketing-os/calendario", label: "Calendario", icon: IconCalendar, group: "Operación" },
  { href: "/marketing-os/videos", label: "Videos", icon: IconFilm, group: "Operación" },
  { href: "/marketing-os/ideas", label: "Ideas", icon: IconBulb, group: "Operación" },
  { href: "/marketing-os/recursos", label: "Recursos", icon: IconBox, group: "Apoyo" },
  { href: "/marketing-os/checklists", label: "Checklists", icon: IconCheckSquare, group: "Apoyo" },
  { href: "/marketing-os/manual", label: "Manual", icon: IconBook, group: "Apoyo" },
  { href: "/marketing-os/analitica", label: "Analítica", icon: IconChart, group: "Medición" },
  { href: "/marketing-os/ia", label: "Asistente IA", icon: IconSparkle, group: "Medición" },
];

function isActive(pathname: string, href: string) {
  if (href === "/marketing-os") return pathname === href;
  if (href === "/marketing-os/videos") return pathname.startsWith("/marketing-os/videos");
  return pathname === href || pathname.startsWith(href + "/");
}

/** Sidebar de escritorio (≥lg). */
export function Sidebar() {
  const pathname = usePathname();
  const groups = ["Operación", "Apoyo", "Medición"];
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/[0.06] bg-black/30 backdrop-blur-xl lg:flex">
      <Link href="/marketing-os" className="flex items-center gap-2.5 px-5 pt-6 pb-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#00C781] font-display text-lg font-bold text-black">Z</span>
        <span>
          <span className="block font-display text-sm font-bold tracking-tight text-white">Marketing OS</span>
          <span className="block text-[11px] text-zinc-500">Usuarios Fundadores</span>
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g} className="mt-4">
            <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">{g}</p>
            <div className="space-y-0.5">
              {NAV.filter((n) => n.group === g).map((n) => {
                const active = isActive(pathname, n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors duration-150 ${
                      active
                        ? "bg-[#00C781]/12 font-semibold text-[#3ee6a8]"
                        : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
                    }`}
                  >
                    <n.icon className={`h-[18px] w-[18px] ${active ? "" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                    {n.label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#00C781]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/[0.06] p-4">
        <Link href="/admin" className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">← Panel admin</Link>
      </div>
    </aside>
  );
}

/** Barra inferior móvil (4 destinos + Más). */
export function BottomNav() {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const main = NAV.slice(0, 4);
  const rest = NAV.slice(4);
  const moreActive = rest.some((n) => isActive(pathname, n.href));

  return (
    <>
      {more && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMore(false)}>
          <div
            className="absolute inset-x-3 bottom-20 rounded-2xl border border-white/10 bg-zinc-950 p-3 shadow-2xl"
            style={{ animation: "mkos-up .18s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-zinc-400">Más módulos</p>
              <button onClick={() => setMore(false)} aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-white/5">
                <IconX className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {rest.map((n) => {
                const active = isActive(pathname, n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMore(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs transition-colors ${
                      active ? "bg-[#00C781]/12 text-[#3ee6a8]" : "text-zinc-400 hover:bg-white/[0.05]"
                    }`}
                  >
                    <n.icon className="h-5 w-5" />
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.07] bg-black/70 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5">
          {main.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link key={n.href} href={n.href} className="flex min-h-14 flex-col items-center justify-center gap-0.5">
                <n.icon className={`h-5 w-5 ${active ? "text-[#3ee6a8]" : "text-zinc-500"}`} />
                <span className={`text-[10px] ${active ? "font-semibold text-[#3ee6a8]" : "text-zinc-500"}`}>{n.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setMore(true)} className="flex min-h-14 flex-col items-center justify-center gap-0.5" aria-label="Más módulos">
            <IconDots className={`h-5 w-5 ${moreActive ? "text-[#3ee6a8]" : "text-zinc-500"}`} />
            <span className={`text-[10px] ${moreActive ? "font-semibold text-[#3ee6a8]" : "text-zinc-500"}`}>Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}
