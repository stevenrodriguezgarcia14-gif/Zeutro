import { ZentroMark } from "./Logo";
import { Icon } from "./icons";

/** Mockup realista del panel de Zentro con el Centro de Prioridades como protagonista. */
export function DashboardMockup({ dark = false }: { dark?: boolean }) {
  const shell = dark
    ? "bg-ink-800 border-white/10"
    : "bg-white border-slate-200";
  const sub = dark ? "text-slate-400" : "text-slate-500";
  const title = dark ? "text-white" : "text-slate-900";
  const panel = dark ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200";

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)] ${shell}`}
    >
      {/* Barra de navegador */}
      <div
        className={`flex items-center gap-2 border-b px-4 py-3 ${
          dark ? "border-white/10" : "border-slate-200"
        }`}
      >
        <span className="h-3 w-3 rounded-full bg-slate-300" />
        <span className="h-3 w-3 rounded-full bg-slate-300" />
        <span className="h-3 w-3 rounded-full bg-slate-300" />
        <div
          className={`ml-3 flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs ${
            dark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
          }`}
        >
          <Icon.lock size={12} /> app.zentro.com/prioridades
        </div>
      </div>

      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[170px_1fr]">
        {/* Sidebar */}
        <aside
          className={`hidden flex-col gap-1 border-r p-3 sm:flex ${
            dark ? "border-white/10" : "border-slate-200"
          }`}
        >
          <div className={`mb-2 flex items-center gap-2 px-1 ${title}`}>
            <ZentroMark size={20} />
            <span className="font-display text-sm font-bold">Zentro</span>
          </div>
          {[
            { i: <Icon.target size={15} />, t: "Prioridades", active: true },
            { i: <Icon.users size={15} />, t: "Clientes" },
            { i: <Icon.trending size={15} />, t: "Ventas" },
            { i: <Icon.wallet size={15} />, t: "Cobros" },
            { i: <Icon.cart size={15} />, t: "Compras" },
            { i: <Icon.chart size={15} />, t: "Finanzas" },
          ].map((n) => (
            <div
              key={n.t}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium ${
                n.active
                  ? "bg-brand/10 text-brand"
                  : dark
                    ? "text-slate-400"
                    : "text-slate-500"
              }`}
            >
              {n.i}
              {n.t}
            </div>
          ))}
        </aside>

        {/* Contenido */}
        <div className="p-4 sm:p-5">
          {/* KPIs */}
          <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { l: "Por cobrar hoy", v: "$4.250", c: "text-brand" },
              { l: "Ventas del mes", v: "$28.6k", c: title },
              { l: "Ganancia real", v: "37%", c: "text-brand" },
            ].map((k) => (
              <div key={k.l} className={`rounded-xl border p-2.5 sm:p-3 ${panel}`}>
                <p className={`text-[10px] sm:text-xs ${sub}`}>{k.l}</p>
                <p className={`mt-0.5 text-sm font-bold sm:text-lg ${k.c}`}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Centro de prioridades */}
          <div className="mb-2 flex items-center gap-2">
            <Icon.target size={15} className="text-brand" />
            <p className={`text-xs font-semibold sm:text-sm ${title}`}>
              Qué hacer hoy
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              {
                t: "Cobrar factura #1042 — Marina Diseño",
                meta: "Vencida hace 2 días · $1.800",
                tag: "Vencido",
                tagClass: "bg-danger/10 text-danger",
              },
              {
                t: "Enviar cotización a Comercial López",
                meta: "Lead caliente · estimado $3.200",
                tag: "Oportunidad",
                tagClass: "bg-brand/10 text-brand",
              },
              {
                t: "Recordatorio de pago — Tienda Sol",
                meta: "Vence mañana · $650",
                tag: "Por vencer",
                tagClass: "bg-warning/10 text-warning",
              },
            ].map((row) => (
              <div
                key={row.t}
                className={`flex items-center gap-3 rounded-xl border p-2.5 sm:p-3 ${panel}`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    dark ? "border-white/20" : "border-slate-300"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-xs font-medium sm:text-sm ${title}`}>
                    {row.t}
                  </p>
                  <p className={`truncate text-[10px] sm:text-xs ${sub}`}>{row.meta}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold sm:text-[10px] ${row.tagClass}`}
                >
                  {row.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
