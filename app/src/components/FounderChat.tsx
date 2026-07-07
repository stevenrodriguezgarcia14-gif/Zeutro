"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSupportThread,
  getSupportUnread,
  sendSupportMessage,
  type ChatMessage,
} from "@/app/(app)/founder-chat-actions";

/**
 * Chat en vivo con el fundador, disponible en toda la app.
 * Sin dependencias externas (CSP-safe): los mensajes viven en Supabase y el
 * widget sondea vía server actions (5s abierto, 60s cerrado).
 */
export function FounderChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const refreshThread = useCallback(async () => {
    try {
      const msgs = await getSupportThread();
      setMessages(msgs);
      setUnread(0);
    } catch {
      /* sin red: se reintenta en el próximo sondeo */
    }
  }, []);

  // Cerrado: solo vigila si hay respuestas nuevas. Abierto: conversación viva.
  useEffect(() => {
    let alive = true;
    if (open) {
      const t0 = setTimeout(refreshThread, 0);
      const t = setInterval(refreshThread, 5000);
      return () => { alive = false; clearTimeout(t0); clearInterval(t); };
    }
    const check = async () => {
      try {
        const n = await getSupportUnread();
        if (alive) setUnread(n);
      } catch { /* ignorar */ }
    };
    const t0 = setTimeout(check, 0);
    const t = setInterval(check, 60000);
    return () => { alive = false; clearTimeout(t0); clearInterval(t); };
  }, [open, refreshThread]);

  // Mantener la vista pegada al último mensaje.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    const res = await sendSupportMessage(text);
    if (res.ok) {
      setInput("");
      await refreshThread();
    } else {
      setError(res.error ?? "No se pudo enviar.");
    }
    setSending(false);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-36 right-3 z-40 flex h-[26rem] w-[min(92vw,22rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl md:bottom-24 md:right-6">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-900 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">S</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Steven — Fundador de Zentro</p>
              <p className="text-xs text-slate-300">Te responde en persona. Pregunta lo que sea.</p>
            </div>
          </div>

          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
            {messages.length === 0 && (
              <div className="rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm">
                👋 ¡Hola! Soy Steven, el fundador. ¿Tienes una duda, encontraste un
                problema o te falta algo en Zentro? Escríbeme aquí y te respondo
                personalmente.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm shadow-sm ${
                    m.sender === "user" ? "bg-emerald-600 text-white" : "bg-white text-slate-800"
                  }`}
                >
                  {m.body}
                  <span className={`mt-1 block text-[10px] ${m.sender === "user" ? "text-emerald-100" : "text-slate-400"}`}>
                    {new Date(m.created_at).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {error && <p className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          <form
            className="flex items-end gap-2 border-t border-slate-200 bg-white p-2"
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              rows={1}
              maxLength={4000}
              placeholder="Escribe tu mensaje…"
              className="max-h-24 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {sending ? "…" : "Enviar"}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar chat con el fundador" : "Abrir chat con el fundador"}
        className="fixed bottom-20 right-3 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 md:bottom-6 md:right-6"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-8 8H4l1.5-3A8 8 0 1 1 21 12z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
