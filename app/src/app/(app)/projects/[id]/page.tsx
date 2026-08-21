import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, getOrgToday } from "@/lib/org";
import { formatMoney, fromMinor } from "@/lib/money";
import { defaultVatPct } from "@/lib/tax";
import { updateProjectStatus, deleteProject, createProjectInvoice, updateProject, setProjectWarranty } from "../actions";
import { createTask, toggleTask, deleteTask } from "@/app/(app)/tasks/actions";
import { createExpense } from "@/app/(app)/expenses/actions";
import { deleteDocument } from "@/app/(app)/documents/actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { ProjectInvoiceForm } from "@/components/ProjectInvoiceForm";
import { DocUploader } from "@/components/DocUploader";

const STATUSES = [
  { v: "planning", l: "Planeación" },
  { v: "active", l: "Activo" },
  { v: "on_hold", l: "En pausa" },
  { v: "completed", l: "Completado" },
  { v: "cancelled", l: "Cancelado" },
];
const PRIO: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Urgente", cls: "bg-red-100 text-red-700" },
  high: { label: "Alta", cls: "bg-amber-100 text-amber-700" },
  medium: { label: "Media", cls: "bg-slate-100 text-slate-600" },
  low: { label: "Baja", cls: "bg-slate-100 text-slate-400" },
};
const Q_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-slate-100 text-slate-600" },
  sent: { label: "Enviada", cls: "bg-blue-100 text-blue-700" },
  accepted: { label: "Aceptada", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazada", cls: "bg-red-100 text-red-700" },
  expired: { label: "Vencida", cls: "bg-amber-100 text-amber-700" },
  converted: { label: "Facturada", cls: "bg-slate-900 text-white" },
};
const I_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-slate-100 text-slate-600" },
  issued: { label: "Emitida", cls: "bg-blue-100 text-blue-700" },
  partially_paid: { label: "Pago parcial", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Pagada", cls: "bg-green-100 text-green-700" },
  overdue: { label: "Vencida", cls: "bg-red-100 text-red-700" },
  void: { label: "Anulada", cls: "bg-slate-100 text-slate-400" },
  credited: { label: "Con NC", cls: "bg-slate-100 text-slate-500" },
};

