import { redirect } from "next/navigation";
import { createOrganization } from "./actions";
import { getCurrentOrg } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { OrgLocaleFields } from "@/components/OrgLocaleFields";
import { BusinessTypePicker } from "@/components/BusinessTypePicker";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // Si fue invitado a un negocio, unirlo automáticamente antes de ofrecer crear uno.
  const supabase = await createClient();
  await supabase.rpc("accept_pending_invitations");

  // Si ya tiene negocio (propio o por invitación), al dashboard.
  const org = await getCurrentOrg();
  if (org) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Crea tu negocio</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configura lo mínimo para empezar. Podrás cambiarlo después.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <form action={createOrganization} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nombre del negocio
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Mi Empresa S.A."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <OrgLocaleFields defaultCountry="MX" />
          <div>
            <label className="block text-sm font-medium text-slate-700">¿Qué tipo de negocio tienes?</label>
            <p className="mb-2 text-xs text-slate-500">Con esto Zentro te muestra primero lo que más te sirve. Podrás cambiarlo después.</p>
            <BusinessTypePicker />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800"
          >
            Crear y empezar
          </button>
        </form>
      </div>
    </main>
  );
}
