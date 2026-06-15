import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentOrg } from "@/lib/org";
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

  return <AppShell orgName={org.name}>{children}</AppShell>;
}
