import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { getExpenseCategories } from "@/lib/guide";
import { BulkEInvoiceImport } from "@/components/BulkEInvoiceImport";

export default async function ImportExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const org = await getCurrentOrg();
  const supabase = await createClient();
  const [{ data: projects }, { data: accounts }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .in("status", ["planning", "active", "on_hold"])
      .order("created_at", { ascending: false }),
    supabase.from("accounts").select("id, name").eq("is_active", true).order("name"),
  ]);

  return (
    <div>
      <Link href="/expenses" className="text-sm text-slate-500 hover:underline">← Gastos</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Importar facturas de proveedor</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Subí de una vez todos los XML que te mandaron por correo. Zentro lee cada comprobante, arma el gasto con su
        proveedor, fecha, monto e IVA, y guarda el archivo como respaldo.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6">
        <BulkEInvoiceImport
          projects={(projects ?? []) as { id: string; name: string }[]}
          accounts={(accounts ?? []) as { id: string; name: string }[]}
          categories={getExpenseCategories(org?.business_type)}
          currency={org?.base_currency ?? "CRC"}
          orgId={org?.id ?? ""}
          orgTaxId={org?.tax_id ?? null}
        />
      </div>
    </div>
  );
}
