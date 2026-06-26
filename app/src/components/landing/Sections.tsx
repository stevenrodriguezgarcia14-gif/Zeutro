import Link from "next/link";
import { ZentroLogo, ZentroMark } from "./Logo";
import { Icon } from "./icons";
import { Reveal } from "./Reveal";
import { DashboardMockup } from "./Mockup";

/* ── Primitivos ──────────────────────────────────────────────── */

function Overline({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-[0.14em] ${
        dark ? "text-brand" : "text-brand-dark"
      }`}
    >
      {children}
    </p>
  );
}

function PrimaryCta({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href="/register"
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-base font-semibold text-white transition-transform hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </Link>
  );
}

/* ── 2. HERO ─────────────────────────────────────────────────── */

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute -top-40 right-0 h-[480px] w-[480px] rounded-full bg-brand/20 blur-[120px]"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
        <div className="zentro-hero-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Sistema operativo para emprendedores
          </span>
          <h1 className="mt-5 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
            El centro de control
            <br />
            de tu <span className="text-brand">negocio</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600">
            Clientes, ventas, cobros, compras y ganancias en un solo lugar. Y cada
            día, Zentro te dice qué hacer y qué cobrar — para que dejes de improvisar
            tu negocio.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryCta>
              Empieza gratis <Icon.arrow size={18} />
            </PrimaryCta>
            <a
              href="#producto"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition-colors hover:border-slate-300"
            >
              <Icon.play size={16} className="text-brand" /> Ver Zentro en acción
            </a>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Gratis para empezar · Sin tarjeta · Listo en 2 minutos.
          </p>
        </div>

        <div className="zentro-hero-in [animation-delay:120ms]">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

/* ── 3. FRANJA DE CONFIANZA ──────────────────────────────────── */

export function TrustStrip() {
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:justify-center sm:gap-10 sm:px-6">
        <p className="text-sm font-medium text-slate-500">
          Hecho para emprendedores, freelancers y negocios que crecen
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-1.5"><Icon.globe size={15} className="text-brand-dark" /> Multi-país y moneda</span>
          <span className="flex items-center gap-1.5"><Icon.shield size={15} className="text-brand-dark" /> Datos cifrados</span>
          <span className="flex items-center gap-1.5"><Icon.zap size={15} className="text-brand-dark" /> Sin instalación</span>
        </div>
      </div>
    </section>
  );
}

/* ── 4. PROBLEMA ─────────────────────────────────────────────── */

const PROBLEMS = [
  "No sé quién me debe ni cuánto.",
  "Tengo clientes en WhatsApp, ventas en Excel y facturas en otra app.",
  "Vendo, pero no sé si de verdad estoy ganando.",
  "Se me pasan cobros y vencimientos.",
  "Cada vez que crezco, pierdo más el control.",
  "Paso el día apagando incendios, sin saber qué es prioritario.",
];

export function Problem() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Overline>El problema</Overline>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Llevar un negocio así, cansa.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Si te suena, no es tu culpa. Es que tu información vive en todos lados
            menos en uno.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p} delay={i * 60}>
              <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                  <Icon.x size={18} />
                </span>
                <p className="mt-4 text-base font-medium text-slate-700">“{p}”</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 5. SOLUCIÓN (antes / después) ───────────────────────────── */

const BEFORE = [
  "6 apps abiertas y nada cuadra",
  "“¿A quién tenía que cobrar?”",
  "Vendes a ciegas",
  "Se te escapan vencimientos",
  "Improvisas el día",
];
const AFTER = [
  "Un solo panel de mando",
  "“Hoy cobras a 3 clientes: $4.250”",
  "Ves tu ganancia real por venta",
  "Zentro te avisa antes",
  "Zentro te dice qué hacer hoy",
];

export function Solution() {
  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Overline>La solución</Overline>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Del caos al control. En un solo lugar.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Zentro reúne todo tu negocio y lo convierte en claridad: a quién cobrar,
            qué vender, cuánto ganas y qué hacer hoy.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Reveal className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Sin Zentro
            </p>
            <ul className="mt-5 flex flex-col gap-4">
              {BEFORE.map((b) => (
                <li key={b} className="flex items-start gap-3 text-slate-500">
                  <Icon.x size={18} className="mt-0.5 shrink-0 text-slate-400" />
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="rounded-3xl border-2 border-brand bg-white p-6 shadow-[0_24px_60px_-24px_rgba(0,199,129,0.45)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-dark">
              Con Zentro
            </p>
            <ul className="mt-5 flex flex-col gap-4">
              {AFTER.map((a) => (
                <li key={a} className="flex items-start gap-3 font-medium text-slate-800">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Icon.check size={13} />
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── 6. PRODUCTO EN ACCIÓN ───────────────────────────────────── */

export function ProductShowcase() {
  return (
    <section id="producto" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Overline>Producto</Overline>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Tu negocio entero, en una sola pantalla.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Ver para creer. Así se ve tener todo bajo control.
          </p>
        </Reveal>
        <Reveal delay={100} className="mx-auto mt-12 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)]">
            <video
              className="block w-full"
              src="/demo/zentro-demo.mp4"
              poster="/demo/zentro-demo-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
              aria-label="Recorrido por Zentro: dashboard, productos, flujo de caja y Centro de Prioridades"
            />
          </div>
          <p className="mt-3 text-center text-sm text-slate-500">
            Recorrido real por Zentro — datos de ejemplo de un negocio.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 7. CENTRO DE PRIORIDADES (sección oscura, diferenciador) ── */

export function Priorities() {
  return (
    <section className="bg-ink-900 py-20 text-white sm:py-28">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <Overline dark>El diferenciador</Overline>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Cada mañana, Zentro te dice qué hacer.
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            No más adivinar. Abres Zentro y ves exactamente qué cobrar, qué resolver
            y qué oportunidad seguir — ordenado por lo que más impacta tu dinero.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {[
              "Cobros vencidos y por vencer, primero",
              "Oportunidades de venta que no debes dejar pasar",
              "Tareas del día priorizadas por impacto",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-slate-200">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-ink">
                  <Icon.check size={13} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120}>
          <DashboardMockup dark />
        </Reveal>
      </div>
    </section>
  );
}

/* ── 8. MÓDULOS (bento) ──────────────────────────────────────── */

const MODULES = [
  {
    icon: <Icon.users size={22} />,
    title: "Clientes y Ventas",
    desc: "Clientes, leads, ventas y cotizaciones conectados en un mismo hilo.",
    span: "md:col-span-2",
    feature: true,
  },
  {
    icon: <Icon.wallet size={22} />,
    title: "Dinero",
    desc: "Facturas, cobros, flujo de caja y KPIs.",
    span: "",
  },
  {
    icon: <Icon.cart size={22} />,
    title: "Productos y Rentabilidad",
    desc: "Compras para reventa, costeo, inventario y ganancia real.",
    span: "",
  },
  {
    icon: <Icon.folder size={22} />,
    title: "Operación",
    desc: "Proyectos, tareas, calendario y documentos.",
    span: "",
  },
  {
    icon: <Icon.target size={22} />,
    title: "Inteligencia",
    desc: "Centro de Prioridades, alertas y KPIs que convierten datos en decisiones.",
    span: "md:col-span-3",
    feature: true,
  },
];

export function Modules() {
  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Overline>La plataforma</Overline>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Todo tu negocio, conectado.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            No son módulos sueltos. Es un solo sistema donde todo se habla.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {MODULES.map((m, i) => (
            <Reveal
              key={m.title}
              delay={i * 60}
              className={m.span}
            >
              <div
                className={`flex h-full flex-col rounded-2xl border p-6 transition-colors ${
                  m.feature
                    ? "border-brand/30 bg-white"
                    : "border-slate-200 bg-white hover:border-brand/40"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    m.feature ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {m.icon}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
                  {m.title}
                </h3>
                <p className="mt-1.5 text-slate-600">{m.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 10. COMPARATIVA ─────────────────────────────────────────── */

const COMP_COLS = ["Excel", "WhatsApp", "Notion", "CRM", "ERP", "Zentro"];
const COMP_ROWS: { label: string; cells: (boolean | "partial")[] }[] = [
  { label: "Centraliza todo el negocio", cells: [false, false, "partial", "partial", true, true] },
  { label: "Cobros y finanzas reales", cells: ["partial", false, false, "partial", true, true] },
  { label: "Te dice qué hacer hoy", cells: [false, false, false, false, false, true] },
  { label: "Ganancia / rentabilidad real", cells: ["partial", false, false, false, true, true] },
  { label: "Fácil de empezar", cells: ["partial", true, "partial", false, false, true] },
  { label: "Precio para emprendedor", cells: [true, true, true, false, false, true] },
];

function Cell({ v }: { v: boolean | "partial" }) {
  if (v === true)
    return <Icon.check size={18} className="mx-auto text-brand" />;
  if (v === "partial")
    return <span className="mx-auto block h-1 w-3 rounded-full bg-slate-300" />;
  return <Icon.x size={16} className="mx-auto text-slate-300" />;
}

export function Comparison() {
  return (
    <section id="comparativa" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Overline>Por qué Zentro</Overline>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Por qué Zentro y no lo que usas hoy.
          </h2>
        </Reveal>

        <Reveal delay={100} className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-white p-3 text-left" />
                {COMP_COLS.map((c) => (
                  <th
                    key={c}
                    className={`p-3 text-center font-semibold ${
                      c === "Zentro"
                        ? "sticky right-0 z-20 rounded-t-xl bg-ink text-white shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.18)]"
                        : "text-slate-500"
                    }`}
                  >
                    {c === "Zentro" ? (
                      <span className="inline-flex items-center gap-1.5">
                        <ZentroMark size={16} /> Zentro
                      </span>
                    ) : (
                      c
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMP_ROWS.map((row, ri) => (
                <tr key={row.label}>
                  <td className="sticky left-0 z-10 border-t border-slate-100 bg-white p-3 text-left font-medium text-slate-700">
                    {row.label}
                  </td>
                  {row.cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`border-t border-slate-100 p-3 text-center ${
                        ci === row.cells.length - 1 ? "sticky right-0 z-10 bg-slate-50 shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.12)]" : ""
                      } ${ri === COMP_ROWS.length - 1 && ci === row.cells.length - 1 ? "rounded-b-xl" : ""}`}
                    >
                      <Cell v={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-center text-xs text-slate-400 sm:hidden">
            Desliza para comparar — Zentro queda fijo a la derecha →
          </p>
        </Reveal>

        <Reveal delay={150} className="mx-auto mt-10 max-w-2xl text-center">
          <p className="text-lg font-medium text-slate-700">
            Excel no te avisa. WhatsApp no cobra. Un ERP cuesta y tarda meses.{" "}
            <span className="text-slate-900">
              Zentro hace las tres cosas — y te dice qué hacer hoy.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 11. CONFIANZA ───────────────────────────────────────────── */

const TRUST = [
  {
    icon: <Icon.lock size={22} />,
    title: "Tus datos, tuyos",
    desc: "Tu información viaja cifrada (TLS) y la exportas cuando quieras. Cada negocio ve solo lo suyo.",
  },
  {
    icon: <Icon.globe size={22} />,
    title: "Pensado para tu país",
    desc: "Funciona con la moneda y los impuestos de tu región. Hecho para LatAm y España.",
  },
  {
    icon: <Icon.zap size={22} />,
    title: "Empieza sin riesgo",
    desc: "Gratis, sin tarjeta y sin permanencia. Importa tus clientes desde Excel en minutos.",
  },
];

export function Trust() {
  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Overline>Confianza</Overline>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Tu negocio, seguro. Tus datos, tuyos.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {TRUST.map((t, i) => (
            <Reveal key={t.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  {t.icon}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
                  {t.title}
                </h3>
                <p className="mt-1.5 text-slate-600">{t.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-200 bg-white p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-dark">
            Por qué construyo Zentro
          </p>
          <p className="mt-3 text-lg text-slate-700">
            “Viví el caos de llevar un negocio en seis apps a la vez: clientes en WhatsApp,
            ventas en Excel, cobros que se me olvidaban. Construyo Zentro para tener un solo
            lugar que me diga qué hacer y a quién cobrar cada día. Si llevas tu negocio así,
            lo hago para ti.”
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-900">
            — Fundador de Zentro
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 12. PRECIOS ─────────────────────────────────────────────── */

const PLANS = [
  {
    name: "Gratis",
    price: "$0",
    period: "/mes",
    note: "Para empezar a ordenar tu negocio.",
    features: [
      "1 usuario · 1 empresa",
      "Clientes, productos y ventas",
      "Cotizaciones y facturas",
      "Centro de Prioridades",
      "Importa tus clientes desde Excel",
    ],
    cta: "Empieza gratis",
    featured: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mes",
    note: "Para vender más y cobrar a tiempo.",
    features: [
      "Todo lo de Gratis",
      "Cobranza con recordatorios",
      "Compras, inventario y rentabilidad real",
      "Flujo de caja y KPIs",
      "Proyectos y tareas · hasta 3 usuarios",
    ],
    cta: "Empieza gratis",
    featured: true,
  },
  {
    name: "Negocio",
    price: "$29",
    period: "/mes",
    note: "Para crecer con tu equipo.",
    features: [
      "Todo lo de Pro",
      "Multiempresa · hasta 10 usuarios",
      "Reportes avanzados",
      "Roles y permisos",
      "Soporte prioritario",
    ],
    cta: "Empieza gratis",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="precios" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Overline>Precios</Overline>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Empieza gratis. Crece cuando lo necesites.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Sin permanencia. Empieza gratis y cambia de plan cuando lo necesites. Precios en USD;
            ahorra ~2 meses pagando al año.
          </p>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 100}>
              <div
                className={`flex h-full flex-col rounded-3xl border p-8 ${
                  p.featured
                    ? "border-2 border-ink bg-ink text-white"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold">{p.name}</h3>
                  {p.featured && (
                    <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-ink">
                      Recomendado
                    </span>
                  )}
                </div>
                <p className={`mt-4 font-display text-4xl font-bold ${p.featured ? "text-white" : "text-slate-900"}`}>
                  {p.price}
                  <span className={`text-base font-medium ${p.featured ? "text-slate-400" : "text-slate-400"}`}>
                    {p.period}
                  </span>
                </p>
                <p className={`mt-1 text-sm ${p.featured ? "text-slate-300" : "text-slate-500"}`}>
                  {p.note}
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2.5 text-sm ${p.featured ? "text-slate-200" : "text-slate-700"}`}>
                      <Icon.check size={16} className="mt-0.5 shrink-0 text-brand" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold transition-transform hover:-translate-y-0.5 ${
                    p.featured
                      ? "bg-brand text-ink"
                      : "bg-ink text-white"
                  }`}
                >
                  {p.cta} <Icon.arrow size={18} />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mx-auto mt-6 max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-semibold text-slate-900">¿Necesitas más?</p>
              <p className="text-sm text-slate-600">
                Plan <span className="font-medium">Empresarial</span>: usuarios ilimitados,
                personalización y soporte dedicado. Precio a medida.
              </p>
            </div>
            <a
              href="mailto:zeutro.notificaciones@gmail.com?subject=Plan%20Empresarial%20Zentro"
              className="shrink-0 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400"
            >
              Hablar con nosotros
            </a>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            Hoy puedes empezar gratis sin tarjeta. El cobro de los planes de pago se activará muy
            pronto; mientras tanto, creas tu cuenta y usas Zentro sin costo.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 14. CTA FINAL (oscuro) ──────────────────────────────────── */

export function FinalCta() {
  return (
    <section className="bg-white pb-20 sm:pb-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-ink-900 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute -bottom-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-brand/30 blur-[120px]"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Toma el control de tu negocio hoy.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
              Miles de decisiones, un solo lugar. Empieza gratis en 2 minutos.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-7 py-4 text-base font-bold text-ink transition-transform hover:-translate-y-0.5"
              >
                Crear mi cuenta gratis <Icon.arrow size={18} />
              </Link>
            </div>
            <p className="mt-5 text-sm text-slate-400">
              Sin tarjeta · Sin instalaciones · Tus datos siempre tuyos.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 15. FOOTER ──────────────────────────────────────────────── */

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-slate-900">
            <ZentroLogo />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            El centro de control de tu negocio.
          </p>
        </div>
        <FooterCol
          title="Producto"
          links={[
            ["Funciones", "#producto"],
            ["Casos de uso", "#casos"],
            ["Comparativa", "#comparativa"],
            ["Precios", "#precios"],
          ]}
        />
        <FooterCol
          title="Cuenta"
          links={[
            ["Iniciar sesión", "/login"],
            ["Crear cuenta", "/register"],
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            ["Términos", "/terminos"],
            ["Privacidad", "/privacidad"],
            ["Seguridad", "/seguridad"],
          ]}
        />
      </div>
      <div className="border-t border-slate-200">
        <p className="mx-auto max-w-[1200px] px-4 py-6 text-sm text-slate-500 sm:px-6">
          © {new Date().getFullYear()} Zentro · Sistema operativo para emprendedores.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-slate-500 transition-colors hover:text-slate-900">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Sección de casos de uso (envoltura del componente cliente) ── */

export function UseCasesSection({ children }: { children: React.ReactNode }) {
  return (
    <section id="casos" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Overline>Para ti</Overline>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Hecho para tu tipo de negocio.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Elige tu perfil y descubre qué gana tu negocio con Zentro.
          </p>
        </Reveal>
        <Reveal delay={100} className="mt-10">
          {children}
        </Reveal>
      </div>
    </section>
  );
}

/* ── FAQ (envoltura) ─────────────────────────────────────────── */

export function FaqSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Overline>Dudas</Overline>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Preguntas frecuentes
          </h2>
        </Reveal>
        <Reveal delay={100} className="mt-10">
          {children}
        </Reveal>
      </div>
    </section>
  );
}

/* ── Sticky CTA móvil ────────────────────────────────────────── */

export function MobileStickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 p-3 backdrop-blur-md md:hidden">
      <Link
        href="/register"
        className="flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 text-base font-semibold text-white"
      >
        Empieza gratis <Icon.arrow size={18} />
      </Link>
    </div>
  );
}
