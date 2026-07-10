"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { CalendarTask } from "@/lib/marketing/types";
import { moveTask, toggleKey } from "../actions";
import { IconCheck, IconChevronL, IconChevronR, IconGrip } from "../icons";
import { DOW_LONG, DOW_SHORT, KIND_THEME, MONTHS, addDays, dayOfWeek } from "../theme";

// Calendario del OS: tres vistas (Mes / Semana / Agenda), color por tipo de
// tarea, checks instantáneos y drag & drop para reprogramar (escritorio).
// En móvil cada tarea tiene un selector de fecha (mismo resultado sin drag).

type Task = CalendarTask & { loadMin?: number };

type Props = {
  tasks: Task[];
  initialMoves: [string, string][];
  initialChecks: string[];
  today: string;
  disabled?: boolean;
};

type View = "mes" | "semana" | "agenda";

/** Chip de carga de trabajo estimada de un día (ámbar si pasa de 90 min). */
function LoadChip({ min }: { min: number }) {
  if (min === 0) return null;
  const heavy = min > 90;
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ring-1 ${heavy ? "bg-amber-400/10 text-amber-300 ring-amber-400/25" : "bg-white/[0.05] text-zinc-500 ring-white/[0.06]"}`} title="Carga de trabajo estimada del día">
      ≈{min} min{heavy ? " · pesado" : ""}
    </span>
  );
}

export function CalendarBoard({ tasks, initialMoves, initialChecks, today, disabled }: Props) {
  const [view, setView] = useState<View>("semana");
  const [anchor, setAnchor] = useState(today); // día de referencia de la vista
  const [selected, setSelected] = useState(today);
  const [moves, setMoves] = useState<Map<string, string>>(new Map(initialMoves));
  const [checks, setChecks] = useState<Set<string>>(new Set(initialChecks));
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [, start] = useTransition();

  const effective = useMemo(() => {
    const byDate = new Map<string, Task[]>();
    for (const t of tasks) {
      const moved = moves.get(t.id);
      const date = moved && moved >= today ? moved : t.date;
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push({ ...t, date });
    }
    return byDate;
  }, [tasks, moves, today]);

  const originalDate = useMemo(() => new Map(tasks.map((t) => [t.id, t.date])), [tasks]);

  /* ------------------------------- acciones optimistas */

  function toggleTask(t: Task) {
    const key = `cal:${t.id}`;
    const next = !checks.has(key);
    setChecks((cur) => {
      const s = new Set(cur);
      if (next) s.add(key); else s.delete(key);
      return s;
    });
    start(async () => {
      const r = await toggleKey(key, next);
      if (!r.ok) setChecks((cur) => { const s = new Set(cur); if (next) s.delete(key); else s.add(key); return s; });
    });
  }

  function doMove(taskId: string, date: string) {
    const orig = originalDate.get(taskId);
    const prev = moves.get(taskId);
    setMoves((cur) => {
      const m = new Map(cur);
      if (date === orig) m.delete(taskId); else m.set(taskId, date);
      return m;
    });
    start(async () => {
      const r = await moveTask(taskId, date === orig ? null : date);
      if (!r.ok) setMoves((cur) => { const m = new Map(cur); if (prev) m.set(taskId, prev); else m.delete(taskId); return m; });
    });
  }

  function isDone(t: Task) {
    return checks.has(`cal:${t.id}`);
  }

  /* ------------------------------- helpers de fechas */

  const monthStart = anchor.slice(0, 8) + "01";
  const monthLabel = `${MONTHS[Number(anchor.slice(5, 7)) - 1]} ${anchor.slice(0, 4)}`;
  const weekStart = addDays(anchor, -((dayOfWeek(anchor) + 6) % 7)); // lunes
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function shift(dir: 1 | -1) {
    if (view === "mes") {
      const m = Number(anchor.slice(5, 7)) - 1 + dir;
      const y = Number(anchor.slice(0, 4)) + Math.floor(m / 12);
      const mm = ((m % 12) + 12) % 12;
      setAnchor(`${y}-${String(mm + 1).padStart(2, "0")}-15`);
    } else {
      setAnchor(addDays(anchor, dir * 7));
    }
  }

  const monthCells = useMemo(() => {
    const first = monthStart;
    const startPad = (dayOfWeek(first) + 6) % 7;
    const gridStart = addDays(first, -startPad);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [monthStart]);

  const allDates = useMemo(() => [...effective.keys()].sort(), [effective]);

  /* ------------------------------- piezas visuales */

  function TaskRow({ t, compact }: { t: Task; compact?: boolean }) {
    const done = isDone(t);
    const kind = KIND_THEME[t.kind];
    const moved = moves.has(t.id);
    return (
      <div
        draggable={!disabled}
        onDragStart={(e) => { setDragging(t.id); e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => { setDragging(null); setDropTarget(null); }}
        className={`group/task flex items-start gap-2 rounded-xl p-2 ring-1 ring-white/[0.06] transition-all duration-150 hover:ring-white/[0.15] ${
          done ? "bg-white/[0.015] opacity-60" : "bg-white/[0.035]"
        } ${dragging === t.id ? "opacity-40" : ""}`}
      >
        <button
          type="button"
          onClick={() => toggleTask(t)}
          disabled={disabled}
          aria-pressed={done}
          aria-label={done ? "Desmarcar tarea" : "Marcar tarea hecha"}
          className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition-all duration-150 active:scale-90 ${
            done ? "border-[#00C781] bg-[#00C781]" : "border-zinc-600 hover:border-zinc-400"
          }`}
        >
          {done && <IconCheck className="h-3 w-3 text-black" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${kind.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${kind.dot}`} />
              {kind.label}
            </span>
            {t.time && <span className="text-[10px] tabular-nums text-zinc-500">{t.time}</span>}
            {moved && (
              <button type="button" onClick={() => doMove(t.id, originalDate.get(t.id)!)} className="text-[10px] text-amber-400/80 underline decoration-dotted hover:text-amber-300" title="Movida de su fecha original. Click para devolverla.">
                movida
              </button>
            )}
          </div>
          <p className={`mt-1 text-xs leading-snug ${done ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
            {t.videoId ? (
              <Link href={`/marketing-os/videos/${t.videoId}`} className="hover:text-[#3ee6a8] hover:underline">{t.label}</Link>
            ) : t.label}
          </p>
          {!compact && t.detail && <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{t.detail}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className="hidden cursor-grab text-zinc-700 group-hover/task:text-zinc-500 lg:block" title="Arrastra a otro día">
            <IconGrip className="h-4 w-4" />
          </span>
          <label className="relative lg:hidden" title="Mover de día">
            <span className="grid h-6 w-6 place-items-center rounded-md text-zinc-600"><IconGrip className="h-4 w-4" /></span>
            <input
              type="date"
              value={t.date}
              disabled={disabled}
              onChange={(e) => e.target.value && doMove(t.id, e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Mover tarea a otra fecha"
            />
          </label>
        </div>
      </div>
    );
  }

  function DropZone({ date, children, className }: { date: string; children: React.ReactNode; className?: string }) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDropTarget(date); }}
        onDragLeave={() => setDropTarget((d) => (d === date ? null : d))}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain") || dragging;
          if (id) doMove(id, date);
          setDragging(null);
          setDropTarget(null);
        }}
        className={`${className ?? ""} ${dropTarget === date && dragging ? "ring-2 ring-[#00C781]/60 bg-[#00C781]/[0.04]" : ""}`}
      >
        {children}
      </div>
    );
  }

  const dayTasks = (d: string) => effective.get(d) ?? [];
  const dayDone = (d: string) => dayTasks(d).filter((t) => isDone(t)).length;
  const dayLoad = (d: string) => dayTasks(d).reduce((a, t) => a + (t.loadMin ?? 0), 0);

  /* ------------------------------- render */

  return (
    <div>
      {/* Barra de control */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/[0.07]" role="group" aria-label="Vista del calendario">
          {(["mes", "semana", "agenda"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-150 active:scale-95 ${
                view === v ? "bg-[#00C781]/15 text-[#3ee6a8] ring-1 ring-[#00C781]/30" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {view !== "agenda" && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => shift(-1)} aria-label="Anterior" className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 transition hover:bg-white/[0.06] active:scale-90">
              <IconChevronL className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => { setAnchor(today); setSelected(today); }} className="rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06]">
              Hoy
            </button>
            <button type="button" onClick={() => shift(1)} aria-label="Siguiente" className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 transition hover:bg-white/[0.06] active:scale-90">
              <IconChevronR className="h-4 w-4" />
            </button>
            <span className="ml-2 font-display text-sm font-bold capitalize tracking-tight text-white">
              {view === "mes" ? monthLabel : `Semana del ${Number(weekStart.slice(8))} de ${MONTHS[Number(weekStart.slice(5, 7)) - 1]}`}
            </span>
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(KIND_THEME).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className={`h-2 w-2 rounded-full ${v.dot}`} /> {v.label}
          </span>
        ))}
        <span className="ml-auto hidden text-[11px] text-zinc-600 lg:block">Arrastra una tarea a otro día para reprogramarla</span>
      </div>

      {/* ---- MES ---- */}
      {view === "mes" && (
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-1">
            {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
              <p key={i} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-600">{d}</p>
            ))}
            {monthCells.map((d) => {
              const inMonth = d.slice(0, 7) === anchor.slice(0, 7);
              const list = dayTasks(d);
              const done = dayDone(d);
              const isToday = d === today;
              const isSel = d === selected;
              return (
                <DropZone key={d} date={d} className="rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelected(d)}
                    className={`flex min-h-[64px] w-full flex-col items-stretch rounded-xl p-1.5 text-left ring-1 transition-all duration-150 sm:min-h-[76px] ${
                      isSel ? "ring-[#00C781]/50 bg-[#00C781]/[0.06]" : "ring-white/[0.05] hover:ring-white/[0.14]"
                    } ${inMonth ? "" : "opacity-35"} ${list.length >= 3 ? "bg-white/[0.045]" : list.length > 0 ? "bg-white/[0.025]" : "bg-transparent"}`}
                  >
                    <span className={`grid h-6 w-6 place-items-center rounded-lg text-xs tabular-nums ${isToday ? "bg-[#00C781] font-bold text-black" : "text-zinc-400"}`}>
                      {Number(d.slice(8))}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-0.5">
                      {list.slice(0, 4).map((t) => (
                        <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${isDone(t) ? "bg-zinc-700" : KIND_THEME[t.kind].dot}`} />
                      ))}
                      {list.length > 4 && <span className="text-[9px] leading-none text-zinc-500">+{list.length - 4}</span>}
                    </span>
                    {list.length > 0 && done === list.length && <span className="mt-auto text-right text-[9px] text-[#3ee6a8]">✓</span>}
                  </button>
                </DropZone>
              );
            })}
          </div>

          {/* Panel del día seleccionado */}
          <div className="mt-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07]">
            <p className="flex items-center gap-2 font-display text-sm font-bold capitalize tracking-tight text-white">
              {DOW_LONG[dayOfWeek(selected)]} {Number(selected.slice(8))} de {MONTHS[Number(selected.slice(5, 7)) - 1]}
              {selected === today && <span className="rounded-md bg-[#00C781]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#3ee6a8]">HOY</span>}
              <LoadChip min={dayLoad(selected)} />
            </p>
            <div className="mt-3 space-y-2">
              {dayTasks(selected).length === 0 && <p className="text-sm text-zinc-600">Día libre. Arrastra aquí una tarea si quieres adelantarla.</p>}
              {dayTasks(selected).map((t) => <TaskRow key={t.id} t={t} />)}
            </div>
          </div>
        </div>
      )}

      {/* ---- SEMANA ---- */}
      {view === "semana" && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7 lg:gap-1.5">
          {weekDays.map((d) => {
            const list = dayTasks(d);
            const isToday = d === today;
            return (
              <DropZone key={d} date={d} className="rounded-xl">
                <div className={`flex min-h-28 flex-col rounded-xl p-2 ring-1 transition-colors ${isToday ? "bg-[#00C781]/[0.05] ring-[#00C781]/30" : "bg-white/[0.02] ring-white/[0.05]"}`}>
                  <div className="flex items-center justify-between px-1 pb-1.5">
                    <p className={`text-[11px] font-semibold capitalize ${isToday ? "text-[#3ee6a8]" : "text-zinc-500"}`}>
                      {DOW_SHORT[dayOfWeek(d)]} {Number(d.slice(8))}
                    </p>
                    <LoadChip min={dayLoad(d)} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {list.length === 0 && <p className="px-1 text-[11px] text-zinc-700">—</p>}
                    {list.map((t) => <TaskRow key={t.id} t={t} compact />)}
                  </div>
                </div>
              </DropZone>
            );
          })}
        </div>
      )}

      {/* ---- AGENDA ---- */}
      {view === "agenda" && (
        <div className="mt-4 space-y-3">
          {allDates.map((d) => {
            const list = dayTasks(d);
            const isToday = d === today;
            const past = d < today;
            const allDone = list.every((t) => isDone(t));
            return (
              <DropZone key={d} date={d} className="rounded-2xl">
                <div className={`rounded-2xl p-4 ring-1 transition-colors ${isToday ? "bg-[#00C781]/[0.05] ring-[#00C781]/35" : past && allDone ? "bg-white/[0.015] ring-white/[0.04] opacity-60" : "bg-white/[0.03] ring-white/[0.07]"}`}>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-sm font-bold capitalize tracking-tight text-white">
                      {DOW_LONG[dayOfWeek(d)]} {Number(d.slice(8))}/{Number(d.slice(5, 7))}
                    </p>
                    {isToday && <span className="rounded-md bg-[#00C781] px-1.5 py-0.5 text-[10px] font-bold text-black">HOY</span>}
                    {past && !allDone && <span className="rounded-md bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">pendiente</span>}
                    {allDone && <span className="text-xs text-[#3ee6a8]">✓ completo</span>}
                    <span className="ml-auto"><LoadChip min={dayLoad(d)} /></span>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {list.map((t) => <TaskRow key={t.id} t={t} />)}
                  </div>
                </div>
              </DropZone>
            );
          })}
        </div>
      )}
    </div>
  );
}
