import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { QuotationForm } from "@/components/QuotationForm";
import { createQuotation } from "../actions";
import { defaultVatPct } from "@/lib/tax";

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; customer?: string }>;
}) {
  const { error, customer } = await searchParams;
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase.from("customers").select("id, legal_name").order("legal_name"),
    supabase.from("products").select("id, name, sale_price_minor").eq("is_active", true).order("name"),
  ]);

  if (!customers || customers.length === 0) {
    return (
      <div className="mx-auto max-w-lg">
        <Link href="/quotations" className="text-sm text-slate-500 hover:underline">← Cotizaciones</Link>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">Primero necesitas al menos un cliente.</p>
          <Link href="/customers/new" className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Crear cliente</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/quotations" className="text-sm text-slate-500 hover:underline">← Cotizaciones</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Nueva cotización</h1>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-6">
        <QuotationForm customers={customers} products={products ?? []} currency={currency} action={createQuotation} defaultCustomerId={customer ?? ""} defaultTaxPct={defaultVatPct(org?.country)} />
      </div>
    </div>
  );
}
