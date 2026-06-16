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
  const orgs = await getUserOrgs();
  const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");

  return (
    <AppShell orgName={org.name} orgs={orgs} activeId={org.id} isPlatformAdmin={!!isPlatformAdmin}>
      {children}
    </AppShell>
  );
}
