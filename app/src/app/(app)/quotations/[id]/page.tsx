import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, getOrgToday } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { setQuotationStatus, convertToInvoice, createProjectFromQuotation, emailQuotation, duplicateQuotation } from "../actions";
import { LineItemsTable } from "@/components/LineItems";

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-slate-100 text-slate-600" },
  sent: { label: "Enviada", cls: "bg-blue-100 text-blue-700" },
  accepted: { label: "Aceptada", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazada", cls: "bg-red-100 text-red-700" },
  expired: { label: "Vencida", cls: "bg-amber-100 text-amber-700" },
  converted: { label: "Convertida", cls: "bg-slate-900 text-white" },
};

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={setQuotationStatus}>
      <input type="hidden" name="quotation_id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{label}</button>
    </form>
  );
}

export default async function QuotationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();

  const [{ data: q }, { data: items }] = await Promise.all([
    supabase
      .from("quotations")
      // El embed nombra la llave a proposito: con dos relaciones entre
      // quotations y projects, PostgREST no podia decidir cual usar y la
      // consulta fallaba -> notFound() -> 404 en la ficha (ver 0046).
      .select("*, customers(legal_name, email), projects!quotations_project_id_fkey(id, name)")
      .eq("id", id)
      .single(),
    supabase.from("quotation_items").select("*").eq("quotation_id", id).order("position").order("created_at"),
  ]);
  if (!q) notFound();

  const project = (q.projects as unknown as { id: string; name: string } | null) ?? null;
  const correoCliente = (q.customers as unknown as { email: string | null } | null)?.email ?? null;
  // Costeo privado: el margen se mide contra el subtotal, no contra el total.
  // El IVA que cobras no es tuyo.
  const cost = (q.cost_minor as number | null) ?? 0;
  const gain = q.subtotal_minor - cost;
  const marginPct = q.subtotal_minor > 0 ? Math.round((gain / q.subtotal_minor) * 100) : 0;

  const today = await getOrgToday();
  const isExpired = ["draft", "sent"].includes(q.status) && q.valid_until && q.valid_until < today;
  const st = isExpired ? STATUS.expired : (STATUS[q.status] ?? STATUS.draft);

  return (
    <div>
      <Link href="/quotations" className="text-sm text-slate-500 hover:underline">← Cotizaciones</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cotización {q.number}</h1>
          <p className="mt-1 text-sm text-slate-500">{q.customers?.legal_name} · válida hasta {q.valid_until}</p>
          {project && (
            <p className="mt-1 text-sm text-slate-500">
              📁 Adicional del trabajo{" "}
              <Link href={`/projects/${project.id}`} className="font-medium text-slate-700 underline hover:text-slate-900">
                {project.name}
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${st.cls}`}>{st.label}</span>
          <a href={`/print/quotations/${q.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 underline hover:text-slate-900">Ver / Descargar PDF</a>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {ok === "enviada" && (
        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Cotización enviada a {correoCliente}. 📩
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {q.status === "draft" && <StatusButton id={q.id} status="sent" label="Marcar como enviada" />}
        {(q.status === "sent") && (
          <>
            <StatusButton id={q.id} status="accepted" label="Marcar aceptada" />
            <StatusButton id={q.id} status="rejected" label="Marcar rechazada" />
          </>
        )}
        {["draft", "sent", "accepted"].includes(q.status) && (
          <form action={convertToInvoice}>
            <input type="hidden" name="quotation_id" value={q.id} />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              {q.status === "accepted" ? "Convertir a factura →" : "Aceptar y facturar →"}
            </button>
          </form>
        )}
        {q.status === "converted" && q.invoice_id && (
          <Link href={`/invoices/${q.invoice_id}`} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Ver factura generada →</Link>
        )}
        <form action={duplicateQuotation}>
          <input type="hidden" name="quotation_id" value={q.id} />
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" title="Crea un borrador igual para ajustarlo">
            Duplicar
          </button>
        </form>
        {/* Abrir el trabajo: solo cuando el cliente ya dijo que sí y la
            cotización no pertenece todavía a ningún trabajo. */}
        {!project && ["accepted", "converted"].includes(q.status) && (
          <form action={createProjectFromQuotation}>
            <input type="hidden" name="quotation_id" value={q.id} />
            <button className="rounded-lg border border-slate-900 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
              Abrir el trabajo →
            </button>
          </form>
        )}
      </div>

      <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">📩 Enviar por correo al cliente</summary>
        {correoCliente ? (
          <form action={emailQuotation} className="mt-3 space-y-2">
            <input type="hidden" name="quotation_id" value={q.id} />
            <p className="text-xs text-slate-500">
              Se envía a <b>{correoCliente}</b>, a nombre de tu negocio, con el detalle y las condiciones.
            </p>
            <textarea
              name="message"
              rows={3}
              placeholder="Mensaje para el cliente (opcional). Ej. Buenas, le adjunto el presupuesto de la remodelación. Cualquier consulta me avisa."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Enviar cotización
            </button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Este cliente no tiene correo registrado. Agrégalo en su ficha para poder enviársela desde aquí.
          </p>
        )}
      </details>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <LineItemsTable items={items ?? []} currency={currency} />
      </div>

      <div className="mt-4 flex flex-col items-end gap-1 text-sm">
        <div className="flex w-64 justify-between text-slate-600"><span>Subtotal</span><span>{formatMoney(q.subtotal_minor, currency)}</span></div>
        <div className="flex w-64 justify-between text-slate-600"><span>Impuestos</span><span>{formatMoney(q.tax_minor, currency)}</span></div>
        <div className="flex w-64 justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-900"><span>Total</span><span>{formatMoney(q.total_minor, currency)}</span></div>
      </div>

      {q.notes && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700">Alcance y condiciones</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{q.notes}</p>
        </section>
      )}

      {cost > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700">
            🔒 Tu costo <span className="font-normal text-slate-400">— privado, no sale en el PDF</span>
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><p className="text-xs text-slate-400">Materiales</p><p className="font-medium text-slate-900">{formatMoney(q.cost_materials_minor ?? 0, currency)}</p></div>
            <div><p className="text-xs text-slate-400">Mano de obra</p><p className="font-medium text-slate-900">{formatMoney(q.cost_labor_minor ?? 0, currency)}</p></div>
            <div><p className="text-xs text-slate-400">Subcontratos</p><p className="font-medium text-slate-900">{formatMoney(q.cost_subcontract_minor ?? 0, currency)}</p></div>
            <div><p className="text-xs text-slate-400">Transporte y otros</p><p className="font-medium text-slate-900">{formatMoney(q.cost_other_minor ?? 0, currency)}</p></div>
          </div>
          <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between text-slate-600"><span>Te cuesta</span><span>{formatMoney(cost, currency)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Cobras (sin impuestos)</span><span>{formatMoney(q.subtotal_minor, currency)}</span></div>
            <div className={`flex justify-between border-t border-slate-200 pt-1 text-base font-bold ${gain >= 0 ? "text-green-600" : "text-red-600"}`}>
              <span>Tu ganancia</span><span>{formatMoney(gain, currency)} · {marginPct}%</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
