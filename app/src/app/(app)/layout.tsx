import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentOrg, getUserOrgs } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Si el usuario fue invitado a un negocio, se une automáticamente.
  const supabase = await createClient();
  await supabase.rpc("accept_pending_invitations");

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");

  if (org.status === "suspended") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">Cuenta suspendida</h1>
          <p className="mt-2 text-sm text-slate-600">
            El acceso a <b>{org.name}</b> está temporalmente suspendido. Contacta a soporte para reactivarlo.
          </p>
        </div>
      </div>
    );
  }

  const orgs = await getUserOrgs();
  const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");

  return (
    <AppShell orgName={org.name} orgs={orgs} activeId={org.id} isPlatformAdmin={!!isPlatformAdmin}>
      {children}
    </AppShell>
  );
}
