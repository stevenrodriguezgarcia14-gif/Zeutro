"use client";

import { useState } from "react";

// Buscador del diccionario: filtra en memoria mientras escribes (0 ms).
export function GlossarySearch({ entries }: { entries: { term: string; meaning: string; how: string }[] }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const list = needle
    ? entries.filter((g) => `${g.term} ${g.meaning} ${g.how}`.toLowerCase().includes(needle))
    : entries;

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Busca un término (gancho, plano, keyframe...)"
        className="w-full rounded-xl bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none ring-1 ring-white/[0.08] placeholder:text-zinc-600 focus:ring-[#00C781]/50"
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {list.map((g) => (
          <div key={g.term} className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
            <p className="font-display text-sm font-bold text-white">{g.term}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">{g.meaning}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#3ee6a8]"><span className="font-semibold">Cómo:</span> {g.how}</p>
          </div>
        ))}
        {list.length === 0 && <p className="col-span-full py-4 text-center text-sm text-zinc-600">Sin resultados para “{q}”.</p>}
      </div>
    </div>
  );
}
