import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentOrg } from "@/lib/org";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar orgName={org.name} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-8">{children}</div>
      </main>
    </div>
  );
}
