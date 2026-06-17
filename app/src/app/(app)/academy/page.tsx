import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { getActivation } from "@/lib/activation";
import { CATEGORIES, lessonsByCategory, type Lesson, type Challenge } from "@/lib/academia";
import { MODULES } from "@/lib/guide";
import type { ActivationData } from "@/lib/guide";
import { ChallengeBlock, type ClientChallenge } from "@/components/ChallengeBlock";
import { markGuideRead } from "./actions";

function renderBody(body: string[]) {
  const out: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (key: string) => {
    if (bullets.length) {
      out.push(<ul key={key} className="ml-4 list-disc space-y-1 text-slate-600">{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>);
      bullets = [];
    }
  };
  body.forEach((line, i) => {
    if (line.startsWith("- ")) bullets.push(line.slice(2));
    else if (line.startsWith("## ")) { flush(`u${i}`); out.push(<h4 key={i} className="pt-1 text-sm font-semibold text-slate-800">{line.slice(3)}</h4>); }
    else { flush(`u${i}`); out.push(<p key={i} className="text-slate-600">{line}</p>); }
  });
  flush("ulast");
  return out;
}

// Convierte un Challenge (con funciones) en algo serializable + estado "done".
function toClient(c: Challenge, passed: Set<string>, d: ActivationData): ClientChallenge {
  return {
    id: c.id, type: c.type, difficulty: c.difficulty, prompt: c.prompt,
    options: c.options, explanation: c.explanation, cta: c.cta, href: c.href,
    done: c.type === "scenario" ? passed.has(c.id) : !!c.check?.(d),
  };
}

// Cuenta items de una lección (1 por la guía + sus desafíos) y cuántos completados.
function lessonProgress(l: Lesson, read: Set<string>, passed: Set<string>, d: ActivationData) {
  let total = 1, done = read.has(l.slug) ? 1 : 0;
  for (const c of l.challenges ?? []) {
    total++;
    if (c.type === "scenario" ? passed.has(c.id) : !!c.check?.(d)) done++;
  }
  return { total, done };
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500">{pct}%</span>
    </div>
  );
}

export default async function AcademyPage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();
  const [{ data: progress }, act] = await Promise.all([
    supabase.from("academy_progress").select("kind, item_slug, status"),
    getActivation(org?.business_type),
  ]);
  const read = new Set((progress ?? []).filter((p) => p.kind === "guide").map((p) => p.item_slug));
  const passed = new Set((progress ?? []).filter((p) => p.kind === "challenge").map((p) => p.item_slug));
  const d = act.data;

  // Progreso global
  let gTotal = 0, gDone = 0;
  for (const cat of CATEGORIES) for (const l of lessonsByCategory(cat.slug)) {
    const p = lessonProgress(l, read, passed, d); gTotal += p.total; gDone += p.done;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/guide" className="text-sm text-slate-500 hover:text-slate-800">← Centro de Orientación</Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Academia Zentro</h1>
            <p className="mt-1 text-sm text-slate-500">Aprende, ponlo a prueba y aplícalo en tu negocio.</p>
          </div>
          <Link href="/academy/perfil" className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Mi aprendizaje →
          </Link>
        </div>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Tu progreso de aprendizaje</p>
            <span className="text-xs text-slate-500">{gDone} de {gTotal}</span>
          </div>
          <div className="mt-2"><ProgressBar done={gDone} total={gTotal} /></div>
        </div>
      </div>

      {CATEGORIES.map((cat) => {
        const lessons = lessonsByCategory(cat.slug);
        if (lessons.length === 0) return null;
        let cT = 0, cD = 0;
        lessons.forEach((l) => { const p = lessonProgress(l, read, passed, d); cT += p.total; cD += p.done; });
        return (
          <section key={cat.slug}>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><span>{cat.emoji}</span> {cat.title}</h2>
            <p className="text-sm text-slate-500">{cat.desc}</p>
            <div className="mt-2 max-w-xs"><ProgressBar done={cD} total={cT} /></div>
            <div className="mt-3 space-y-2">
              {lessons.map((l) => {
                const rel = l.related ? MODULES[l.related] : null;
                const isRead = read.has(l.slug);
                const clientCh = (l.challenges ?? []).map((c) => toClient(c, passed, d));
                return (
                  <details key={l.slug} className="group rounded-xl border border-slate-200 bg-white">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{l.emoji}</span>
                        <span>
                          <span className="block text-sm font-medium text-slate-900">
                            {l.title} {isRead && <span className="text-emerald-600">✓</span>}
                          </span>
                          <span className="block text-xs text-slate-500">{l.resumen} · {l.minutes} min{l.challenges?.length ? ` · ${l.challenges.length} desafío(s)` : ""}</span>
                        </span>
                      </span>
                      <span className="text-slate-400 transition-transform group-open:rotate-180">⌄</span>
                    </summary>
                    <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm leading-relaxed">
                      {renderBody(l.body)}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {rel && <Link href={rel.href} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">Ir a {rel.name} {rel.emoji}</Link>}
                        {!isRead ? (
                          <form action={markGuideRead.bind(null, l.slug)}>
                            <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Marcar como leída</button>
                          </form>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600">✓ Leída</span>
                        )}
                      </div>
                      <ChallengeBlock challenges={clientCh} />
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
