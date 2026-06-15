import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";

function Card({ title, value, tone = "default", hint }: { title: string; value: string; tone?: "default" | "good" | "bad"; hint?: string }) {
  const cls = tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-600" : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${cls}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default async function ProfitabilityPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const monthStart = new Date().toISOString().slice(0, 7) + "-01";

  const [{ data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("payments").select("amount_minor, paid_at"),
    supabase.from("expenses").select("amount_minor, expense_date, category"),
  ]);

  const pays = payments ?? [];
  const exps = expenses ?? [];

  const incomeTotal = pays.reduce((s, p) => s + (p.amount_minor ?? 0), 0);
  const expenseTotal = exps.reduce((s, e) => s + (e.amount_minor ?? 0), 0);
  const netTotal = incomeTotal - expenseTotal;

  const incomeMonth = pays.filter((p) => p.paid_at >= monthStart).reduce((s, p) => s + (p.amount_minor ?? 0), 0);
  const expenseMonth = exps.filter((e) => e.expense_date >= monthStart).reduce((s, e) => s + (e.amount_minor ?? 0), 0);
  const netMonth = incomeMonth - expenseMonth;

  // ¿En qué se va el dinero? (gastos por categoría)
  const byCat = new Map<string, number>();
  for (const e of exps) {
    const k = e.category?.trim() || "Sin categoría";
    byCat.set(k, (byCat.get(k) ?? 0) + (e.amount_minor ?? 0));
  }
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const recovered = netTotal >= 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Rentabilidad</h1>
      <p className="mt-1 text-sm text-slate-500">Tu inversión, lo recuperado y tu ganancia real.</p>

      {/* Acumulado (todo el tiempo) */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">Desde el inicio</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Ingresos (cobrado)" value={formatMoney(incomeTotal, currency)} tone="good" hint="Todo lo que has cobrado" />
        <Card title="Invertido / gastado" value={formatMoney(expenseTotal, currency)} tone="bad" hint="Todo lo que ha salido (incluye compras y equipo registrados como gasto)" />
        <Card title="Ganancia neta" value={formatMoney(netTotal, currency)} tone={netTotal >= 0 ? "good" : "bad"} hint="Ingresos − gastos" />
      </div>

      {/* Estado de recuperación */}
      <div className={`mt-4 rounded-2xl border p-5 ${recovered ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"}`}>
        {recovered ? (
          <p className="text-green-800">
            ✅ Ya recuperaste todo lo que invertiste y llevas <b>{formatMoney(netTotal, currency)}</b> de ganancia limpia acumulada.
          </p>
        ) : (
          <p className="text-amber-800">
            ⏳ Aún no recuperas tu inversión: te faltan <b>{formatMoney(Math.abs(netTotal), currency)}</b> por cobrar para igualar lo invertido.
          </p>
        )}
      </div>

      {/* Este mes */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Este mes</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Ingresos del mes" value={formatMoney(incomeMonth, currency)} tone="good" />
        <Card title="Gastos del mes" value={formatMoney(expenseMonth, currency)} tone="bad" />
        <Card title="Utilidad del mes" value={formatMoney(netMonth, currency)} tone={netMonth >= 0 ? "good" : "bad"} />
      </div>

      {/* ¿En qué se va el dinero? */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">¿En qué se va el dinero?</h2>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-5">
        {cats.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no has registrado gastos.</p>
        ) : (
          <ul className="space-y-2">
            {cats.map(([cat, amount]) => {
              const pct = expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0;
              return (
                <li key={cat}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{cat}</span>
                    <span className="text-slate-900">{formatMoney(amount, currency)} <span className="text-slate-400">({pct}%)</span></span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-slate-700" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Tip: registra tu inversión inicial (equipo, capital) como un <b>Gasto</b> (ej. categoría “Equipo” o
        “Inversión”) para que aquí se vea cuánto te falta recuperar.
      </p>
    </div>
  );
}
