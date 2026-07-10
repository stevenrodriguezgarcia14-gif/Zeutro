"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { CustomIdea, Pillar, VideoMetrics, VideoStatus } from "@/lib/marketing/types";
import { STATUS_ORDER } from "@/lib/marketing/types";
import { addIdea, deleteIdea, replanCalendar, resetChecklist, saveGoal, saveMetrics, setStatus, toggleKey } from "./actions";
import { IconCheck, IconPlus, IconRefresh, IconTrash } from "./icons";
import { PILLAR_THEME, STATUS_THEME } from "./theme";

// Componentes optimistas: la UI cambia en <100 ms y el servidor confirma
// detrás. Si la escritura falla, se revierte y se muestra el error inline.

function ErrorHint({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p role="alert" className="mt-1.5 text-xs text-rose-400">{msg}</p>;
}

/* ------------------------------------------------------------- Check */

export function CheckItem({
  k,
  initial,
  label,
  detail,
  muted,
  disabled,
}: {
  k: string;
  initial: boolean;
  label: string;
  detail?: string;
  muted?: boolean;
  disabled?: boolean;
}) {
  const [done, setDone] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [, start] = useTransition();

  function onToggle() {
    const next = !done;
    setDone(next); // instantáneo
    setErr(null);
    start(async () => {
      const r = await toggleKey(k, next);
      if (!r.ok) {
        setDone(!next); // revertir
        setErr(r.error);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={done}
        className={`group flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 hover:bg-white/[0.04] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-40 ${
          muted ? "text-zinc-500" : ""
        }`}
      >
        <span
          aria-hidden
          className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition-all duration-150 ${
            done ? "border-[#00C781] bg-[#00C781] scale-105" : "border-zinc-600 group-hover:border-zinc-400"
          }`}
        >
          {done && <IconCheck className="h-3 w-3 text-black" />}
        </span>
        <span className={`text-sm leading-snug transition-colors duration-150 ${done ? "text-zinc-500 line-through decoration-zinc-700" : "text-zinc-200"}`}>
          {label}
          {detail && <span className="mt-0.5 block text-xs text-zinc-500 no-underline">{detail}</span>}
        </span>
      </button>
      <ErrorHint msg={err} />
    </div>
  );
}

/* --------------------------------------------------------- Estado video */

export function StatusStepper({
  videoId,
  initial,
  disabled,
  size = "md",
}: {
  videoId: number;
  initial: VideoStatus;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const [status, setStatusLocal] = useState<VideoStatus>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [, start] = useTransition();

  function choose(s: VideoStatus) {
    if (s === status) return;
    const prev = status;
    setStatusLocal(s);
    setErr(null);
    start(async () => {
      const r = await setStatus(videoId, s);
      if (!r.ok) {
        setStatusLocal(prev);
        setErr(r.error);
      }
    });
  }

  return (
    <div>
      <div className={`inline-flex rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/[0.07] ${size === "sm" ? "gap-0" : "gap-0.5"}`} role="group" aria-label="Estado del video">
        {STATUS_ORDER.map((s) => {
          const active = s === status;
          const t = STATUS_THEME[s];
          return (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => choose(s)}
              aria-pressed={active}
              className={`rounded-lg font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40 ${
                size === "sm" ? "px-2.5 py-1.5 text-[11px]" : "px-3.5 py-2 text-xs"
              } ${active ? `${t.chip} ring-1 shadow-sm` : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <ErrorHint msg={err} />
    </div>
  );
}

/* ------------------------------------------------------------- Meta */

export function GoalEditor({
  initial,
  target,
  disabled,
}: {
  initial: { current: number; waitlist: number; registros: number };
  target: number;
  disabled?: boolean;
}) {
  const [goal, setGoal] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update(patch: Partial<typeof goal>) {
    const next = { ...goal, ...patch };
    setGoal(next); // barra y números cambian YA
    setErr(null);
    if (timer.current) clearTimeout(timer.current);
    // Autosave con debounce de 500 ms: sin botón Guardar.
    timer.current = setTimeout(() => {
      start(async () => {
        const r = await saveGoal(next);
        if (!r.ok) setErr(r.error);
        else {
          setSaved(true);
          setTimeout(() => setSaved(false), 1600);
        }
      });
    }, 500);
  }

  const pct = Math.min(100, Math.round((goal.current / target) * 100));

  const fields: { field: keyof typeof goal; label: string }[] = [
    { field: "current", label: "Fundadores" },
    { field: "registros", label: "Registros ?ref" },
    { field: "waitlist", label: "Lista de espera" },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-4xl font-bold tracking-tight text-white">
          {goal.current}
          <span className="text-lg font-medium text-zinc-500"> / {target}</span>
        </p>
        <span className={`text-xs transition-opacity duration-300 ${saved ? "opacity-100 text-[#3ee6a8]" : "opacity-0"}`}>Guardado ✓</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#00C781] to-[#3ee6a8] transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {fields.map(({ field, label }) => (
          <label key={field} className="flex-1 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/[0.06]">
            <span className="block text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</span>
            <span className="mt-1 flex items-center gap-2">
              <button type="button" disabled={disabled} onClick={() => update({ [field]: Math.max(0, goal[field] - 1) } as Partial<typeof goal>)}
                className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.05] text-zinc-400 transition hover:bg-white/10 active:scale-90" aria-label={`Restar ${label}`}>−</button>
              <span className="min-w-8 text-center font-display text-xl font-bold tabular-nums text-white">{goal[field]}</span>
              <button type="button" disabled={disabled} onClick={() => update({ [field]: goal[field] + 1 } as Partial<typeof goal>)}
                className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.05] text-zinc-400 transition hover:bg-white/10 active:scale-90" aria-label={`Sumar ${label}`}>+</button>
            </span>
          </label>
        ))}
      </div>
      <ErrorHint msg={err} />
    </div>
  );
}

