import { createClient } from "@/lib/supabase/server";
import { getProfile, getPlaybook, type ActivationData, type Profile, type Step } from "@/lib/guide";

export type Suggestion = { title: string; desc: string; href: string; cta: string; tone: "alert" | "step" };

export type Activation = {
  profile: Profile;
  data: ActivationData;
  steps: { step: Step; done: boolean }[];
  doneCount: number;
  total: number;
  pct: number;
  suggestions: Suggestion[];
};

async function loadData(): Promise<ActivationData> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const c = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const t = supabase;

  const [
    customers, products, productsWithPrice, purchases, purchaseItems, purchaseItemsWithPrice, resaleSales,
    quotations, invoices, payments, expenses, accounts, opportunities, projects, overdueInvoices, openQuotations,
  ] = await Promise.all([
    c(t.from("customers").select("*", { count: "exact", head: true })),
    c(t.from("products").select("*", { count: "exact", head: true })),
    c(t.from("products").select("*", { count: "exact", head: true }).gt("sale_price_minor", 0)),
    c(t.from("purchases").select("*", { count: "exact", head: true })),
    c(t.from("purchase_items").select("*", { count: "exact", head: true })),
    c(t.from("purchase_items").select("*", { count: "exact", head: true }).gt("sale_price_minor", 0)),
    c(t.from("purchase_items").select("*", { count: "exact", head: true }).gt("units_sold", 0)),
    c(t.from("quotations").select("*", { count: "exact", head: true })),
    c(t.from("invoices").select("*", { count: "exact", head: true })),
    c(t.from("payments").select("*", { count: "exact", head: true })),
    c(t.from("expenses").select("*", { count: "exact", head: true })),
    c(t.from("accounts").select("*", { count: "exact", head: true })),
    c(t.from("opportunities").select("*", { count: "exact", head: true }).eq("status", "open")),
    c(t.from("projects").select("*", { count: "exact", head: true })),
    c(t.from("invoices").select("*", { count: "exact", head: true }).gt("balance_minor", 0).lt("due_date", today).not("status", "in", "(paid,void)")),
    c(t.from("quotations").select("*", { count: "exact", head: true }).eq("status", "sent")),
  ]);

  return { customers, products, productsWithPrice, purchases, purchaseItems, purchaseItemsWithPrice, resaleSales, quotations, invoices, payments, expenses, accounts, opportunities, projects, overdueInvoices, openQuotations };
}

/** Calcula el estado de activación y las sugerencias de siguiente paso. */
export async function getActivation(businessType: string | null | undefined): Promise<Activation> {
  const profile = getProfile(businessType);
  const data = await loadData();
  const playbook = getPlaybook(profile);

  const steps = playbook.map((step) => ({ step, done: step.done(data) }));
  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // Sugerencias: primero alertas según datos reales, luego el siguiente paso de la ruta.
  const suggestions: Suggestion[] = [];

  if (data.overdueInvoices > 0)
    suggestions.push({ title: `Tienes ${data.overdueInvoices} factura(s) vencida(s)`, desc: "Envía recordatorios para cobrar antes de que se enfríe.", href: "/collections", cta: "Ir a Cobranzas", tone: "alert" });
  if (data.products > 0 && data.productsWithPrice < data.products)
    suggestions.push({ title: "Hay productos sin precio de venta", desc: "Sin precio no se calcula tu ganancia real.", href: "/products", cta: "Configurar precios", tone: "alert" });
  if (data.openQuotations > 0)
    suggestions.push({ title: `${data.openQuotations} cotización(es) sin cerrar`, desc: "Dales seguimiento o conviértelas en factura.", href: "/quotations", cta: "Ver cotizaciones", tone: "alert" });

  const nextStep = steps.find((s) => !s.done);
  if (nextStep)
    suggestions.push({ title: nextStep.step.label, desc: "Siguiente paso recomendado para tu tipo de negocio.", href: nextStep.step.href, cta: nextStep.step.cta, tone: "step" });

  return { profile, data, steps, doneCount, total, pct, suggestions };
}
