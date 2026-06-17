"use client";

import { useState } from "react";
import { Emblem, TIER_LABEL, type Tier, type GlyphKey } from "@/components/academy/Emblem";
import { Confetti } from "@/components/Confetti";

export type UnlockItem = { slug: string; title: string; desc: string; tier: Tier; glyph: GlyphKey };

/** Modal de celebración con cola de logros. onDone se llama al cerrar el último. */
export function UnlockCelebration({ items, onDone }: { items: UnlockItem[]; onDone?: () => void }) {
  const [i, setI] = useState(0);
  if (items.length === 0) return null;
  const it = items[i];
  if (!it) return null;
  const big = it.tier === "platino" || it.tier === "oro";
  const glow: Record<string, string> = { bronce: "rgba(224,160,96,0.6)", plata: "rgba(226,232,240,0.55)", oro: "rgba(255,200,80,0.65)", platino: "rgba(150,200,250,0.65)" };
  const g = glow[it.tier];

  function next() {
    if (i < items.length - 1) setI(i + 1);
    else onDone?.();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      {big && <Confetti pieces={80} />}
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#10151c] to-[#080b10] p-8 text-center text-white shadow-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">Logro desbloqueado</p>
        <div className="relative mt-5 flex h-40 items-center justify-center">
          {/* Rayos de luz */}
          <div className="zentro-spin pointer-events-none absolute h-56 w-56 rounded-full"
            style={{ background: "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.12) 0deg 7deg, transparent 7deg 17deg)", WebkitMaskImage: "radial-gradient(closest-side, #000 38%, transparent 72%)", maskImage: "radial-gradient(closest-side, #000 38%, transparent 72%)" }} />
          {/* Halo de color */}
          <div className="zentro-halo pointer-events-none absolute h-44 w-44 rounded-full"
            style={{ background: `radial-gradient(closest-side, ${g}, transparent 70%)` }} />
          <Emblem tier={it.tier} glyph={it.glyph} unlocked size={128} animateIn />
        </div>
        <p className="mt-4 text-xl font-bold">{it.title}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-300/70">{TIER_LABEL(it.tier)}</p>
        <p className="mt-2 text-sm text-slate-300">{it.desc}</p>
        <button onClick={next} className="mt-6 w-full rounded-xl bg-white py-2.5 font-semibold text-slate-900 hover:bg-slate-100">
          {i < items.length - 1 ? `Siguiente (${i + 1}/${items.length})` : "¡Genial!"}
        </button>
      </div>
    </div>
  );
}
