import Link from "next/link";
import { CATEGORIES, lessonsByCategory, type Lesson } from "@/lib/academia";
import { MODULES } from "@/lib/guide";

function renderBody(body: string[]) {
  const out: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (key: string) => {
    if (bullets.length) {
      out.push(
        <ul key={key} className="ml-4 list-disc space-y-1 text-slate-600">
          {bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>,
      );
      bullets = [];
    }
  };
  body.forEach((line, i) => {
    if (line.startsWith("- ")) {
      bullets.push(line.slice(2));
    } else if (line.startsWith("## ")) {
      flush(`u${i}`);
      out.push(<h4 key={i} className="pt-1 text-sm font-semibold text-slate-800">{line.slice(3)}</h4>);
    } else {
      flush(`u${i}`);
      out.push(<p key={i} className="text-slate-600">{line}</p>);
    }
  });
  flush("ulast");
  return out;
}

function LessonItem({ l }: { l: Lesson }) {
  const rel = l.related ? MODULES[l.related] : null;
  return (
    <details className="group rounded-xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2">
          <span className="text-lg">{l.emoji}</span>
          <span>
            <span className="block text-sm font-medium text-slate-900">{l.title}</span>
            <span className="block text-xs text-slate-500">{l.resumen} · {l.minutes} min</span>
          </span>
        </span>
        <span className="text-slate-400 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm leading-relaxed">
        {renderBody(l.body)}
        {rel && (
          <Link href={rel.href} className="mt-2 inline-block rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
            Ir a {rel.name} {rel.emoji}
          </Link>
        )}
      </div>
    </details>
  );
}

export default function AcademyPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/guide" className="text-sm text-slate-500 hover:text-slate-800">← Centro de Orientación</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Academia Zentro</h1>
        <p className="mt-1 text-sm text-slate-500">
          Guías cortas para manejar tu negocio mejor. Léelas en minutos y aplica de inmediato.
        </p>
      </div>

      {CATEGORIES.map((cat) => {
        const lessons = lessonsByCategory(cat.slug);
        if (lessons.length === 0) return null;
        return (
          <section key={cat.slug}>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span>{cat.emoji}</span> {cat.title}
            </h2>
            <p className="text-sm text-slate-500">{cat.desc}</p>
            <div className="mt-3 space-y-2">
              {lessons.map((l) => <LessonItem key={l.slug} l={l} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
