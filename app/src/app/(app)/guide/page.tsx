import Link from "next/link";
import { getCurrentOrg } from "@/lib/org";
import { getActivation } from "@/lib/activation";
import { MODULES, type ModuleInfo } from "@/lib/guide";
import { CATEGORIES } from "@/lib/academia";

function ModuleCard({ m, badge }: { m: ModuleInfo; badge?: string }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white p-4 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <span className="flex items-center gap-2 font-medium text-slate-900">
          <span className="text-lg">{m.emoji}</span> {m.name}
          {badge && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{badge}</span>}
        </span>
        <span className="text-slate-400 group-open:rotate-180 transition-transform">⌄</span>
      </summary>
      <div className="mt-3 space-y-2 text-sm">
        <p className="text-slate-600">{m.queEs}</p>
        <p><span className="font-medium text-slate-700">Cuándo usarlo:</span> <span className="text-slate-600">{m.cuando}</span></p>
        <p><span className="font-medium text-slate-700">Cuándo NO:</span> <span className="text-slate-600">{m.cuandoNo}</span></p>
        <p><span className="font-medium text-red-700">Error común:</span> <span className="text-slate-600">{m.errores}</span></p>
        <p><span className="font-medium text-slate-700">Se conecta con:</span> <span className="text-slate-600">{m.relacion}</span></p>
        <Link href={m.href} className="mt-1 inline-block rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
          Abrir {m.name} →
        </Link>
      </div>
    </details>
  );
}

export default async function GuidePage() {
  const org = await getCurrentOrg();
  const { profile, steps, doneCount, total, pct, suggestions } = await getActivation(org?.business_type);

  const priority = profile.priority.map((s) => MODULES[s]);
  const others = [...profile.recommended, ...profile.optional].map((s) => MODULES[s]);

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Centro de Orientación</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tu guía personalizada para sacarle provecho a Zentro paso a paso.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm">
          <span className="text-lg">{profile.emoji}</span>
          <span className="font-medium text-slate-800">Perfil: {profile.label}</span>
          <Link href="/settings" className="text-slate-400 hover:text-slate-700">cambiar</Link>
        </div>
      </div>

      {!org?.business_type && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Aún no nos dijiste qué tipo de negocio tienes</p>
          <p className="mt-0.5 text-sm text-amber-800">Elígelo y Zentro te mostrará primero lo que más te sirve y una ruta hecha para ti.</p>
          <Link href="/settings" className="mt-2 inline-block rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">
            Elegir mi tipo de negocio →
          </Link>
        </div>
      )}

      {/* Siguiente paso */}
      {suggestions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Tu siguiente paso</h2>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {suggestions.slice(0, 4).map((s, i) => (
              <Link key={i} href={s.href}
                className={`flex items-center justify-between rounded-2xl border p-4 hover:shadow-sm ${s.tone === "alert" ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
                <div>
                  <p className="font-medium text-slate-900">{s.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{s.desc}</p>
                </div>
                <span className="ml-3 shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">{s.cta}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Checklist / ruta de activación */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Tu ruta para empezar ({pct}%)</h2>
          <span className="text-xs text-slate-500">{doneCount} de {total}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <ol className="mt-4 space-y-2">
          {steps.map(({ step, done }, i) => {
            const isNext = !done && steps.slice(0, i).every((s) => s.done);
            return (
              <li key={step.key} className={`flex items-center justify-between rounded-xl border p-3 ${done ? "border-emerald-200 bg-emerald-50" : isNext ? "border-slate-300 bg-white" : "border-slate-200 bg-white"}`}>
                <span className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={`text-sm ${done ? "text-slate-500 line-through" : "text-slate-800"}`}>{step.label}</span>
                </span>
                {!done && (
                  <Link href={step.href} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${isNext ? "bg-slate-900 text-white hover:bg-slate-800" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                    {step.cta}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
        {pct === 100 && (
          <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">🎉 ¡Completaste tu ruta de arranque! Ya dominas lo esencial de Zentro para tu negocio.</p>
        )}
      </section>

      {/* Módulos para tu negocio */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Módulos clave para tu negocio</h2>
        <p className="mt-1 text-xs text-slate-400">Lo más importante para un {profile.label.toLowerCase()}. Abre cada uno para ver cuándo usarlo (y cuándo no).</p>
        <div className="mt-2 space-y-2">
          {priority.map((m) => <ModuleCard key={m.slug} m={m} badge="Clave para ti" />)}
        </div>
      </section>

      {/* Otros módulos */}
      <section>
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600">
            Explorar los demás módulos <span className="group-open:rotate-180 inline-block transition-transform">⌄</span>
          </summary>
          <div className="mt-2 space-y-2">
            {others.map((m) => <ModuleCard key={m.slug} m={m} />)}
          </div>
        </details>
      </section>

      {/* Zentro en el bolsillo */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Lleva Zentro en tu bolsillo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Instala Zentro en tu teléfono como una app: se abre con un toque, sin buscarla en el navegador.
          Perfecta para anotar ventas y gastos en el momento.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">En Android (Chrome)</p>
            <p className="mt-1 text-xs text-slate-600">Abre zentro en Chrome → menú <b>⋮</b> → <b>«Agregar a pantalla de inicio»</b> (o «Instalar app»).</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">En iPhone (Safari)</p>
            <p className="mt-1 text-xs text-slate-600">Abre zentro en Safari → botón <b>Compartir</b> → <b>«Agregar a inicio»</b>.</p>
          </div>
        </div>
      </section>

      {/* Academia */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Academia Zentro</h2>
          <Link href="/academy" className="text-xs font-medium text-slate-500 hover:text-slate-800">Ver todas →</Link>
        </div>
        <p className="mt-1 text-xs text-slate-400">Guías cortas para aprender a manejar tu negocio. Léelas en minutos.</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((a) => (
            <Link key={a.slug} href="/academy" className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm">
              <p className="text-2xl">{a.emoji}</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{a.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{a.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
