import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { founderReply } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

type Msg = { id: string; sender: "user" | "founder"; body: string; created_at: string };

export default async function AdminSupportThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { orgId } = await params;
  const { ok, error } = await searchParams;
  const supabase = await createClient();

  // El nombre sale de la RPC de admin (RLS ocultaría organizations al no ser miembro).
  const [{ data: overview }, { data: msgs }] = await Promise.all([
    supabase.rpc("admin_support_overview"),
    supabase
      .from("support_messages")
      .select("id, sender, body, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true })
      .limit(500),
  ]);
  // Marcar los mensajes del negocio como leídos por el fundador.
  await supabase.rpc("mark_support_read", { p_org: orgId });

  const org = ((overview ?? []) as { organization_id: string; org_name: string }[]).find(
    (r) => r.organization_id === orgId,
  );
  const messages = (msgs ?? []) as Msg[];

  return (
    <div>
      <Link href="/admin/support" className="text-sm text-slate-400 hover:text-white">← Soporte</Link>
      <h1 className="mt-2 text-2xl font-bold">{org?.org_name ?? "Negocio"}</h1>
      <p className="mt-1 text-sm text-slate-400">Tu respuesta llega al chat del usuario y se le avisa por correo.</p>

      {ok && <p className="mt-4 rounded-lg bg-green-500/15 p-3 text-sm text-green-300">Respuesta enviada.</p>}
      {error && <p className="mt-4 rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}

      <div className="mt-6 space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        {messages.length === 0 && <p className="text-sm text-slate-400">Sin mensajes todavía.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "founder" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                m.sender === "founder" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-100"
              }`}
            >
              {m.body}
              <span className={`mt-1 block text-[10px] ${m.sender === "founder" ? "text-emerald-100" : "text-slate-400"}`}>
                {m.sender === "founder" ? "Tú · " : ""}
                {new Date(m.created_at).toLocaleString("es")}
              </span>
            </div>
          </div>
        ))}
      </div>

      <form action={founderReply} className="mt-4 space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <input type="hidden" name="org_id" value={orgId} />
        <textarea
          name="body"
          rows={3}
          required
          maxLength={4000}
          placeholder="Escribe tu respuesta como fundador…"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-400"
        />
        <SubmitButton pendingText="Enviando…">Responder</SubmitButton>
      </form>
    </div>
  );
}
