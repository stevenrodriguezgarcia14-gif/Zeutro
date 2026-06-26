import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { getActivation } from "@/lib/activation";
import {
  ROUTES, ACHIEVEMENTS, CERTIFICATIONS, learnSummary, routeLessons, routeComplete, certRequirements,
} from "@/lib/academia";
import type { ActivationData } from "@/lib/guide";
import { Emblem } from "@/components/academy/Emblem";
import { TIER_LABEL } from "@/components/academy/tiers";
import { Credential } from "@/components/academy/Credential";
import { AcademyNotifier } from "@/components/academy/AcademyNotifier";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function routeStats(catLessons: ReturnType<typeof routeLessons>, passed: Set<string>, d: ActivationData) {
  let total = 0, done = 0;
  for (const l of catLessons) {
    for (const c of l.challenges ?? []) { total++; if (c.type === "scenario" ? passed.has(c.id) : !!c.check?.(d)) done++; }
  }
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export default async function AcademyProfilePage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: progress }, act] = await Promise.all([
    supabase.from("academy_progress").select("kind, item_slug, id, created_at"),
    getActivation(org?.business_type),
  ]);
  const passed = new Set((progress ?? []).filter((p) => p.kind === "challenge").map((p) => p.item_slug));
  const earned = new Set((progress ?? []).filter((p) => p.kind === "certification").map((p) => p.item_slug));
  const d = act.data;
  const s = learnSummary(passed, d, earned.size);
  const celebrated = new Set((progress ?? []).filter((p) => p.kind === "celebrated").map((p) => p.item_slug));
  const newUnlocks = ACHIEVEMENTS.filter((a) => a.unlocked(s) && !celebrated.has(a.slug))
    .map((a) => ({ slug: a.slug, title: a.title, desc: a.desc, tier: a.tier, glyph: a.glyph }));
  const holder = org?.legal_name || org?.name || "Tu negocio";
  const certInfo = new Map<string, { serial: string; date: string }>();
  for (const p of (progress ?? []).filter((p) => p.kind === "certification")) {
    certInfo.set(p.item_slug, {
      serial: String(p.id).replace(/-/g, "").slice(0, 10).toUpperCase(),
      date: new Date(p.created_at as string).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }),
    });
  }

  return (
    <div className="space-y-8">
      <AcademyNotifier unlocks={newUnlocks} />
      <div>
        <Link href="/academy" className="text-sm text-slate-500 hover:text-slate-800">← Academia</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Mi aprendizaje</h1>
        <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Desafíos aprobados" value={`${s.scenariosPassed}/${s.scenariosTotal}`} sub="comprensión" />
        <Stat label="Acciones reales" value={`${s.actionsDone}/${s.actionsTotal}`} sub="aplicadas en tu negocio" />
        <Stat label="Rutas completadas" value={`${s.routesComplete}/${s.routesTotal}`} />
        <Stat label="Credenciales" value={`${earned.size}/${CERTIFICATIONS.length}`} />
      </div>

      {/* Logros — vitrina */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Vitrina de logros ({ACHIEVEMENTS.filter((a) => a.unlocked(s)).length}/{ACHIEVEMENTS.length})</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const on = a.unlocked(s);
            return (
              <div key={a.slug}
                className={`group flex flex-col items-center rounded-2xl border p-5 text-center transition ${on ? "border-slate-200 bg-white shadow-sm" : "border-slate-200/70 bg-slate-50"}`}>
                <Emblem tier={a.tier} glyph={a.glyph} unlocked={on} size={76} animateIn={on} />
                <p className={`mt-3 text-sm font-semibold ${on ? "text-slate-900" : "text-slate-400"}`}>{a.title}</p>
                <p className={`text-[11px] font-medium uppercase tracking-wide ${on ? "text-slate-400" : "text-slate-300"}`}>{TIER_LABEL(a.tier)}</p>
                <p className={`mt-1 text-xs ${on ? "text-slate-500" : "text-slate-400"}`}>{a.desc}</p>
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
            const st = routeStats(routeLessons(r), passed, d);
            const complete = routeComplete(r, passed, d);
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

      {/* Credenciales — vitrina aparte (formato diploma) */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Credenciales ({earned.size}/{CERTIFICATIONS.length})</h2>
        <p className="mt-1 text-xs text-slate-400">Tus credenciales profesionales. Cada una se gana demostrando que sabes y que lo aplicas.</p>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {CERTIFICATIONS.map((c) => {
            const isEarned = earned.has(c.slug);
            const info = certInfo.get(c.slug);
            const { reqs, eligible } = certRequirements(c, passed, d, earned);
            const reqMet = reqs.filter((r) => r.met).length;
            return (
              <Link key={c.slug} href={`/academy/certificacion/${c.slug}`} className="group block transition hover:-translate-y-0.5">
                <Credential title={c.title} holder={holder} level={c.level} category={c.category}
                  date={info?.date} serial={info?.serial} earned={isEarned} tier={c.tier} accent={c.accent} />
                <p className={`mt-1.5 text-center text-xs font-medium ${isEarned ? "text-amber-600" : eligible ? "text-emerald-600" : "text-slate-400"}`}>
                  {isEarned ? "Obtenida ✓" : eligible ? "¡Lista para obtener! →" : `Cómo obtenerla: ${reqMet}/${reqs.length} requisitos →`}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
