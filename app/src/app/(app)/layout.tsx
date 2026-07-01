import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getOrgContext } from "@/lib/org";
import { getProfile, MODULES } from "@/lib/guide";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Un solo round-trip: invitaciones + empresas + activa + admin (app_bootstrap),
  // compartido con las páginas vía cache() de React.
  const { orgs, current: org, isPlatformAdmin } = await getOrgContext();

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

  const profile = getProfile(org.business_type);
  const priorityHrefs = profile.priority.map((slug) => MODULES[slug].href);

  return (
    <AppShell orgName={org.name} orgs={orgs} activeId={org.id} isPlatformAdmin={!!isPlatformAdmin} priorityHrefs={priorityHrefs}>
      {children}
    </AppShell>
  );
}
