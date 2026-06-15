"use client";

import { useState } from "react";

/** País (ISO-3166 alpha-2) → moneda por defecto (ISO-4217). */
const COUNTRIES: { code: string; name: string; currency: string }[] = [
  { code: "MX", name: "México", currency: "MXN" },
  { code: "CO", name: "Colombia", currency: "COP" },
  { code: "AR", name: "Argentina", currency: "ARS" },
  { code: "CL", name: "Chile", currency: "CLP" },
  { code: "PE", name: "Perú", currency: "PEN" },
  { code: "EC", name: "Ecuador", currency: "USD" },
  { code: "VE", name: "Venezuela", currency: "VES" },
  { code: "BO", name: "Bolivia", currency: "BOB" },
  { code: "UY", name: "Uruguay", currency: "UYU" },
  { code: "PY", name: "Paraguay", currency: "PYG" },
  { code: "GT", name: "Guatemala", currency: "GTQ" },
  { code: "CR", name: "Costa Rica", currency: "CRC" },
  { code: "PA", name: "Panamá", currency: "USD" },
  { code: "DO", name: "República Dominicana", currency: "DOP" },
  { code: "HN", name: "Honduras", currency: "HNL" },
  { code: "NI", name: "Nicaragua", currency: "NIO" },
  { code: "SV", name: "El Salvador", currency: "USD" },
  { code: "PR", name: "Puerto Rico", currency: "USD" },
  { code: "CU", name: "Cuba", currency: "CUP" },
  { code: "ES", name: "España", currency: "EUR" },
  { code: "US", name: "Estados Unidos", currency: "USD" },
];

const CURRENCIES = [
  "MXN", "COP", "ARS", "CLP", "PEN", "USD", "EUR", "VES", "BOB",
  "UYU", "PYG", "GTQ", "CRC", "DOP", "HNL", "NIO", "CUP",
];

export function OrgLocaleFields({
  defaultCountry = "MX",
}: {
  defaultCountry?: string;
}) {
  const initial = COUNTRIES.find((c) => c.code === defaultCountry) ?? COUNTRIES[0];
  const [country, setCountry] = useState(initial.code);
  const [currency, setCurrency] = useState(initial.currency);

  function onCountryChange(code: string) {
    setCountry(code);
    const match = COUNTRIES.find((c) => c.code === code);
    if (match) setCurrency(match.currency); // autocompleta la moneda
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">País</label>
        <select
          name="country"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Moneda</label>
        <select
          name="base_currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
