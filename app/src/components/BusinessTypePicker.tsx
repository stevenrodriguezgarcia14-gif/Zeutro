"use client";

import { useState } from "react";
import { PROFILES } from "@/lib/guide";

/** Selector visual de tipo de negocio (tarjetas). Escribe en un input oculto. */
export function BusinessTypePicker({ name = "business_type", defaultValue }: { name?: string; defaultValue?: string | null }) {
  const [selected, setSelected] = useState<string>(defaultValue ?? "");
  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PROFILES.map((p) => {
          const active = selected === p.slug;
          return (
            <button
              type="button"
              key={p.slug}
              onClick={() => setSelected(p.slug)}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="mt-1 text-sm font-medium leading-tight">{p.label}</span>
              <span className={`mt-0.5 text-xs leading-tight ${active ? "text-slate-300" : "text-slate-400"}`}>{p.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
