"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitScenario } from "@/app/(app)/academy/actions";

export type ClientChallenge = {
  id: string;
  type: "scenario" | "action";
  difficulty: "basico" | "intermedio" | "avanzado";
  prompt: string;
  optionsText?: string[];
  cta?: string;
  href?: string;
  done: boolean;
};

type Grade = { correct: boolean; correctIndex: number; feedback: string; explanation: string };

const DIFF: Record<string, { label: string; cls: string }> = {
  basico: { label: "Básico", cls: "bg-emerald-100 text-emerald-700" },
  intermedio: { label: "Intermedio", cls: "bg-amber-100 text-amber-700" },
  avanzado: { label: "Avanzado", cls: "bg-rose-100 text-rose-700" },
};

function Scenario({ c }: { c: ClientChallenge }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sel, setSel] = useState<number | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [done, setDone] = useState(c.done);
  const opts = c.optionsText ?? [];

  function confirm() {
    if (sel === null) return;
    startTransition(async () => {
      const r = (await submitScenario(c.id, sel)) as Grade | null;
      if (!r) return;
      setGrade(r);
      if (r.correct) { setDone(true); router.refresh(); }
    });
  }
  function retry() { setSel(null); setGrade(null); }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFF[c.difficulty].cls}`}>{DIFF[c.difficulty].label}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Desafío</span>
        {done && <span className="ml-auto text-xs font-medium text-emerald-600">✓ Aprobado</span>}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-900">{c.prompt}</p>
      <div className="mt-3 space-y-2">
        {opts.map((text, i) => {
          const isSel = sel === i;
          let cls = "border-slate-200 hover:border-slate-400";
          if (grade) {
            if (i === grade.correctIndex) cls = "border-emerald-400 bg-emerald-50";
            else if (isSel) cls = "border-rose-400 bg-rose-50";
            else cls = "border-slate-200 opacity-70";
          } else if (isSel) cls = "border-slate-900 bg-slate-50";
          return (
            <button key={i} type="button" disabled={!!grade || pending} onClick={() => setSel(i)}
              className={`block w-full rounded-lg border px-3 py-2 text-left text-sm text-slate-700 ${cls}`}>
              {text}
              {grade && isSel && grade.feedback && (
                <span className="mt-1 block text-xs text-slate-500">{grade.feedback}</span>
              )}
            </button>
          );
        })}
      </div>
      {!grade ? (
        <button onClick={confirm} disabled={sel === null || pending}
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40">
          {pending ? "Revisando…" : "Confirmar"}
        </button>
      ) : (
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
          <p className={grade.correct ? "font-medium text-emerald-700" : "font-medium text-rose-700"}>
            {grade.correct ? "¡Correcto! 🎯" : "Casi. Mira la explicación:"}
          </p>
          {grade.explanation && <p className="mt-1 text-slate-600">{grade.explanation}</p>}
          {!grade.correct && (
            <button onClick={retry} className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white">
              Intentar de nuevo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ActionChallenge({ c }: { c: ClientChallenge }) {
  return (
    <div className={`rounded-xl border p-4 ${c.done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFF[c.difficulty].cls}`}>{DIFF[c.difficulty].label}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-amber-600">Acción real</span>
        {c.done && <span className="ml-auto text-xs font-medium text-emerald-600">✓ Hecho</span>}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-900">{c.prompt}</p>
      {!c.done && c.href && (
        <Link href={c.href} className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          {c.cta ?? "Hacerlo ahora"} →
        </Link>
      )}
    </div>
  );
}

export function ChallengeBlock({ challenges }: { challenges: ClientChallenge[] }) {
  if (!challenges || challenges.length === 0) return null;
  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pon a prueba lo aprendido</p>
      {challenges.map((c) => (c.type === "scenario" ? <Scenario key={c.id} c={c} /> : <ActionChallenge key={c.id} c={c} />))}
    </div>
  );
}
