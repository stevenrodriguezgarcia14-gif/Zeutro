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

  function next() {
    if (i < items.length - 1) setI(i + 1);
    else onDone?.();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      {big && <Confetti pieces={70} />}
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-gradient-to-br from-[#10151c] to-[#080b10] p-8 text-center text-white shadow-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">Logro desbloqueado</p>
        <div className="mt-5 flex justify-center">
          <Emblem tier={it.tier} glyph={it.glyph} unlocked size={120} animateIn />
        </div>
        <p className="mt-5 text-xl font-bold">{it.title}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-300/70">{TIER_LABEL(it.tier)}</p>
        <p className="mt-2 text-sm text-slate-300">{it.desc}</p>
        <button onClick={next} className="mt-6 w-full rounded-xl bg-white py-2.5 font-semibold text-slate-900 hover:bg-slate-100">
          {i < items.length - 1 ? `Siguiente (${i + 1}/${items.length})` : "¡Genial!"}
        </button>
      </div>
    </div>
  );
}