function Card({ title, value, tone = "default", hint, bar }: {
  title: string;
  value: string;
  tone?: "default" | "good" | "bad" | "muted";
  hint?: string;
  bar?: { pct: number; bad?: boolean };
}) {
  const cls = tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-600" : tone === "muted" ? "text-slate-400" : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${cls}`}>{value}</p>
      {bar && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full ${bar.bad ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, Math.max(0, bar.pct))}%` }} />
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default async function ProjectDetailPage({
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
  const hoy = await getOrgToday();
  const supabase = await createClient();

  const [
    { data: project },
    { data: tasks },
    { data: projExpenses },
    { data: projInvoices },
    { data: projQuotations },
    { data: docs },
    { data: accounts },
    { data: customers },
  ] = await Promise.all([
    supabase.from("projects").select("*, customers(id, legal_name)").eq("id", id).single(),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("project_id", id)
      .order("status")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("expenses")
      .select("id, description, category, vendor, amount_minor, expense_date, payment_status")
      .eq("project_id", id)
      .order("expense_date", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, number, issue_date, subtotal_minor, total_minor, paid_minor, status")
      .eq("project_id", id)
      .order("issue_date", { ascending: false }),
    supabase
      .from("quotations")
      .select("id, number, issue_date, subtotal_minor, total_minor, status, cost_minor")
      .eq("project_id", id)
      .order("issue_date", { ascending: true }),
    supabase
      .from("documents")
      .select("id, name, file_path, size_bytes, created_at")
      .eq("entity_type", "project")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("accounts").select("id, name").eq("is_active", true).order("name"),
    supabase.from("customers").select("id, legal_name").order("legal_name"),
  ]);
  if (!project) notFound();

  // Responsables posibles. Solo se muestra el selector si el negocio tiene
  // más de una persona: para quien trabaja solo sería una casilla inútil.
  const { data: members } = org
    ? await supabase.rpc("list_org_members", { p_org: org.id })
    : { data: null };
  const team = (members ?? []) as { user_id: string; email: string; role: string }[];

  const back = `/projects/${id}`;
  const ts = (tasks ?? []) as { id: string; title: string; status: string; priority: string; due_date: string | null }[];
  const total = ts.length;
  const done = ts.filter((t) => t.status === "done").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const accs = (accounts ?? []) as { id: string; name: string }[];
  const custs = (customers ?? []) as { id: string; legal_name: string }[];
  const exps = (projExpenses ?? []) as { id: string; description: string; category: string | null; vendor: string | null; amount_minor: number; expense_date: string; payment_status: string }[];
  const invs = (projInvoices ?? []) as { id: string; number: string; issue_date: string; subtotal_minor: number; total_minor: number; paid_minor: number; status: string }[];
  const quos = (projQuotations ?? []) as { id: string; number: string; issue_date: string; subtotal_minor: number; total_minor: number; status: string; cost_minor: number | null }[];
  const documents = (docs ?? []) as { id: string; name: string; file_path: string; size_bytes: number | null; created_at: string }[];

  // URLs firmadas temporales (el bucket de documentos es privado).
  const signed = await Promise.all(documents.map((d) => supabase.storage.from("documents").createSignedUrl(d.file_path, 3600)));
  const urlById = new Map(documents.map((d, i) => [d.id, signed[i].data?.signedUrl ?? null]));

  // ---- Los cuatro números que deciden si el trabajo vale la pena ----------
  //
  // PRECIO: sale de las cotizaciones que el cliente aceptó, no de un campo
  // suelto. Así los adicionales aprobados suman solos y nadie tiene que
  // acordarse de actualizar un total a mano.
  const acceptedQuos = quos.filter((q) => ["accepted", "converted"].includes(q.status));
  const quotedNet = acceptedQuos.reduce((s, q) => s + (q.subtotal_minor ?? 0), 0);
  const quotedTotal = acceptedQuos.reduce((s, q) => s + (q.total_minor ?? 0), 0);
  const adicionales = Math.max(0, acceptedQuos.length - 1);

  // COSTO: lo estimado (budget_amount_minor) contra lo realmente gastado.
  const budget = project.budget_amount_minor as number | null;
  const spent = exps.reduce((s, e) => s + (e.amount_minor ?? 0), 0);
  const budgetPct = budget && budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const overBudget = budget != null && budget > 0 && spent > budget;

  // FACTURADO y COBRADO (las anuladas no cuentan).
  const vivas = invs.filter((i) => i.status !== "void");
  const invoicedNet = vivas.reduce((s, i) => s + (i.subtotal_minor ?? 0), 0);
  const invoicedTotal = vivas.reduce((s, i) => s + (i.total_minor ?? 0), 0);
  const collected = vivas.reduce((s, i) => s + (i.paid_minor ?? 0), 0);
  const porCobrar = invoicedTotal - collected;

  // GANANCIA: facturado SIN impuestos menos lo gastado. Se usa el neto
  // porque el IVA que cobras no es tuyo; contarlo inflaría la ganancia.
  const gananciaReal = invoicedNet - spent;
  const marginPct = invoicedNet > 0 ? Math.round((gananciaReal / invoicedNet) * 100) : 0;
  // Y la proyección: lo que debería quedar si todo sale según lo cotizado.
  const gananciaProyectada = quotedNet > 0 && budget != null ? quotedNet - budget : null;

  const warranty = project.warranty_until as string | null;
  const warrantyVencida = warranty != null && warranty < hoy;

  return (
    <div>
      <Link href="/projects" className="text-sm text-slate-500 hover:underline">← Proyectos</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {project.customers?.legal_name ?? "Sin cliente"}
            {project.start_date ? ` · inicio ${project.start_date}` : ""}
            {project.end_date ? ` · entrega ${project.end_date}` : ""}
          </p>
          {project.site_address && <p className="mt-0.5 text-sm text-slate-500">📍 {project.site_address}</p>}
          {warranty && (
            <p className={`mt-0.5 text-sm ${warrantyVencida ? "text-slate-400" : "text-emerald-700"}`}>
              🛡️ Garantía {warrantyVencida ? "vencida el" : "hasta el"} {warranty}
            </p>
          )}
        </div>
        <form action={updateProjectStatus} className="flex items-center gap-2">
          <input type="hidden" name="project_id" value={project.id} />
          <select name="status" defaultValue={project.status} className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900">
            {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Guardar</button>
        </form>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* ---------------- Los cuatro números ---------------- */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Precio del trabajo"
          value={quotedTotal > 0 ? formatMoney(quotedTotal, currency) : "—"}
          tone={quotedTotal > 0 ? "default" : "muted"}
          hint={
            quotedTotal > 0
              ? `${acceptedQuos.length} cotización(es) aceptada(s)${adicionales > 0 ? ` · ${adicionales} adicional(es)` : ""}`
              : "Aún sin cotización aceptada"
          }
        />
        <Card
          title="Costo: estimado vs gastado"
          value={formatMoney(spent, currency)}
          tone={overBudget ? "bad" : "default"}
          bar={{ pct: budget ? budgetPct : 0, bad: overBudget }}
          hint={budget != null ? `de ${formatMoney(budget, currency)} estimado${overBudget ? " · ⚠️ excedido" : ""}` : "Sin costo estimado"}
        />
        <Card
          title="Facturado / cobrado"
          value={formatMoney(invoicedTotal, currency)}
          hint={`Cobrado ${formatMoney(collected, currency)}${porCobrar > 0 ? ` · por cobrar ${formatMoney(porCobrar, currency)}` : ""}`}
        />
        <Card
          title="Ganancia"
          value={invoicedNet > 0 || spent > 0 ? `${formatMoney(gananciaReal, currency)}` : "—"}
          tone={invoicedNet === 0 && spent === 0 ? "muted" : gananciaReal >= 0 ? "good" : "bad"}
          hint={
            invoicedNet > 0
              ? `Facturado sin impuestos − gastado · ${marginPct}%${gananciaProyectada != null ? ` · proyectada ${formatMoney(gananciaProyectada, currency)}` : ""}`
              : "Facturado sin impuestos − gastado"
          }
        />
      </div>

      {/* Avisos que evitan que los números de arriba mientan. */}
      {exps.length === 0 && (invoicedNet > 0 || quotedTotal > 0) && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Todavía no ligaste ningún gasto a este trabajo, así que la ganancia que ves está inflada. Registra abajo los
          materiales, la mano de obra y los subcontratos.
        </p>
      )}
      {budget == null && (
        <p className="mt-3 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
          Este trabajo no tiene <b>costo estimado</b>. Sin él no se puede avisar cuándo te estás pasando. Ponlo en
          &quot;Detalles del trabajo&quot;, más abajo.
        </p>
      )}
      {quotedNet > 0 && invoicedNet < quotedNet && project.status === "completed" && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          El trabajo está marcado como completado pero te falta facturar {formatMoney(quotedNet - invoicedNet, currency)}
          {" "}(sin impuestos) de lo acordado.
        </p>
      )}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Avance de tareas</span>
          <span className="font-medium text-slate-900">{done}/{total} · {pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-slate-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* ---------------- Cobrar ---------------- */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Cobrar un avance</h2>
        <p className="mt-1 text-xs text-slate-400">
          Un trabajo casi nunca se cobra de una sola vez: primero el anticipo, luego los avances y al final la
          liquidación. Cada cobro genera su propia factura ligada a este trabajo.
        </p>
        <div className="mt-4">
          <ProjectInvoiceForm
            projectId={project.id}
            projectName={project.name}
            currency={currency}
            quotedNetMinor={quotedNet}
            invoicedNetMinor={invoicedNet}
            defaultTaxPct={defaultVatPct(org?.country)}
            action={createProjectInvoice}
          />
        </div>

        {invs.length > 0 && (
          <div className="mt-6 overflow-x-auto border-t border-slate-100 pt-4">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Factura</th>
                  <th className="py-2 font-medium">Fecha</th>
                  <th className="py-2 font-medium text-right">Total</th>
                  <th className="py-2 font-medium text-right">Cobrado</th>
                  <th className="py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invs.map((i) => {
                  const st = I_STATUS[i.status] ?? I_STATUS.draft;
                  return (
                    <tr key={i.id}>
                      <td className="py-2"><Link href={`/invoices/${i.id}`} className="font-medium text-slate-900 hover:underline">{i.number}</Link></td>
                      <td className="py-2 text-slate-500">{i.issue_date}</td>
                      <td className="py-2 text-right text-slate-900">{formatMoney(i.total_minor, currency)}</td>
                      <td className="py-2 text-right text-slate-600">{formatMoney(i.paid_minor, currency)}</td>
                      <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------------- Cotizaciones y adicionales ---------------- */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-900">Cotizaciones y adicionales</h2>
            <p className="mt-1 text-xs text-slate-400">
              Todo cambio que pida el cliente se cotiza aquí antes de hacerlo. Es la única forma de cobrarlo después sin
              discutir.
            </p>
          </div>
          <Link
            href={`/quotations/new?project=${project.id}${project.customers?.id ? `&customer=${project.customers.id}` : ""}`}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Cotizar un cambio
          </Link>
        </div>

        {quos.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Este trabajo no tiene cotizaciones ligadas. Sin ellas, Zentro no sabe cuál es el precio acordado.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Cotización</th>
                  <th className="py-2 font-medium">Fecha</th>
                  <th className="py-2 font-medium text-right">Total</th>
                  <th className="py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quos.map((q, i) => {
                  const st = Q_STATUS[q.status] ?? Q_STATUS.draft;
                  return (
                    <tr key={q.id}>
                      <td className="py-2">
                        <Link href={`/quotations/${q.id}`} className="font-medium text-slate-900 hover:underline">{q.number}</Link>
                        {i > 0 && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">adicional</span>}
                      </td>
                      <td className="py-2 text-slate-500">{q.issue_date}</td>
                      <td className="py-2 text-right text-slate-900">{formatMoney(q.total_minor, currency)}</td>
                      <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------------- Gastos ---------------- */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Gastos del trabajo</h2>
        <p className="mt-1 text-xs text-slate-400">
          Materiales, mano de obra, subcontratos, acarreos. Todo lo que registres aquí se descuenta de la ganancia de
          este trabajo (y solo de este).
        </p>
        <form action={createExpense} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="project_id" value={project.id} />
          <input type="hidden" name="redirect_to" value={back} />
          <div className="min-w-44 flex-1"><input name="description" required placeholder="Ej. cemento y arena, cuadrilla semana 2, electricista" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" /></div>
          <input name="category" list="cats-obra" placeholder="Categoría" className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
          <input name="amount" type="number" step="0.01" min="0" required placeholder="0.00" className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-slate-900" />
          <input name="expense_date" type="date" defaultValue={hoy} className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900" />
          <select name="payment_status" defaultValue="paid" className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900">
            <option value="paid">Pagado</option>
            <option value="pending">Pendiente</option>
          </select>
          <select name="account_id" defaultValue="" className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900" title="Cuenta de la que sale el dinero">
            <option value="">Sin cuenta</option>
            {accs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Registrar gasto</button>
        </form>
        <datalist id="cats-obra">
          {["Materiales de obra", "Mano de obra", "Subcontratos", "Acarreo / transporte", "Alquiler de equipo", "Herramienta", "Permisos y pólizas", "Combustible", "Otros"].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        {exps.length > 0 && (
          <div className="mt-5 overflow-x-auto border-t border-slate-100 pt-4">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Concepto</th>
                  <th className="py-2 font-medium">Categoría</th>
                  <th className="py-2 font-medium">Fecha</th>
                  <th className="py-2 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exps.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 text-slate-900">
                      {e.description}
                      {e.payment_status === "pending" && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">por pagar</span>}
                    </td>
                    <td className="py-2 text-slate-500">{e.category ?? "—"}</td>
                    <td className="py-2 text-slate-500">{e.expense_date}</td>
                    <td className="py-2 text-right font-medium text-slate-900">{formatMoney(e.amount_minor, currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200">
                  <td colSpan={3} className="py-2 text-right text-slate-500">Total gastado</td>
                  <td className="py-2 text-right font-bold text-slate-900">{formatMoney(spent, currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ---------------- Tareas ---------------- */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Etapas y tareas</h2>
        <form action={createTask} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="project_id" value={project.id} />
          <input type="hidden" name="redirect_to" value={back} />
          <div className="min-w-48 flex-1"><input name="title" required placeholder="Ej. Demolición, Obra gris, Entrega final" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" /></div>
          <select name="priority" defaultValue="medium" className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900">
            <option value="urgent">Urgente</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option>
          </select>
          <input name="due_date" type="date" className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900" />
          {team.length > 1 && (
            <select name="assignee_id" defaultValue="" className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900" title="Responsable">
              <option value="">Responsable: yo</option>
              {team.map((m) => <option key={m.user_id} value={m.user_id}>{m.email}</option>)}
            </select>
          )}
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Agregar</button>
        </form>

        <div className="mt-3">
          {ts.length === 0 && <p className="py-4 text-sm text-slate-500">Sin tareas. Agrega las etapas del trabajo arriba: el avance del trabajo se calcula con ellas.</p>}
          {ts.map((t) => {
            const isDone = t.status === "done";
            const p = PRIO[t.priority] ?? PRIO.medium;
            return (
              <div key={t.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                <div className="flex items-center gap-2">
                  <form action={toggleTask}>
                    <input type="hidden" name="task_id" value={t.id} />
                    <input type="hidden" name="done" value={isDone ? "0" : "1"} />
                    <input type="hidden" name="redirect_to" value={back} />
                    <button className={`flex h-5 w-5 items-center justify-center rounded border ${isDone ? "border-green-600 bg-green-600 text-white" : "border-slate-300"}`}>{isDone ? "✓" : ""}</button>
                  </form>
                  <div>
                    <p className={`text-sm ${isDone ? "text-slate-400 line-through" : "text-slate-900"}`}>{t.title}</p>
                    <div className="flex items-center gap-2 text-xs">
                      {!isDone && <span className={`rounded-full px-1.5 py-0.5 ${p.cls}`}>{p.label}</span>}
                      {t.due_date && <span className="text-slate-400">📅 {t.due_date}</span>}
                    </div>
                  </div>
                </div>
                <form action={deleteTask}>
                  <input type="hidden" name="task_id" value={t.id} />
                  <input type="hidden" name="redirect_to" value={back} />
                  <button className="text-xs text-slate-300 hover:text-red-600">✕</button>
                </form>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- Documentos ---------------- */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-slate-900">Fotos y documentos</h2>
            <p className="mt-1 text-xs text-slate-400">
              Fotos del antes y el después, medidas, contrato firmado, permisos, comprobantes. Todo pegado a este
              trabajo en vez de perdido en la galería del teléfono.
            </p>
          </div>
          {org && <DocUploader orgId={org.id} entityType="project" entityId={project.id} label="+ Subir archivo" />}
        </div>

        {documents.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Sin archivos todavía.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 flex-1 truncate">
                  {urlById.get(d.id) ? (
                    <a href={urlById.get(d.id)!} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 hover:underline">{d.name}</a>
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

      {/* ---------------- Garantía ---------------- */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Garantía</h2>
        <p className="mt-1 text-xs text-slate-400">
          Se cuenta desde la fecha de entrega del trabajo (o desde hoy si no la pusiste) y te crea el recordatorio de
          revisión, que aparecerá solo en tus prioridades.
        </p>
        <form action={setProjectWarranty} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="project_id" value={project.id} />
          <select name="months" defaultValue="6" className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900">
            <option value="3">3 meses</option>
            <option value="6">6 meses</option>
            <option value="12">1 año</option>
            <option value="24">2 años</option>
            <option value="0">Sin garantía</option>
          </select>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {warranty ? "Actualizar garantía" : "Activar garantía"}
          </button>
        </form>
      </section>

      {/* ---------------- Detalles editables ---------------- */}
      <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <summary className="cursor-pointer font-semibold text-slate-900">Detalles del trabajo</summary>
        <form action={updateProject} className="mt-4 space-y-4">
          <input type="hidden" name="project_id" value={project.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nombre *</label>
              <input name="name" required defaultValue={project.name} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Cliente</label>
              <select name="customer_id" defaultValue={project.customer_id ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900">
                <option value="">— Sin cliente —</option>
                {custs.map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Inicio</label>
              <input name="start_date" type="date" defaultValue={project.start_date ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Entrega</label>
              <input name="end_date" type="date" defaultValue={project.end_date ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Dirección del sitio</label>
            <input name="site_address" defaultValue={project.site_address ?? ""} placeholder="Dónde se ejecuta el trabajo (puede ser distinta a la de cobro)" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Costo estimado del trabajo</label>
            <input name="budget" type="number" step="0.01" min="0" defaultValue={budget != null ? fromMinor(budget) : ""} placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
            <p className="mt-1 text-xs text-slate-400">
              Cuánto calculas que te va a <b>costar</b> hacerlo: materiales, mano de obra, subcontratos. <b>No</b> es el
              precio que le cobras al cliente — ese sale solo de las cotizaciones aceptadas.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Notas</label>
            <textarea name="notes" rows={3} defaultValue={project.notes ?? ""} placeholder="Medidas, acabados acordados, condiciones del sitio, contactos…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
          </div>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Guardar detalles</button>
        </form>
      </details>

      <form action={deleteProject} className="mt-6">
        <input type="hidden" name="project_id" value={project.id} />
        <ConfirmSubmit message="¿Eliminar este trabajo? Sus tareas y vínculos se perderán. Las facturas y gastos NO se borran, pero dejarán de estar ligados." className="text-sm text-red-600 hover:underline">
          Eliminar proyecto
        </ConfirmSubmit>
      </form>
    </div>
  );
}
