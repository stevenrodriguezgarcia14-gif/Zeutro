"use client";

// Credencial premium de certificación. Lenguaje visual propio (distinto a los logros).
// Refleja el NIVEL con el acabado metálico (tier) y la IDENTIDAD del área con un acento de color.
import { useId } from "react";
import type { Tier } from "@/components/academy/Emblem";

const METAL: Record<Tier, { frame: string; a: string; b: string }> = {
  bronce: { frame: "linear-gradient(135deg,#b87333,#e8b384,#8c5a2b)", a: "#8c5a2b", b: "#e8b384" },
  plata: { frame: "linear-gradient(135deg,#aab2bd,#f1f5f9,#8a929c)", a: "#8a929c", b: "#f1f5f9" },
  oro: { frame: "linear-gradient(135deg,#caa84a,#fff1bd,#b8860b)", a: "#b8860b", b: "#fff1bd" },
  platino: { frame: "linear-gradient(135deg,#9fb3c8,#f8fafc,#7c93a8)", a: "#7c93a8", b: "#f8fafc" },
};

function Seal({ earned, tier, accent }: { earned: boolean; tier: Tier; accent: string }) {
  const uid = useId().replace(/:/g, "");
  const faceId = `sf-${uid}`, rimId = `sr-${uid}`;
  const m = METAL[tier];
  const rimA = earned ? m.a : "#94a3b8";
  const rimB = earned ? m.b : "#cbd5e1";
  const mono = earned ? accent : "#94a3b8";
  const teeth = Array.from({ length: 24 });
  return (
    <svg width="92" height="92" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id={faceId} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor={earned ? "#1a2029" : "#eef2f6"} />
          <stop offset="100%" stopColor={earned ? "#0a0e13" : "#d8e0e8"} />
        </radialGradient>
        <linearGradient id={rimId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={rimB} /><stop offset="50%" stopColor={rimA} /><stop offset="100%" stopColor={rimB} />
        </linearGradient>
      </defs>
      {teeth.map((_, i) => (
        <rect key={i} x="48.5" y="2" width="3" height="11" rx="1.5" fill={`url(#${rimId})`} transform={`rotate(${(360 / teeth.length) * i} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="40" fill={`url(#${rimId})`} />
      <circle cx="50" cy="50" r="34" fill={`url(#${faceId})`} />
      <circle cx="50" cy="50" r="34" fill="none" stroke={rimB} strokeWidth="0.8" opacity="0.5" />
      <path d="M38 40h24l-22 20h24" fill="none" stroke={mono} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Guilloche({ accent }: { accent: string }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none" viewBox="0 0 400 240">
      <g stroke={accent} fill="none">
        {/* familias de círculos finos (efecto torno/seguridad) */}
        <g strokeWidth="0.35" opacity="0.12">
          {Array.from({ length: 26 }).map((_, i) => <circle key={i} cx="320" cy="120" r={6 + i * 7.5} />)}
        </g>
        <g strokeWidth="0.3" opacity="0.09">
          {Array.from({ length: 30 }).map((_, i) => <circle key={`b${i}`} cx="70" cy="120" r={5 + i * 6.5} />)}
        </g>
        {/* ondas entrelazadas */}
        <g strokeWidth="0.3" opacity="0.07">
          {Array.from({ length: 16 }).map((_, i) => <ellipse key={`e${i}`} cx="200" cy="120" rx={40 + i * 11} ry={18 + i * 6} />)}
        </g>
      </g>
    </svg>
  );
}

export function Credential({
  title, holder, level, category, date, serial, earned, animate, tier = "oro", accent = "#e9c45a",
}: {
  title: string; holder: string; level: string; category: string;
  date?: string; serial?: string; earned: boolean; animate?: boolean;
  tier?: Tier; accent?: string;
}) {
  const frame = earned ? METAL[tier].frame : "linear-gradient(135deg,#cbd5e1,#f1f5f9,#94a3b8)";
  const accentText = earned ? accent : "#94a3b8";
  return (
    <div className={`relative rounded-2xl p-[2px] ${animate ? "zentro-credential-in" : ""}`} style={{ background: frame }}>
      {earned && <span className="zentro-foil absolute inset-0 rounded-2xl" />}
      <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-[#0c1219] to-[#080b10] p-6 text-white">
        <span className="absolute left-0 top-0 h-full w-[3px]" style={{ background: accentText }} aria-hidden />
        <Guilloche accent={accent} />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: accentText }}>Credencial · Zentro Academy</p>
            <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 6" /></svg>
              {earned ? "Verificada" : "Vista previa"}
            </span>
          </div>

          <div className="mt-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: accentText }}>{level} · {category}</p>
              <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-white">{title}</h2>
              <p className="mt-3 text-xs uppercase tracking-wider text-slate-400">Otorgada a</p>
              <p className="truncate text-lg font-semibold text-slate-100">{holder}</p>
            </div>
            <div className="shrink-0"><Seal earned={earned} tier={tier} accent={accent} /></div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/10 pt-4 text-xs sm:grid-cols-4">
            <div><p className="text-slate-500">Nivel</p><p className="font-medium text-slate-200">{level}</p></div>
            <div><p className="text-slate-500">Categoría</p><p className="font-medium text-slate-200">{category}</p></div>
            <div><p className="text-slate-500">Fecha</p><p className="font-medium text-slate-200">{date ?? "—"}</p></div>
            <div><p className="text-slate-500">Folio</p><p className="font-mono font-medium text-slate-200">{serial ?? "—"}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
