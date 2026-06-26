"use client";

import { useState } from "react";
import { Icon } from "./icons";

const FAQS = [
  {
    q: "¿Qué es exactamente Zentro?",
    a: "Es el sistema operativo de tu negocio: un solo lugar para clientes, ventas, cotizaciones, facturas, cobros, compras, productos, proyectos y finanzas. No es un CRM ni un ERP más: además de guardar tu información, te dice qué hacer y qué cobrar hoy.",
  },
  {
    q: "¿Necesito conocimientos técnicos o de contabilidad?",
    a: "No. Zentro está hecho para emprendedores, no para contadores ni equipos de TI. Creas tu cuenta y empiezas en un par de minutos, sin instalaciones ni configuraciones complejas.",
  },
  {
    q: "¿Funciona para mi país y mi moneda?",
    a: "Sí. Zentro trabaja con la moneda y las reglas fiscales de tu país, pensado para LatAm y España.",
  },
  {
    q: "¿Puedo migrar mis datos desde Excel?",
    a: "Sí. Puedes importar tus clientes y productos en minutos, y tus datos siempre son tuyos: los exportas cuando quieras.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Puedes empezar gratis, sin tarjeta. Cuando tu negocio crece, eliges el plan que necesitas. Sin permanencia: cancelas cuando quieras.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Tu información viaja cifrada (TLS) y se aloja en infraestructura de Supabase con respaldos gestionados. Cada negocio queda aislado a nivel de base de datos: nadie más que tu equipo ve tus datos, y los exportas cuando quieras. Más detalle en la página de Seguridad.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white">
      {FAQS.map((f, i) => (
        <div key={f.q}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            aria-expanded={open === i}
          >
            <span className="font-semibold text-slate-900">{f.q}</span>
            <span
              className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                open === i ? "rotate-45 text-brand" : ""
              }`}
            >
              <Icon.x size={20} className="rotate-45" />
            </span>
          </button>
          <div
            className={`grid overflow-hidden transition-all duration-300 ${
              open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <p className="px-6 pb-5 text-slate-600">{f.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
