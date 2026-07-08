"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/marketing", label: "Panel", icon: "◉" },
  { href: "/admin/marketing/calendario", label: "Calendario", icon: "▦" },
  { href: "/admin/marketing/biblioteca", label: "Biblioteca", icon: "▤" },
  { href: "/admin/marketing/ideas", label: "Ideas", icon: "✦" },
  { href: "/admin/marketing/recursos", label: "Recursos", icon: "◫" },
  { href: "/admin/marketing/checklists", label: "Checklists", icon: "☑" },
  { href: "/admin/marketing/analitica", label: "Analítica", icon: "↗" },
  { href: "/admin/marketing/manual", label: "Manual", icon: "✎" },
  { href: "/admin/marketing/ia", label: "IA", icon: "✧" },
];

export function MarketingNav() {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="Módulos del Marketing OS">
      {TABS.map((t) => {
        const active =
          t.href === "/admin/marketing"
            ? pathname === t.href
            : pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-[#00C781]/15 font-semibold text-[#2fe3a5]"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <span aria-hidden className="text-xs">{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Filtros de la Biblioteca / Banco de ideas: escribe ?params en la URL sin recargar. */
export function FilterSelect({
  name,
  value,
  options,
  label,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-400">
      {label}
      <select
        name={name}
        defaultValue={value}
        onChange={(e) => {
          const url = new URL(window.location.href);
          if (e.target.value) url.searchParams.set(name, e.target.value);
          else url.searchParams.delete(name);
          window.location.href = url.toString();
        }}
        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Buscador del glosario del Manual (filtra en el cliente). */
export function GlossarySearch({
  entries,
}: {
  entries: { term: string; meaning: string; how: string }[];
}) {
  return (
    <div>
      <input
        type="search"
        placeholder="Busca un término (ej. gancho, plano, keyframe...)"
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-[#00C781]"
        onInput={(e) => {
          const q = (e.target as HTMLInputElement).value.toLowerCase();
          document.querySelectorAll<HTMLElement>("[data-glossary-term]").forEach((el) => {
            const hit = !q || (el.dataset.glossaryText ?? "").includes(q);
            el.style.display = hit ? "" : "none";
          });
        }}
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {entries.map((g) => (
          <div
            key={g.term}
            data-glossary-term
            data-glossary-text={`${g.term} ${g.meaning} ${g.how}`.toLowerCase()}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4"
          >
            <p className="text-sm font-semibold text-white">{g.term}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{g.meaning}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#2fe3a5]">
              <span className="font-semibold">Cómo:</span> {g.how}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
