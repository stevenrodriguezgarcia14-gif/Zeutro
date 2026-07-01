"use client";

import { useEffect, useState } from "react";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

type Piece = { left: number; delay: number; dur: number; size: number; color: string; rot: number };

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 2.2 + Math.random() * 1.6,
    size: 6 + Math.random() * 6,
    color: COLORS[i % COLORS.length],
    rot: Math.random() * 360,
  }));
}

/** Confeti ligero (solo CSS, sin dependencias) para celebrar un logro grande. */
export function Confetti({ pieces = 80 }: { pieces?: number }) {
  const [on, setOn] = useState(true);
  // Las posiciones aleatorias se generan UNA vez (inicializador perezoso):
  // el render queda puro y el confeti no "salta" al re-renderizar.
  const [items] = useState(() => makePieces(pieces));
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 4000);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {items.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "-5%",
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.6}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rot}deg)`,
            borderRadius: "1px",
            animation: `zentro-confetti ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`@keyframes zentro-confetti {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(105vh) rotate(720deg); opacity: 0.9; }
      }`}</style>
    </div>
  );
}
