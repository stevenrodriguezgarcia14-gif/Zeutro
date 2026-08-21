import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { addInteraction } from "./actions";
import { deleteCustomer } from "../actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { DocUploader } from "@/components/DocUploader";
import { deleteDocument } from "@/app/(app)/documents/actions";

const INV_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-slate-100 text-slate-600" },
  issued: { label: "Emitida", cls: "bg-blue-100 text-blue-700" },
  partially_paid: { label: "Pago parcial", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Pagada", cls: "bg-green-100 text-green-700" },
  overdue: { label: "Vencida", cls: "bg-red-100 text-red-700" },
  void: { label: "Anulada", cls: "bg-slate-100 text-slate-400" },
  credited: { label: "Con NC", cls: "bg-slate-100 text-slate-500" },
};

const INT_TYPE: Record<string, string> = {
  call: "📞 Llamada",
  meeting: "🤝 Reunión",
  email: "✉️ Correo",
  whatsapp: "💬 WhatsApp",
  note: "📝 Nota",
  visit: "📍 Visita",
};

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

const PROJ_STATUS: Record<string, string> = {
  planning: "Planeación",
  active: "Activo",
  on_hold: "En pausa",
  completed: "Completado",
  cancelled: "Cancelado",
};

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();

  const [{ data: customer }, { data: invoices }, { data: payments }, { data: interactions }, { data: projects }, { data: docs }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase
      .from("invoices")
      .select("id, number, issue_date, due_date, total_minor, balance_minor, status")
      .eq("customer_id", id)
      .order("issue_date", { ascending: false }),
    supabase.from("payments").select("amount_minor").eq("customer_id", id),
    supabase
      .from("interactions")
      .select("id, type, subject, body, occurred_at")
      .eq("customer_id", id)
      .order("occurred_at", { ascending: false })
      .limit(50),
    supabase
      .from("projects")
      .select("id, name, status, end_date")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select("id, name, file_path, created_at")
      .eq("entity_type", "customer")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!customer) notFound();

  const projs = (projects ?? []) as { id: string; name: string; status: string; end_date: string | null }[];
  const documents = (docs ?? []) as { id: string; name: string; file_path: string; created_at: string }[];
  // URLs firmadas temporales (el bucket de documentos es privado).
  const signedDocs = await Promise.all(documents.map((d) => supabase.storage.from("documents").createSignedUrl(d.file_path, 3600)));
  const docUrl = new Map(documents.map((d, i) => [d.id, signedDocs[i].data?.signedUrl ?? null]));
  const back = `/customers/${id}`;

  const invs = invoices ?? [];
  const billed = invs
    .filter((i) => !["draft", "void"].includes(i.status))
    .reduce((s, i) => s + i.total_minor, 0);
  const collected = (payments ?? []).reduce((s, p) => s + p.amount_minor, 0);
  const outstanding = invs
    .filter((i) => !["paid", "void"].includes(i.status))
    .reduce((s, i) => s + i.balance_minor, 0);

  return (
    <div>
      <Link href="/customers" className="text-sm text-slate-500 hover:underline">
        ← Clientes
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{customer.legal_name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {customer.type === "company" ? "Empresa" : "Persona"}
            {customer.tax_id ? ` · ${customer.tax_id}` : ""} · {customer.status}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {customer.email && <span>✉️ {customer.email}</span>}
            {customer.phone && <span>📞 {customer.phone}</span>}
            {customer.whatsapp && <span>💬 {customer.whatsapp}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Editar
          </Link>
          <Link
            href={`/invoices/new?customer=${customer.id}`}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Nueva factura
          </Link>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Facturado" value={formatMoney(billed, currency)} />
        <Card title="Cobrado (histórico)" value={formatMoney(collected, currency)} />
        <Card title="Por cobrar" value={formatMoney(outstanding, currency)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Facturas */}
        <div>
          <h2 className="mb-2 font-semibold text-slate-900">Facturas</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            {invs.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">Sin facturas todavía.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {invs.map((i) => {
                    const st = INV_STATUS[i.status] ?? INV_STATUS.draft;
                    return (
                      <tr key={i.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link href={`/invoices/${i.id}`} className="font-medium text-slate-900 hover:underline">
                            {i.number}
                          </Link>
                          <div className="text-xs text-slate-400">vence {i.due_date}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-medium text-slate-900">{formatMoney(i.total_minor, currency)}</div>
                          {i.balance_minor > 0 && (
                            <div className="text-xs text-red-600">saldo {formatMoney(i.balance_minor, currency)}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Interacciones */}
        <div>
          <h2 className="mb-2 font-semibold text-slate-900">Historial de contacto</h2>
          <form action={addInteraction} className="rounded-2xl border border-slate-200 bg-white p-4">
            <input type="hidden" name="customer_id" value={customer.id} />
            <div className="flex gap-2">
              <select name="type" defaultValue="note" className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900">
                <option value="note">Nota</option>
                <option value="call">Llamada</option>
                <option value="meeting">Reunión</option>
                <option value="email">Correo</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="visit">Visita</option>
              </select>
              <input
                name="subject"
                placeholder="Asunto (opcional)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <textarea
              name="body"
              rows={2}
              placeholder="¿Qué pasó? (ej. quedó de pagar el viernes)"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
            <button className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Registrar
            </button>
          </form>

          <ul className="mt-4 space-y-3">
            {(interactions ?? []).length === 0 ? (
              <li className="text-sm text-slate-500">Aún no hay interacciones registradas.</li>
            ) : (
              (interactions ?? []).map((it) => (
                <li key={it.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{INT_TYPE[it.type] ?? it.type}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(it.occurred_at).toLocaleDateString("es")}
                    </span>
                  </div>
                  {it.subject && <p className="mt-1 font-medium text-slate-900">{it.subject}</p>}
                  {it.body && <p className="mt-0.5 text-slate-600">{it.body}</p>}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Trabajos de este cliente</h2>
          <Link href={`/projects/new`} className="text-sm font-medium text-slate-700 underline hover:text-slate-900">+ Nuevo trabajo</Link>
        </div>
        {projs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sin trabajos abiertos para este cliente.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {projs.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <Link href={`/projects/${p.id}`} className="font-medium text-slate-900 hover:underline">{p.name}</Link>
                <span className="text-xs text-slate-400">{PROJ_STATUS[p.status] ?? p.status}{p.end_date ? ` · entrega ${p.end_date}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-900">Documentos del cliente</h2>
            <p className="mt-1 text-xs text-slate-400">Cédula, contrato marco, correos importantes. Lo que sea de un trabajo concreto va mejor en la ficha de ese trabajo.</p>
          </div>
          {org && <DocUploader orgId={org.id} entityType="customer" entityId={customer.id} label="+ Subir archivo" />}
        </div>
        {documents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sin archivos todavía.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 flex-1 truncate">
                  {docUrl.get(d.id) ? (
                    <a href={docUrl.get(d.id)!} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 hover:underline">{d.name}</a>
                  ) : (
                    <span className="text-slate-900">{d.name}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-slate-400">{new Date(d.created_at).toLocaleDateString("es")}</span>
                <form action={deleteDocument} className="shrink-0">
                  <input type="hidden" name="doc_id" value={d.id} />
                  <input type="hidden" name="redirect_to" value={back} />
                  <ConfirmSubmit message="¿Eliminar este archivo? No se puede deshacer." className="text-xs text-slate-300 hover:text-red-600">✕</ConfirmSubmit>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={deleteCustomer} className="mt-8">
        <input type="hidden" name="id" value={customer.id} />
        <ConfirmSubmit message="¿Eliminar este cliente? Si tiene facturas u otros registros no se podrá borrar; en ese caso cámbialo a 'inactivo'." className="text-sm text-red-600 hover:underline">
          Eliminar cliente
        </ConfirmSubmit>
      </form>
    </div>
  );
}
