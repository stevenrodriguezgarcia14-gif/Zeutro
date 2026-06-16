import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "../actions";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: customers } = await supabase.from("customers").select("id, legal_name").order("legal_name");

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/projects" className="text-sm text-slate-500 hover:underline">← Proyectos</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Nuevo proyecto</h1>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form action={createProject} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre *</label>
          <input name="name" required placeholder="Ej. Página web para Juan" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Cliente (opcional)</label>
          <select name="customer_id" defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900">
            <option value="">— Sin cliente —</option>
            {(customers ?? []).map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Inicio</label>
            <input name="start_date" type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Entrega</label>
            <input name="end_date" type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Presupuesto (opcional)</label>
          <input name="budget" type="number" step="0.01" min="0" placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900" />
        </div>
        <button className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800">Crear proyecto</button>
      </form>
    </div>
  );
}
