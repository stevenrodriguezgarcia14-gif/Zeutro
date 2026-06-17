"use client";

export type Tier = "bronce" | "plata" | "oro" | "platino";
export type GlyphKey = "guide" | "stack" | "analysis" | "target" | "spark" | "route" | "crown" | "shield";

type TierCfg = { conic: string; glyph: string; glow: string; label: string };
const TIERS: Record<Tier, TierCfg> = {
  bronce: {
    conic: "conic-gradient(from -50deg, #f3cfa6, #8c5a2b, #e6ab78, #6e4420, #edb98a, #8c5a2b, #f3cfa6)",
    glyph: "#f2c79e", glow: "rgba(214,142,86,0.55)", label: "Bronce",
  },
  plata: {
    conic: "conic-gradient(from -50deg, #ffffff, #9aa3ad, #eef3f7, #6b7280, #e2e8ee, #9aa3ad, #ffffff)",
    glyph: "#eef3f7", glow: "rgba(214,224,234,0.5)", label: "Plata",
  },
  oro: {
    conic: "conic-gradient(from -50deg, #fff3c0, #c9971f, #ffe9a8, #8a6508, #ffd86b, #b8860b, #fff3c0)",
    glyph: "#ffe9ad", glow: "rgba(255,200,80,0.6)", label: "Oro",
  },
  platino: {
    conic: "conic-gradient(from -50deg, #ffffff, #a9b8c8, #f4f9ff, #81979b, #e8f1fb, #a9b8c8, #ffffff)",
    glyph: "#eaf2fb", glow: "rgba(150,200,250,0.6)", label: "Platino",
  },
};
const LOCKED_CONIC = "conic-gradient(from -50deg, #d7dee6, #94a3b8, #e2e8ee, #7f8a99, #cbd5e1, #94a3b8, #d7dee6)";

const GLYPHS: Record<GlyphKey, string> = {
  guide: "M12 6.5c-1.6-1-4.2-1.5-6-1.1v11c1.8-.4 4.4.1 6 1.1 1.6-1 4.2-1.5 6-1.1v-11c-1.8-.4-4.4.1-6 1.1zM12 6.5V18",
  stack: "M12 4l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4",
  analysis: "M4 16l4.5-4.5 3 3L19 7M15 7h4v4",
  target: "M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M12 12m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0",
  spark: "M13 3 5 13h5l-1 8 8-11h-5z",
  route: "M7 3v18M7 4h10l-2.2 3.2L17 11H7",
  crown: "M4 8l3.5 6h9L20 8l-4.5 3.2L12 6 8.5 11.2z M6 17h12",
  shield: "M12 3l7 3v5c0 4.3-3 7.2-7 8.2-4-1-7-3.9-7-8.2V6l7-3zM9 11.5l2 2 4-4",
};

export function Emblem({
  tier, glyph, unlocked, size = 84, animateIn = false,
}: { tier: Tier; glyph: GlyphKey; unlocked: boolean; size?: number; animateIn?: boolean }) {
  const t = TIERS[tier];
  const rimPad = Math.round(size * 0.09);
  const glyphSize = Math.round(size * 0.44);
  const faceBg = unlocked
    ? "radial-gradient(circle at 38% 30%, #2b313a 0%, #141a21 46%, #070b10 100%)"
    : "radial-gradient(circle at 38% 30%, #f1f5f9 0%, #d7dee6 100%)";
  const glyphColor = unlocked ? t.glyph : "#94a3b8";

  return (
    <div
      className={`relative inline-flex ${animateIn ? "zentro-emblem-in" : ""} ${unlocked ? "zentro-float" : ""}`}
      style={{ width: size, height: size }}
    >
      {/* Aro metálico (canto que atrapa la luz) */}
      <div
        style={{
          width: size, height: size, borderRadius: "9999px",
          background: unlocked ? t.conic : LOCKED_CONIC,
          padding: rimPad,
          boxShadow: unlocked
            ? `0 10px 24px ${t.glow}, 0 2px 4px rgba(0,0,0,0.35), inset 0 2px 3px rgba(255,255,255,0.55), inset 0 -4px 7px rgba(0,0,0,0.45)`
            : "0 4px 10px rgba(15,23,42,0.18), inset 0 2px 3px rgba(255,255,255,0.6), inset 0 -3px 5px rgba(0,0,0,0.18)",
        }}
      >
        {/* Cara abombada */}
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full"
          style={{
            background: faceBg,
            boxShadow: unlocked
              ? "inset 0 3px 8px rgba(0,0,0,0.75), inset 0 -2px 3px rgba(255,255,255,0.07)"
              : "inset 0 2px 6px rgba(0,0,0,0.12)",
          }}
        >
          {/* Luz especular que gira */}
          {unlocked && (
            <div
              className="zentro-spin pointer-events-none absolute inset-0"
              style={{
                background: "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.38) 38deg, transparent 92deg, transparent 230deg, rgba(255,255,255,0.14) 268deg, transparent 320deg)",
                mixBlendMode: "screen",
              }}
            />
          )}
          {/* Brillo superior fijo */}
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 60% 38% at 42% 24%, rgba(255,255,255,0.22), transparent 70%)" }} />
          {/* Glifo grabado */}
          <svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24" fill="none"
            stroke={glyphColor} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
            className="relative"
            style={{ filter: unlocked ? "drop-shadow(0 1px 0 rgba(0,0,0,0.6)) drop-shadow(0 -0.5px 0 rgba(255,255,255,0.18))" : "none" }}>
            <path d={GLYPHS[glyph]} />
          </svg>
        </div>
      </div>

      {/* Candado si está bloqueado */}
      {!unlocked && (
        <span className="absolute -bottom-1 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
        </span>
      )}
    </div>
  );
}

export const TIER_LABEL = (t: Tier) => TIERS[t].label;
