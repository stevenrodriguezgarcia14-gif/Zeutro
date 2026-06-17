// Credencial premium de certificación (lenguaje visual propio, distinto a los logros).
// Sin emojis: sello y patrón de seguridad en SVG.

function Seal({ earned }: { earned: boolean }) {
  const gold = earned ? "#e9c45a" : "#cbd5e1";
  const goldD = earned ? "#a9791a" : "#94a3b8";
  const teeth = Array.from({ length: 24 });
  return (
    <svg width="92" height="92" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <radialGradient id="sealFace" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor={earned ? "#1a2029" : "#eef2f6"} />
          <stop offset="100%" stopColor={earned ? "#0a0e13" : "#d8e0e8"} />
        </radialGradient>
        <linearGradient id="sealRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gold} />
          <stop offset="50%" stopColor={goldD} />
          <stop offset="100%" stopColor={gold} />
        </linearGradient>
      </defs>
      {/* dientes de roseta */}
      {teeth.map((_, i) => (
        <rect key={i} x="48.5" y="2" width="3" height="11" rx="1.5" fill="url(#sealRim)"
          transform={`rotate(${(360 / teeth.length) * i} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="40" fill="url(#sealRim)" />
      <circle cx="50" cy="50" r="34" fill="url(#sealFace)" />
      <circle cx="50" cy="50" r="34" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.5" />
      {/* monograma Z */}
      <path d="M38 40h24l-22 20h24" fill="none" stroke={gold} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Guilloche() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none" viewBox="0 0 400 240">
      <g stroke="#e9c45a" strokeWidth="0.4" fill="none" opacity="0.10">
        {Array.from({ length: 14 }).map((_, i) => (
          <circle key={i} cx="200" cy="120" r={14 + i * 13} />
        ))}
        {Array.from({ length: 14 }).map((_, i) => (
          <circle key={`b${i}`} cx="70" cy="120" r={8 + i * 9} />
        ))}
      </g>
    </svg>
  );
}

export function Credential({
  title, holder, level, category, date, serial, earned, animate,
}: {
  title: string; holder: string; level: string; category: string;
  date?: string; serial?: string; earned: boolean; animate?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl p-[2px] ${animate ? "zentro-credential-in" : ""}`}
      style={{ background: earned ? "linear-gradient(135deg,#caa84a,#fff1bd,#b8860b,#fff1bd,#caa84a)" : "linear-gradient(135deg,#cbd5e1,#f1f5f9,#94a3b8)" }}>
      {earned && <span className="zentro-foil absolute inset-0 rounded-2xl" />}
      <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-[#0c1219] to-[#080b10] p-6 text-white">
        <Guilloche />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/80">Credencial · Zentro Academy</p>
            <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 6" /></svg>
              {earned ? "Verificada" : "Vista previa"}
            </span>
          </div>

          <div className="mt-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-bold leading-tight text-white">{title}</h2>
              <p className="mt-3 text-xs uppercase tracking-wider text-slate-400">Otorgada a</p>
              <p className="truncate text-lg font-semibold text-amber-100">{holder}</p>
            </div>
            <div className="shrink-0">
              <Seal earned={earned} />
            </div>
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