/* ----------------------------------------------------------- Métricas */

const METRIC_FIELDS: { key: keyof VideoMetrics & string; label: string; pct?: boolean }[] = [
  { key: "views", label: "Visualizaciones" },
  { key: "ret3s", label: "Retención 3 s", pct: true },
  { key: "completion", label: "Lo terminan", pct: true },
  { key: "comments", label: "Comentarios" },
  { key: "shares", label: "Compartidos" },
  { key: "saves", label: "Guardados" },
  { key: "clicks", label: "Clics al link" },
];

export function MetricsEditor({ videoId, initial, disabled }: { videoId: number; initial: VideoMetrics; disabled?: boolean }) {
  const [m, setM] = useState<VideoMetrics>(initial);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setErr(null);
    start(async () => {
      const r = await saveMetrics(videoId, m);
      if (!r.ok) setErr(r.error);
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 1600);
      }
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {METRIC_FIELDS.map((f) => (
          <label key={f.key} className="rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/[0.06] focus-within:ring-[#00C781]/50">
            <span className="block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {f.label}{f.pct ? " %" : ""}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={m[f.key] ?? ""}
              onChange={(e) => setM({ ...m, [f.key]: e.target.value === "" ? undefined : Number(e.target.value) })}
              className="mt-0.5 w-full bg-transparent font-display text-lg font-semibold tabular-nums text-white outline-none placeholder:text-zinc-700"
              placeholder="—"
            />
          </label>
        ))}
        <label className="col-span-2 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/[0.06] focus-within:ring-[#00C781]/50 sm:col-span-4">
          <span className="block text-[10px] font-medium uppercase tracking-wide text-zinc-500">Notas (¿qué funcionó? ¿qué comentaron?)</span>
          <input
            value={m.notes ?? ""}
            onChange={(e) => setM({ ...m, notes: e.target.value })}
            maxLength={500}
            className="mt-0.5 w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-700"
            placeholder="Escribe aquí..."
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || pending}
          className="rounded-xl bg-[#00C781] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar métricas"}
        </button>
        <span className={`text-xs text-[#3ee6a8] transition-opacity duration-300 ${saved ? "opacity-100" : "opacity-0"}`}>Guardado ✓</span>
      </div>
      <ErrorHint msg={err} />
    </div>
  );
}

/* --------------------------------------------------------------- Ideas */

type IdeaRow = { key: string; idea: CustomIdea };

