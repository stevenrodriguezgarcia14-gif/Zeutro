import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createOpportunity } from "../actions";

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: pipelineId } = await supabase.rpc("ensure_default_pipeline");
  const [{ data: stages }, { data: customers }] = await Promise.all([
    supabase.from("stages").select("id, name, position").eq("pipeline_id", pipelineId).order("position"),
    supabase.from("customers").select("id, legal_name").order("legal_name"),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/sales" className="text-sm text-slate-500 hover:underline">← Ventas</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Nueva oportunidad</h1>
      <p className="mt-1 text-sm text-slate-500">Una venta posible. Puede ser de un cliente o de un prospecto nuevo.</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form action={createOpportunity} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <input type="hidden" name="pipeline_id" value={pipelineId ?? ""} />
        <div>
          <label className="block text-sm font-medium text-slate-700">¿Qué quiere comprar? (título) *</label>
          <input name="title" required placeholder="Ej. Pedido de 3 pasteles" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Cliente (si ya existe)</label>
          <select name="customer_id" defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900">
            <option value="">— Es un prospecto nuevo —</option>
            {(customers ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.legal_name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre prospecto</label>
            <input name="prospect_name" placeholder="Si no es cliente aún" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Contacto</label>
            <input name="prospect_contact" placeholder="Tel / correo" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Monto estimado</label>
            <input name="amount" type="number" step="0.01" min="0" placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Etapa</label>
            <select name="stage_id" defaultValue={(stages ?? [])[0]?.id ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900">
              {(stages ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Cierre estimado</label>
            <input name="expected_close_date" type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Origen</label>
            <input name="source" list="fuentes" placeholder="¿De dónde salió?" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
            <datalist id="fuentes">
              <option value="Referido" />
              <option value="Redes sociales" />
              <option value="WhatsApp" />
              <option value="Recomendación" />
              <option value="Publicidad" />
              <option value="Cliente recurrente" />
            </datalist>
          </div>
        </div>
        <button className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800">Guardar oportunidad</button>
      </form>
    </div>
  );
}
