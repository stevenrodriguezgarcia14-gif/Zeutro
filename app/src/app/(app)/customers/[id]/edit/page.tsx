import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer } from "../../actions";

export default async function EditCustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: c } = await supabase.from("customers").select("*").eq("id", id).single();
  if (!c) notFound();

  const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900";

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/customers/${id}`} className="text-sm text-slate-500 hover:underline">← {c.legal_name}</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Editar cliente</h1>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form action={updateCustomer} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <input type="hidden" name="id" value={c.id} />
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre *</label>
          <input name="legal_name" required defaultValue={c.legal_name} className={input} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Tipo</label>
            <select name="type" defaultValue={c.type} className={input}>
              <option value="company">Empresa</option>
              <option value="person">Persona</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Estado</label>
            <select name="status" defaultValue={c.status} className={input}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="prospect">Prospecto</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Correo</label>
            <input name="email" type="email" defaultValue={c.email ?? ""} className={input} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Teléfono</label>
            <input name="phone" defaultValue={c.phone ?? ""} className={input} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">WhatsApp</label>
            <input name="whatsapp" defaultValue={c.whatsapp ?? ""} placeholder="Con código de país" className={input} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">RFC / ID fiscal</label>
            <input name="tax_id" defaultValue={c.tax_id ?? ""} className={input} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Condiciones de pago</label>
          <select name="payment_terms" defaultValue={c.payment_terms} className={input}>
            <option value="contado">Contado</option>
            <option value="net15">15 días</option>
            <option value="net30">30 días</option>
            <option value="net60">60 días</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Notas</label>
          <textarea name="notes" rows={2} defaultValue={c.notes ?? ""} className={input} />
        </div>
        <button type="submit" className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
