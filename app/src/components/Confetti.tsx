"use client";

import { useEffect, useState } from "react";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

/** Confeti ligero (solo CSS, sin dependencias) para celebrar un logro grande. */
export function Confetti({ pieces = 80 }: { pieces?: number }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 4000);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: pieces }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const dur = 2.2 + Math.random() * 1.6;
        const size = 6 + Math.random() * 6;
        const color = COLORS[i % COLORS.length];
        const rot = Math.random() * 360;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              top: "-5%",
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 1.6}px`,
              backgroundColor: color,
              transform: `rotate(${rot}deg)`,
              borderRadius: "1px",
              animation: `zentro-confetti ${dur}s ${delay}s ease-in forwards`,
            }}
          />
        );
      })}
      <style>{`@keyframes zentro-confetti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(105vh) rotate(720deg); opacity: 0.9; }
      }`}</style>
    </div>
  );
}
