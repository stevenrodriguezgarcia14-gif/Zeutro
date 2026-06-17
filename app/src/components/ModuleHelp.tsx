import Link from "next/link";
import { MODULES, type ModuleSlug } from "@/lib/guide";

/**
 * Ayuda contextual dentro de un módulo. Banner colapsable que explica qué es,
 * cuándo usarlo (y cuándo no) sin sacar al usuario de la pantalla. Reutiliza el
 * catálogo de `lib/guide`. Colócalo arriba de cada página de módulo.
 */
export function ModuleHelp({ slug }: { slug: ModuleSlug }) {
  const m = MODULES[slug];
  if (!m) return null;
  return (
    <details className="group mb-4 rounded-xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm">
        <span className="font-medium text-slate-700">💡 ¿Cómo funciona {m.name}?</span>
        <span className="text-slate-400 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-1.5 border-t border-slate-100 px-4 py-3 text-sm">
        <p className="text-slate-600">{m.queEs}</p>
        <p><span className="font-medium text-slate-700">Úsalo cuando:</span> <span className="text-slate-600">{m.cuando}</span></p>
        <p><span className="font-medium text-slate-700">No es para:</span> <span className="text-slate-600">{m.cuandoNo}</span></p>
        <p><span className="font-medium text-red-700">Evita:</span> <span className="text-slate-600">{m.errores}</span></p>
        <Link href="/guide" className="inline-block pt-1 text-xs font-medium text-slate-500 hover:text-slate-800">
          Ver guía completa en el Centro de Orientación →
        </Link>
      </div>
    </details>
  );
}
