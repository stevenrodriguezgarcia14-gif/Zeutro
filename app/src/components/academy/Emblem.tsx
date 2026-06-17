"use client";

import { useId } from "react";

export type Tier = "bronce" | "plata" | "oro" | "platino";
export type GlyphKey = "guide" | "stack" | "analysis" | "target" | "spark" | "route" | "crown" | "shield";

const TIERS: Record<Tier, { a: string; b: string; label: string; glow: string }> = {
  bronce: { a: "#8c5a2b", b: "#e0a060", label: "Bronce", glow: "rgba(224,160,96,0.5)" },
  plata: { a: "#8a929c", b: "#eef2f6", label: "Plata", glow: "rgba(226,232,240,0.55)" },
  oro: { a: "#b8860b", b: "#ffd86b", label: "Oro", glow: "rgba(255,216,107,0.55)" },
  platino: { a: "#7c93a8", b: "#f4f9ff", label: "Platino", glow: "rgba(125,211,252,0.55)" },
};

// Glifos monolínea propios (sin emojis). viewBox 0 0 24 24, trazo.
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
  const uid = useId().replace(/:/g, "");
  const t = TIERS[tier];
  const rim = `rim-${uid}`, face = `face-${uid}`, ring = `ring-${uid}`;

  return (
    <div
      className={`zentro-sheen-host relative inline-flex ${animateIn ? "zentro-emblem-in" : ""} ${unlocked ? "zentro-float" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ filter: unlocked ? `drop-shadow(0 6px 14px ${t.glow})` : "drop-shadow(0 3px 6px rgba(15,23,42,0.18))" }}>
        <defs>
          <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={unlocked ? t.b : "#cbd5e1"} />
            <stop offset="45%" stopColor={unlocked ? t.a : "#94a3b8"} />
            <stop offset="100%" stopColor={unlocked ? t.b : "#cbd5e1"} />
          </linearGradient>
          <radialGradient id={face} cx="38%" cy="32%" r="80%">
            {unlocked ? (
              <>
                <stop offset="0%" stopColor="#20242b" />
                <stop offset="60%" stopColor="#0e1116" />
                <stop offset="100%" stopColor="#05070a" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#f1f5f9" />
                <stop offset="100%" stopColor="#dbe2ea" />
              </>
            )}
          </radialGradient>
          <linearGradient id={ring} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Aro metálico */}
        <circle cx="50" cy="50" r="47" fill={`url(#${rim})`} />
        {/* Acuñado (knurling) */}
        <circle cx="50" cy="50" r="43.5" fill="none" stroke={unlocked ? t.a : "#94a3b8"} strokeWidth="1.4" strokeDasharray="1.4 2.4" opacity="0.6" />
        {/* Cara */}
        <circle cx="50" cy="50" r="40" fill={`url(#${face})`} />
        {/* Reflejo superior */}
        <ellipse cx="50" cy="30" rx="30" ry="14" fill={`url(#${ring})`} opacity={unlocked ? 0.18 : 0.35} />
        {/* Glifo */}
        <g transform="translate(26 26) scale(2)">
          <path d={GLYPHS[glyph]} fill="none" stroke={unlocked ? t.b : "#94a3b8"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>

      {/* Sheen */}
      <span className="zentro-sheen pointer-events-none absolute inset-0 rounded-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)", borderRadius: "9999px" }} />

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
