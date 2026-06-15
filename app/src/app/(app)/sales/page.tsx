import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { moveOpportunity, deleteOpportunity } from "./actions";

type Stage = { id: string; name: string; position: number; probability_bps: number; is_won: boolean; is_lost: boolean };
type Opp = {
  id: string;
  title: string;
  amount_minor: number;
  expected_close_date: string | null;
  stage_id: string;
  prospect_name: string | null;
  customers: { legal_name: string } | null;
};

export default async function SalesPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();

  const { data: pipelineId } = await supabase.rpc("ensure_default_pipeline");

  const [{ data: stages }, { data: opps }] = await Promise.all([
    supabase.from("stages").select("*").eq("pipeline_id", pipelineId).order("position"),
    supabase
      .from("opportunities")
      .select("id, title, amount_minor, expected_close_date, stage_id, prospect_name, customers(legal_name)")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ]);

  const stageList = (stages ?? []) as Stage[];
  const oppList = (opps ?? []) as unknown as Opp[];
  const stageById = new Map(stageList.map((s) => [s.id, s]));

  const weighted = oppList.reduce((sum, o) => {
    const st = stageById.get(o.stage_id);
    return sum + Math.round((o.amount_minor * (st?.probability_bps ?? 0)) / 10000);
  }, 0);
  const totalOpen = oppList.reduce((s, o) => s + o.amount_minor, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ventas (Embudo)</h1>
          <p className="mt-1 text-sm text-slate-500">{oppList.length} oportunidad(es) abiertas</p>
        </div>
        <Link href="/sales/new" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          + Nueva oportunidad
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Valor total en el embudo</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(totalOpen, currency)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pronóstico ponderado</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(weighted, currency)}</p>
          <p className="mt-1 text-xs text-slate-400">Según la probabilidad de cada etapa</p>
        </div>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {stageList.map((stage) => {
          const items = oppList.filter((o) => o.stage_id === stage.id);
          const colTotal = items.reduce((s, o) => s + o.amount_minor, 0);
          return (
            <div key={stage.id} className="w-72 flex-shrink-0">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-semibold text-slate-700">{stage.name}</p>
                <span className="text-xs text-slate-400">{Math.round(stage.probability_bps / 100)}%</span>
              </div>
              <p className="px-1 text-xs text-slate-400">{formatMoney(colTotal, currency)}</p>
              <div className="mt-2 space-y-2">
                {items.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-400">Vacío</p>}
                {items.map((o) => (
                  <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-medium text-slate-900">{o.title}</p>
                    <p className="text-xs text-slate-500">{o.customers?.legal_name ?? o.prospect_name ?? "—"}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(o.amount_minor, currency)}</p>
                    {o.expected_close_date && <p className="text-xs text-slate-400">cierra {o.expected_close_date}</p>}
                    <form action={moveOpportunity} className="mt-2 flex items-center gap-1">
                      <input type="hidden" name="opportunity_id" value={o.id} />
                      <select name="stage_id" defaultValue={o.stage_id} className="flex-1 rounded-lg border border-slate-300 px-1.5 py-1 text-xs outline-none focus:border-slate-900">
                        {stageList.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Mover</button>
                    </form>
                    <form action={deleteOpportunity} className="mt-1 text-right">
                      <input type="hidden" name="opportunity_id" value={o.id} />
                      <button className="text-xs text-slate-400 hover:text-red-600">Eliminar</button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
