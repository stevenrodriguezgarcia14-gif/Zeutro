"use client";

import { useState } from "react";

/** Campo de contraseña con botón mostrar/ocultar y (opcional) indicador de fuerza. */
export function PasswordInput({
  name,
  placeholder,
  minLength = 12,
  required = true,
  showStrength = false,
}: {
  name: string;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
  showStrength?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [val, setVal] = useState("");

  function strength(p: string) {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s; // 0..4
  }
  const s = strength(val);
  const labels = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte"];
  const colors = ["bg-red-400", "bg-red-400", "bg-amber-400", "bg-lime-500", "bg-green-600"];

  return (
    <div>
      <div className="relative mt-1">
        <input
          name={name}
          type={show ? "text" : "password"}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-16 text-slate-900 outline-none focus:border-slate-900"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          {show ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {showStrength && val.length > 0 && (
        <div className="mt-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full ${colors[s]}`} style={{ width: `${(s / 4) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-400">Seguridad: {labels[s]}</p>
        </div>
      )}
    </div>
  );
}
