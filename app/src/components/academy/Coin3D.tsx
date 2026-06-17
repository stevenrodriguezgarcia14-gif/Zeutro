"use client";

import { EmblemFace, EMBLEM_TIERS, type Tier, type GlyphKey } from "@/components/academy/Emblem";

/** Moneda 3D real (CSS 3D): caras frontal/trasera + canto con grosor, que se balancea. */
export function Coin3D({ tier, glyph, size = 150 }: { tier: Tier; glyph: GlyphKey; size?: number }) {
  const depth = Math.max(8, Math.round(size * 0.13));
  const layers = 16;
  const t = EMBLEM_TIERS[tier];
  const rimPad = Math.round(size * 0.09);

  return (
    <div style={{ perspective: size * 4 }}>
      <div className="zentro-coinrock relative" style={{ width: size, height: size, transformStyle: "preserve-3d" }}>
        {/* Canto (grosor) — capas apiladas en Z */}
        {Array.from({ length: layers }).map((_, i) => {
          const z = (i / (layers - 1) - 0.5) * depth;
          return (
            <div key={i} className="absolute inset-0 rounded-full"
              style={{ background: t.conic, transform: `translateZ(${z}px)`, filter: "brightness(0.82)" }} />
          );
        })}
        {/* Cara frontal */}
        <div className="absolute inset-0" style={{ transform: `translateZ(${depth / 2 + 0.5}px)`, backfaceVisibility: "hidden" }}>
          <EmblemFace tier={tier} glyph={glyph} unlocked size={size} spin />
        </div>
        {/* Cara trasera (monograma Z grabado) */}
        <div className="absolute inset-0 rounded-full"
          style={{ transform: `translateZ(${-depth / 2 - 0.5}px) rotateY(180deg)`, backfaceVisibility: "hidden", background: t.conic, padding: rimPad }}>
          <div className="flex h-full w-full items-center justify-center rounded-full"
            style={{ background: "radial-gradient(circle at 38% 30%, #2b313a 0%, #141a21 46%, #070b10 100%)", boxShadow: "inset 0 3px 8px rgba(0,0,0,0.75)" }}>
            <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="none" stroke={t.glyph} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.6))" }}>
              <path d="M7 6h10l-9.5 12H17" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
