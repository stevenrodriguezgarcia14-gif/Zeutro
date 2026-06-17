import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { getActivation } from "@/lib/activation";
import {
  ROUTES, ACHIEVEMENTS, CERTIFICATIONS, learnSummary, routeLessons, routeComplete, certRequirements,
} from "@/lib/academia";
import type { ActivationData } from "@/lib/guide";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function routeStats(catLessons: ReturnType<typeof routeLessons>, read: Set<string>, passed: Set<string>, d: ActivationData) {
  let total = 0, done = 0;
  for (const l of catLessons) {
    total++; if (read.has(l.slug)) done++;
    for (const c of l.challenges ?? []) { total++; if (c.type === "scenario" ? passed.has(c.id) : !!c.check?.(d)) done++; }
  }
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export default async function AcademyProfilePage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: progress }, act] = await Promise.all([
    supabase.from("academy_progress").select("kind, item_slug"),
    getActivation(org?.business_type),
  ]);
  const read = new Set((progress ?? []).filter((p) => p.kind === "guide").map((p) => p.item_slug));
  const passed = new Set((progress ?? []).filter((p) => p.kind === "challenge").map((p) => p.item_slug));
  const earned = new Set((progress ?? []).filter((p) => p.kind === "certification").map((p) => p.item_slug));
  const d = act.data;
  const s = learnSummary(read, passed, d, earned.size);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/academy" className="text-sm text-slate-500 hover:text-slate-800">← Academia</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Mi aprendizaje</h1>
        <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Guías leídas" value={`${s.guidesRead}/${s.guidesTotal}`} />
        <Stat label="Desafíos aprobados" value={`${s.scenariosPassed}/${s.scenariosTotal}`} />
        <Stat label="Acciones reales" value={`${s.actionsDone}/${s.actionsTotal}`} sub="hechas en tu negocio" />
        <Stat label="Rutas completadas" value={`${s.routesComplete}/${s.routesTotal}`} />
      </div>

      {/* Logros */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Logros ({ACHIEVEMENTS.filter((a) => a.unlocked(s)).length}/{ACHIEVEMENTS.length})</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const on = a.unlocked(s);
            return (
              <div key={a.slug}
                className={`rounded-2xl border p-4 transition ${on ? "border-emerald-300 bg-white shadow-sm hover:scale-[1.02]" : "border-slate-200 bg-slate-50 opacity-60"}`}>
                <div className={`text-3xl ${on ? "" : "grayscale"}`}>{a.icon}</div>
                <p className="mt-1 text-sm font-semibold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-500">{a.desc}</p>
                {on
                  ? <p className="mt-1 text-xs font-medium text-emerald-600">Desbloqueado ✓</p>
                  : <p className="mt-1 text-xs text-slate-400">Bloqueado</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Rutas */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Rutas de aprendizaje</h2>
        <div className="mt-2 space-y-2">
          {ROUTES.map((r) => {
            const st = routeStats(routeLessons(r), read, passed, d);
            const complete = routeComplete(r, read, passed, d);
            return (
              <Link key={r.slug} href="/academy" className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{r.emoji} {r.title}</p>
                  <span className={`text-xs font-medium ${complete ? "text-emerald-600" : "text-slate-500"}`}>{complete ? "Completada ✓" : `${st.pct}%`}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${st.pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Certificaciones */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Certificaciones</h2>
        <div className="mt-2 space-y-2">
          {CERTIFICATIONS.map((c) => {
            const isEarned = earned.has(c.slug);
            const { eligible } = certRequirements(c, read, passed, d);
            return (
              <Link key={c.slug} href={`/academy/certificacion/${c.slug}`}
                className={`block rounded-2xl border p-4 hover:shadow-sm ${isEarned ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">🎓 {c.title}</p>
                    <p className="text-xs text-slate-500">{c.desc}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium ${isEarned ? "text-amber-700" : eligible ? "text-emerald-600" : "text-slate-400"}`}>
                    {isEarned ? "Obtenida ✓" : eligible ? "¡Lista para obtener!" : "En progreso"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
