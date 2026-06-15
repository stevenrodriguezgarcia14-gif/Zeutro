import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentOrg } from "@/lib/org";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");

  return <AppShell orgName={org.name}>{children}</AppShell>;
}
