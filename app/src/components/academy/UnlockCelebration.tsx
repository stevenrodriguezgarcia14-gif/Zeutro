"use client";

import { useState } from "react";
import { Confetti } from "@/components/Confetti";
import { Coin3D } from "@/components/academy/Coin3D";
import { TIER_LABEL, type Tier, type GlyphKey } from "@/components/academy/Emblem";

export type UnlockItem = { slug: string; title: string; desc: string; tier: Tier; glyph: GlyphKey };

const GLOW: Record<Tier, string> = {
  bronce: "rgba(224,160,96,0.65)", plata: "rgba(226,232,240,0.6)", oro: "rgba(255,200,80,0.7)", platino: "rgba(150,200,250,0.7)",
};

/** Celebración cinemática de desbloqueo (cola de logros). */
export function UnlockCelebration({ items, onDone }: { items: UnlockItem[]; onDone?: () => void }) {
  const [i, setI] = useState(0);
  if (items.length === 0) return null;
  const it = items[i];
  if (!it) return null;
  const g = GLOW[it.tier];

  function next() {
    if (i < items.length - 1) setI(i + 1);
    else onDone?.();
  }

  return (
    <div key={i} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <Confetti pieces={90} />
      <div className="zentro-shake relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#10151c] to-[#06090d] p-8 text-center text-white shadow-2xl">
        {/* Destello de impacto */}
        <div className="zentro-flash pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.9), transparent 60%)" }} />

        <p className="zentro-pop text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300/80" style={{ animationDelay: "0.1s" }}>
          Logro desbloqueado
        </p>

        {/* Escenario del medallón */}
        <div className="relative mx-auto mt-5 flex h-44 w-44 items-center justify-center">
          {/* Rayos */}
          <div className="zentro-rays-in pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="zentro-spin h-64 w-64 rounded-full"
              style={{ background: "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.13) 0deg 7deg, transparent 7deg 17deg)", WebkitMaskImage: "radial-gradient(closest-side, #000 36%, transparent 72%)", maskImage: "radial-gradient(closest-side, #000 36%, transparent 72%)" }} />
          </div>
          {/* Halo */}
          <div className="zentro-halo pointer-events-none absolute h-48 w-48 rounded-full" style={{ background: `radial-gradient(closest-side, ${g}, transparent 70%)` }} />
          {/* Ondas expansivas */}
          <div className="zentro-shock pointer-events-none absolute h-40 w-40 rounded-full border-2" style={{ borderColor: g }} />
          <div className="zentro-shock-2 pointer-events-none absolute h-40 w-40 rounded-full border" style={{ borderColor: g }} />
          {/* Moneda 3D que se estampa */}
          <div className="zentro-slam relative">
            <Coin3D tier={it.tier} glyph={it.glyph} size={132} />
          </div>
        </div>

        <p className="zentro-pop mt-5 text-xl font-bold" style={{ animationDelay: "0.62s" }}>{it.title}</p>
        <p className="zentro-pop text-xs font-medium uppercase tracking-wide text-amber-300/70" style={{ animationDelay: "0.7s" }}>{TIER_LABEL(it.tier)}</p>
        <p className="zentro-pop mt-2 text-sm text-slate-300" style={{ animationDelay: "0.78s" }}>{it.desc}</p>

        <button onClick={next} className="zentro-pop mt-6 w-full rounded-xl bg-white py-2.5 font-semibold text-slate-900 hover:bg-slate-100" style={{ animationDelay: "0.9s" }}>
          {i < items.length - 1 ? `Siguiente (${i + 1}/${items.length})` : "¡Genial!"}
        </button>
      </div>
    </div>
  );
}
