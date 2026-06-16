"use client";

import { useState } from "react";
import { Icon } from "./icons";

const CASES = [
  {
    key: "individual",
    tab: "Emprendedor",
    headline: "Tu negocio completo, sin equipo.",
    desc: "Lleva clientes, ventas, cobros y ganancias tú solo, sin contratar a nadie para organizarte.",
    bullets: [
      "Todo en un panel, sin saltar entre apps",
      "Zentro te dice qué resolver primero cada día",
      "Sabes cuánto ganas, no solo cuánto vendes",
    ],
  },
  {
    key: "revendedor",
    tab: "Revendedor",
    headline: "Sabe cuánto ganas de verdad en cada venta.",
    desc: "Conecta tus compras para reventa con tus ventas y descubre tu rentabilidad real, producto por producto.",
    bullets: [
      "Costeo automático de compras y productos",
      "Margen y ganancia real por venta",
      "Control de inventario y reposición",
    ],
  },
  {
    key: "familiar",
    tab: "Negocio familiar",
    headline: "Que todos vean lo mismo, sin caos.",
    desc: "Centraliza la información para que toda la familia trabaje sobre los mismos datos, sin malentendidos.",
    bullets: [
      "Una sola fuente de verdad para todos",
      "Visibilidad compartida de cobros y caja",
      "Menos 'creí que tú lo habías hecho'",
    ],
  },
  {
    key: "servicios",
    tab: "Servicios",
    headline: "De la cotización al cobro, sin perder el hilo.",
    desc: "Cada cliente, su cotización, su proyecto, su factura y su cobro viven en el mismo lugar y conectados.",
    bullets: [
      "Cotizaciones que se vuelven facturas en 1 clic",
      "Proyectos y tareas ligados al cliente",
      "Recordatorios de cobro automáticos",
    ],
  },
  {
    key: "microempresa",
    tab: "Microempresa",
    headline: "Crece sin perder el control.",
    desc: "KPIs, flujo de caja y alertas que te dan la visibilidad para escalar de forma ordenada.",
    bullets: [
      "Indicadores clave en tiempo real",
      "Flujo de caja proyectado",
      "Alertas antes de que algo se vuelva problema",
    ],
  },
];

export function UseCases() {
  const [active, setActive] = useState(CASES[0].key);
  const current = CASES.find((c) => c.key === active) ?? CASES[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CASES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActive(c.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active === c.key
                ? "bg-ink text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {c.tab}
          </button>
        ))}
      </div>

      <div className="mt-8 grid items-center gap-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 md:grid-cols-2">
        <div>
          <h3 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
            {current.headline}
          </h3>
          <p className="mt-3 text-slate-600">{current.desc}</p>
          <ul className="mt-6 flex flex-col gap-3">
            {current.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon.check size={13} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-brand-tint/40 p-8">
          <div className="flex h-full min-h-44 items-center justify-center">
            <span className="font-display text-6xl font-bold text-brand/30">
              {current.tab[0]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
