"use client";

import { useState } from "react";
import Link from "next/link";
import { ACHIEVEMENTS, CERTIFICATIONS } from "@/lib/academia";
import { Emblem, TIER_LABEL } from "@/components/academy/Emblem";
import { Credential } from "@/components/academy/Credential";
import { UnlockCelebration, type UnlockItem } from "@/components/academy/UnlockCelebration";
import { CredentialReveal } from "@/components/academy/CredentialReveal";

export default function AdminAcademyPreview() {
  const [key, setKey] = useState(0);
  const [unlocked, setUnlocked] = useState(true);
  const [earned, setEarned] = useState(true);
  const [demo, setDemo] = useState<UnlockItem[] | null>(null);
  const [revealIdx, setRevealIdx] = useState<number | null>(null);
  const [certIdx, setCertIdx] = useState(4); // credencial seleccionada para el reveal
  const [pct, setPct] = useState(50); // preview de progreso "Tu aprendizaje"
  const [showCapstone, setShowCapstone] = useState(false);

  const toItem = (a: typeof ACHIEVEMENTS[number]): UnlockItem => ({ slug: a.slug, title: a.title, desc: a.desc, tier: a.tier, glyph: a.glyph });
  const generalCerts = CERTIFICATIONS.filter((c) => c.capstone && c.capstone.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-slate-400 hover:text-slate-200">← Plataforma</Link>
          <h1 className="mt-1 text-2xl font-bold text-white">Academia · laboratorio de pruebas</h1>
          <p className="text-sm text-slate-400">Vive y revisa toda la experiencia (animaciones, desbloqueos, estados) sin completar rutas ni escribir en la base de datos.</p>
        </div>
      </div>

      {/* Controles de animación / estados */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estados y animaciones</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => setKey((k) => k + 1)} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">↻ Reproducir animación</button>
          <button onClick={() => setUnlocked((v) => !v)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
            Logros: {unlocked ? "desbloqueados" : "bloqueados"}
          </button>
          <button onClick={() => setEarned((v) => !v)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
            Credencial: {earned ? "obtenida" : "vista previa"}
          </button>
        </div>
      </div>

      {/* Simuladores de desbloqueo */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Momentos de desbloqueo</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => setDemo([toItem(ACHIEVEMENTS[1]), toItem(ACHIEVEMENTS[6])])} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600">
            ▶ Simular logro (cola de 2)
          </button>
          <button onClick={() => setDemo(ACHIEVEMENTS.map(toItem))} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600">
            ▶ Simular TODOS los logros ({ACHIEVEMENTS.length})
          </button>
          <div className="flex items-center gap-2">
            <select
              value={certIdx}
              onChange={(e) => setCertIdx(Number(e.target.value))}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-200"
            >
              {CERTIFICATIONS.map((c, i) => (
                <option key={c.slug} value={i}>{c.title} ({TIER_LABEL(c.tier)})</option>
              ))}
            </select>
            <button onClick={() => setRevealIdx(certIdx)} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600">
              ▶ Simular obtención de esta credencial
            </button>
          </div>
        </div>
      </div>

      {/* Preview del "Tu aprendizaje" del dashboard a distintos % */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tarjeta &quot;Tu aprendizaje&quot; (dashboard)</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[0, 25, 50, 75, 100].map((p) => (
            <button key={p} onClick={() => setPct(p)} className={`rounded-lg border px-3 py-2 text-sm ${pct === p ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-slate-700 text-slate-200 hover:bg-slate-800"}`}>{p}%</button>
          ))}
        </div>
        <div className="mt-3 max-w-md rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Academia Zentro</p>
              <p className="text-xs text-slate-500">{Math.round((pct / 100) * 14)}/14 desafíos · {Math.round((pct / 100) * 5)}/5 rutas · {pct >= 100 ? 7 : Math.floor((pct / 100) * 7)} credencial(es)</p>
            </div>
            <span className="shrink-0 text-sm font-medium text-emerald-600">{pct}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Visor del examen final (capstone) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Examen final (capstone) de las credenciales generales</p>
          <button onClick={() => setShowCapstone((v) => !v)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800">
            {showCapstone ? "Ocultar" : "Mostrar preguntas"}
          </button>
        </div>
        {showCapstone && (
          <div className="mt-3 space-y-4">
            {generalCerts.map((c) => (
              <div key={c.slug} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm font-semibold text-white">{c.title} · {c.capstone!.length} preguntas · umbral {c.minScorePct}%</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-300">
                  {c.capstone!.map((q) => (
                    <li key={q.id}>
                      <p>{q.prompt}</p>
                      <ul className="mt-1 space-y-0.5">
                        {(q.options ?? []).map((o, i) => (
                          <li key={i} className={o.correct ? "text-emerald-400" : "text-slate-400"}>
                            {o.correct ? "✓ " : "• "}{o.text}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>

      {demo && <UnlockCelebration items={demo} onDone={() => setDemo(null)} />}
      {revealIdx !== null && CERTIFICATIONS[revealIdx] && (
        <CredentialReveal
          title={CERTIFICATIONS[revealIdx].title} holder="Mi Negocio S.A."
          level={CERTIFICATIONS[revealIdx].level} category={CERTIFICATIONS[revealIdx].category}
          date="18 de junio de 2026" serial="A1B2C3D4E5"
          tier={CERTIFICATIONS[revealIdx].tier} accent={CERTIFICATIONS[revealIdx].accent}
          onClose={() => setRevealIdx(null)} />
      )}

      {/* Logros */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Logros ({ACHIEVEMENTS.length})</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.slug} className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center">
              <Emblem key={`${a.slug}-${key}-${unlocked}`} tier={a.tier} glyph={a.glyph} unlocked={unlocked} size={80} animateIn />
              <p className="mt-3 text-sm font-semibold text-white">{a.title}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-300/80">{TIER_LABEL(a.tier)}</p>
              <p className="mt-1 text-xs text-slate-400">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Niveles */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Niveles (acabados)</h2>
        <div className="mt-3 flex flex-wrap gap-6">
          {(["bronce", "plata", "oro", "platino"] as const).map((t) => (
            <div key={t} className="flex flex-col items-center">
              <Emblem key={`${t}-${key}`} tier={t} glyph="shield" unlocked size={72} animateIn />
              <p className="mt-2 text-xs font-medium text-slate-300">{TIER_LABEL(t)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Credenciales */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Credenciales ({CERTIFICATIONS.length})</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {CERTIFICATIONS.map((cert) => (
            <Credential key={`cred-${cert.slug}-${key}-${earned}`} title={cert.title} holder="Mi Negocio S.A."
              level={cert.level} category={cert.category} date="18 de junio de 2026" serial="A1B2C3D4E5"
              earned={earned} animate tier={cert.tier} accent={cert.accent} />
          ))}
        </div>
      </section>
    </div>
  );
}
