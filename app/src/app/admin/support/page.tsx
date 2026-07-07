import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Row = {
  organization_id: string;
  org_name: string;
  owner_email: string | null;
  last_body: string;
  last_sender: "user" | "founder";
  last_at: string;
  unread: number;
};

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_support_overview");
  const rows = (data ?? []) as Row[];
  const totalUnread = rows.reduce((s, r) => s + Number(r.unread ?? 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold">Soporte — chat con negocios</h1>
      <p className="mt-1 text-sm text-slate-400">
        Conversaciones del widget &quot;Chat con el fundador&quot;.
        {totalUnread > 0 ? ` Tienes ${totalUnread} mensaje(s) sin leer.` : " Estás al día."}
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
          Aún nadie ha escrito. Cuando un negocio use el chat, aparecerá aquí.
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {rows.map((r) => (
            <Link
              key={r.organization_id}
              href={`/admin/support/${r.organization_id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 hover:border-slate-600"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-white">
                  {r.org_name}
                  {Number(r.unread) > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{r.unread}</span>
                  )}
                </p>
                <p className="truncate text-sm text-slate-400">
                  {r.last_sender === "founder" ? "Tú: " : ""}{r.last_body}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.owner_email ?? "sin correo"} · {new Date(r.last_at).toLocaleString("es")}
                </p>
              </div>
              <span className="shrink-0 text-slate-500">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
