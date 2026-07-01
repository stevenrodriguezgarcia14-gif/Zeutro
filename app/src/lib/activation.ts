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
  // Un solo round-trip: activation_counts() calcula los 17 conteos en la base
  // (antes eran 17 requests HTTP). La RLS por empresa activa aplica igual.
  const { data } = await supabase.rpc("activation_counts");
  const d = (data ?? {}) as Partial<ActivationData>;
  return {
    customers: d.customers ?? 0,
    products: d.products ?? 0,
    productsWithPrice: d.productsWithPrice ?? 0,
    purchases: d.purchases ?? 0,
    purchaseItems: d.purchaseItems ?? 0,
    purchaseItemsWithPrice: d.purchaseItemsWithPrice ?? 0,
    resaleSales: d.resaleSales ?? 0,
    quickSales: d.quickSales ?? 0,
    quotations: d.quotations ?? 0,
    invoices: d.invoices ?? 0,
    payments: d.payments ?? 0,
    expenses: d.expenses ?? 0,
    accounts: d.accounts ?? 0,
    opportunities: d.opportunities ?? 0,
    projects: d.projects ?? 0,
    overdueInvoices: d.overdueInvoices ?? 0,
    openQuotations: d.openQuotations ?? 0,
  };
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
