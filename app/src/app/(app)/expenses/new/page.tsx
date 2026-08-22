import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createExpense } from "../actions";
import { getCurrentOrg, getOrgToday } from "@/lib/org";
import { getExpenseCategories } from "@/lib/guide";
import { ExpenseForm } from "@/components/ExpenseForm";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; project?: string }>;
}) {
  const { error, project } = await searchParams;
  const org = await getCurrentOrg();
  const today = await getOrgToday();
  const supabase = await createClient();
  // Las categorías sugeridas dependen del tipo de negocio: un contratista que
  // solo ve "Renta, Software, Marketing" concluye, con razón, que la
  // herramienta no es para él. El campo sigue siendo texto libre.
  const categories = getExpenseCategories(org?.business_type);
  const [{ data: accounts }, { data: projects }] = await Promise.all([
    supabase.from("accounts").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("projects")
      .select("id, name")
      .in("status", ["planning", "active", "on_hold"])
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/expenses" className="text-sm text-slate-500 hover:underline">
        ← Gastos
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Nuevo gasto</h1>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <ExpenseForm
        action={createExpense}
        categories={categories}
        accounts={(accounts ?? []) as { id: string; name: string }[]}
        projects={(projects ?? []) as { id: string; name: string }[]}
        defaultProjectId={project ?? ""}
        today={today}
        currency={org?.base_currency ?? "CRC"}
        orgId={org?.id ?? ""}
        orgTaxId={org?.tax_id ?? null}
      />
    </div>
  );
}
