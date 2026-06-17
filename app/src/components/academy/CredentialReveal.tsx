"use client";

import { useEffect } from "react";
import { Confetti } from "@/components/Confetti";
import { Credential } from "@/components/academy/Credential";
import type { Tier } from "@/components/academy/Emblem";

/** Experiencia cinemática de "credencial obtenida": overlay + halo + reveal + confeti. */
export function CredentialReveal({
  title, holder, level, category, date, serial, tier, accent, onClose, onShown,
}: {
  title: string; holder: string; level: string; category: string;
  date?: string; serial?: string; tier: Tier; accent: string;
  onClose: () => void; onShown?: () => void;
}) {
  useEffect(() => { onShown?.(); }, [onShown]);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-slate-950/85 p-4 backdrop-blur-md">
      <Confetti pieces={130} />
      <div className="zentro-flash pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 50% 45%, ${accent}, transparent 55%)` }} />
      <p className="zentro-rise text-center text-xs font-semibold uppercase tracking-[0.32em] text-amber-300/90">
        ✦ Credencial obtenida ✦
      </p>
      <div className="relative w-full max-w-lg">
        <div className="zentro-shock pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ borderColor: accent }} />
        <div className="zentro-shock-2 pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: accent }} />
        <div className="zentro-spin pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.08) 0deg 6deg, transparent 6deg 16deg)", WebkitMaskImage: "radial-gradient(closest-side, #000 30%, transparent 70%)", maskImage: "radial-gradient(closest-side, #000 30%, transparent 70%)" }} />
        <div className="zentro-halo pointer-events-none absolute -inset-8 rounded-[2rem]"
          style={{ background: `radial-gradient(closest-side, ${accent}66, transparent 70%)` }} />
        <div className="zentro-cred-grand relative">
          <Credential title={title} holder={holder} level={level} category={category}
            date={date} serial={serial} earned tier={tier} accent={accent} />
        </div>
      </div>
      <button onClick={onClose}
        className="zentro-rise rounded-xl bg-white px-6 py-2.5 font-semibold text-slate-900 shadow-lg hover:bg-slate-100">
        Continuar
      </button>
    </div>
  );
}