export function IdeasBoard({ initial, disabled }: { initial: IdeaRow[]; disabled?: boolean }) {
  const [ideas, setIdeas] = useState<IdeaRow[]>(initial);
  const [title, setTitle] = useState("");
  const [pillar, setPillar] = useState<Pillar>("P1");
  const [hook, setHook] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [, start] = useTransition();

  function submit() {
    const t = title.trim();
    if (!t) return;
    const optimistic: IdeaRow = {
      key: `tmp:${Date.now()}`,
      idea: { title: t, pillar, hook: hook.trim() || undefined, createdAt: new Date().toISOString() },
    };
    setIdeas([optimistic, ...ideas]); // aparece YA
    setTitle("");
    setHook("");
    setErr(null);
    start(async () => {
      const r = await addIdea({ title: t, pillar, hook: optimistic.idea.hook });
      if (!r.ok) {
        setIdeas((cur) => cur.filter((i) => i.key !== optimistic.key));
        setErr(r.error);
      } else if (r.key) {
        setIdeas((cur) => cur.map((i) => (i.key === optimistic.key ? { ...i, key: r.key! } : i)));
      }
    });
  }

  function remove(key: string) {
    const prev = ideas;
    setIdeas(ideas.filter((i) => i.key !== key));
    start(async () => {
      const r = await deleteIdea(key);
      if (!r.ok) {
        setIdeas(prev);
        setErr(r.error);
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07] lg:col-span-2">
        <p className="text-sm font-semibold text-white">Captura una idea antes de que se escape</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          maxLength={140}
          placeholder="Ej: reaccionar al video viral sobre morosos"
          className="mt-3 w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none ring-1 ring-white/[0.08] placeholder:text-zinc-600 focus:ring-[#00C781]/50"
        />
        <input
          value={hook}
          onChange={(e) => setHook(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          maxLength={200}
          placeholder="Gancho (opcional)"
          className="mt-2 w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none ring-1 ring-white/[0.08] placeholder:text-zinc-600 focus:ring-[#00C781]/50"
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Pilar de la idea">
          {(Object.keys(PILLAR_THEME) as Pillar[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPillar(p)}
              aria-pressed={pillar === p}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium ring-1 transition-all duration-150 active:scale-95 ${
                pillar === p ? PILLAR_THEME[p].chip : "text-zinc-500 ring-white/[0.08] hover:text-zinc-300"
              }`}
            >
              {p} · {PILLAR_THEME[p].name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !title.trim()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#00C781] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
        >
          <IconPlus className="h-4 w-4" /> Guardar idea
        </button>
        <ErrorHint msg={err} />
      </div>

      <div className="space-y-2 lg:col-span-3">
        {ideas.length === 0 && (
          <div className="grid h-full min-h-32 place-items-center rounded-2xl border border-dashed border-white/[0.08] text-sm text-zinc-600">
            Tus ideas propias aparecerán aquí
          </div>
        )}
        {ideas.map(({ key, idea }) => (
          <div key={key} className="flex items-start justify-between gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07] transition hover:ring-white/[0.14]" style={{ animation: "mkos-in .25s ease-out" }}>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{idea.title}</p>
              {idea.hook && <p className="mt-0.5 text-xs text-zinc-400">Gancho: {idea.hook}</p>}
              <span className={`mt-1.5 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${PILLAR_THEME[idea.pillar].chip}`}>
                {idea.pillar} · {PILLAR_THEME[idea.pillar].name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => remove(key)}
              aria-label={`Borrar idea: ${idea.title}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-zinc-600 transition hover:bg-rose-500/10 hover:text-rose-400 active:scale-90"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------- Replanificar */

export function ReplanButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          await replanCalendar();
          router.refresh();
          setDone(true);
          setTimeout(() => setDone(false), 2500);
        })
      }
      className="inline-flex items-center gap-1.5 rounded-xl bg-[#00C781] px-3.5 py-2 text-xs font-semibold text-black transition hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
      title="Reorganiza todo el plan desde hoy según el estado real de cada video (y descarta los movimientos manuales)."
    >
      <IconRefresh className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Replanificando…" : done ? "Plan al día ✓" : "Replanificar"}
    </button>
  );
}

/* --------------------------------------------------- Reset de checklist */

export function ResetButton({ scope, listId, disabled, onReset }: { scope: string; listId: string; disabled?: boolean; onReset?: () => void }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        onReset?.();
        start(async () => { await resetChecklist(scope, listId); });
      }}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-300 active:scale-95 disabled:opacity-40"
    >
      <IconRefresh className="h-3.5 w-3.5" /> Reiniciar
    </button>
  );
}

/** Checklist completo con contador y reset — todo optimista, en un componente. */
export function ChecklistCard({
  scope,
  listId,
  title,
  moment,
  items,
  initialDone,
  disabled,
}: {
  scope: string;
  listId: string;
  title: string;
  moment?: string;
  items: string[];
  initialDone: boolean[];
  disabled?: boolean;
}) {
  const [done, setDone] = useState<boolean[]>(initialDone);
  const [, start] = useTransition();
  const count = done.filter(Boolean).length;
  const complete = count === items.length;

  function toggle(i: number) {
    const next = [...done];
    next[i] = !next[i];
    setDone(next);
    start(async () => {
      const r = await toggleKey(`chk:${scope}:${listId}:${i}`, next[i]);
      if (!r.ok) setDone((cur) => { const rb = [...cur]; rb[i] = !next[i]; return rb; });
    });
  }

  return (
    <div className={`rounded-2xl bg-white/[0.03] p-5 ring-1 transition-shadow ${complete ? "ring-[#00C781]/40" : "ring-white/[0.07]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-base font-bold tracking-tight text-white">
            {title} {complete && <span className="text-[#3ee6a8]">✓</span>}
          </p>
          {moment && <p className="mt-0.5 text-xs text-zinc-500">{moment}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs tabular-nums ${complete ? "text-[#3ee6a8]" : "text-zinc-500"}`}>{count}/{items.length}</span>
          <ResetButton scope={scope} listId={listId} disabled={disabled} onReset={() => setDone(items.map(() => false))} />
        </div>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-[#00C781] transition-[width] duration-300 ease-out" style={{ width: `${(count / items.length) * 100}%` }} />
      </div>
      <div className="mt-3 space-y-0.5">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            disabled={disabled}
            aria-pressed={done[i]}
            className="group flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-150 hover:bg-white/[0.04] active:scale-[0.995] disabled:opacity-40"
          >
            <span aria-hidden className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition-all duration-150 ${done[i] ? "border-[#00C781] bg-[#00C781]" : "border-zinc-600 group-hover:border-zinc-400"}`}>
              {done[i] && <IconCheck className="h-3 w-3 text-black" />}
            </span>
            <span className={`text-sm leading-snug ${done[i] ? "text-zinc-500 line-through decoration-zinc-700" : "text-zinc-200"}`}>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
