"use client";

import { useState } from "react";
import Link from "next/link";
import { ACHIEVEMENTS, CERTIFICATIONS } from "@/lib/academia";
import { Emblem, TIER_LABEL } from "@/components/academy/Emblem";
import { Credential } from "@/components/academy/Credential";

export default function AdminAcademyPreview() {
  const [key, setKey] = useState(0);
  const [unlocked, setUnlocked] = useState(true);
  const [earned, setEarned] = useState(true);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-slate-400 hover:text-slate-200">← Plataforma</Link>
          <h1 className="mt-1 text-2xl font-bold text-white">Academia · previsualización visual</h1>
          <p className="text-sm text-slate-400">Revisa logros y credenciales en todos sus estados, sin completar rutas.</p>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setKey((k) => k + 1)} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">↻ Reproducir animación</button>
        <button onClick={() => setUnlocked((v) => !v)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
          Logros: {unlocked ? "desbloqueados" : "bloqueados"}
        </button>
        <button onClick={() => setEarned((v) => !v)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
          Credencial: {earned ? "obtenida" : "vista previa"}
        </button>
      </div>

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
              level={cert.level} category={cert.category} date="16 de junio de 2026" serial="A1B2C3D4E5"
              earned={earned} animate tier={cert.tier} accent={cert.accent} />
          ))}
        </div>
      </section>
    </div>
  );
}
