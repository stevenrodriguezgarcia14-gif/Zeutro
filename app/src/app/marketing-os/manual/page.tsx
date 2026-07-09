import { GLOSSARY, HASHTAG_SETS, MANUAL_SECTIONS } from "@/lib/marketing/plan";
import { GlossarySearch } from "./search";
import { Card, PageHeader, SectionTitle } from "../parts";

// Contenido 100% estático — carga instantánea, sin consultas.

const PRINCIPLES: [string, string][] = [
  ["Documentar > crear", "No “haces marketing”: muestras lo que ya haces (construir, fallar, corregir). Programas Zentro todos los días — ese ES el contenido."],
  ["Gancho triple en el segundo 0", "Visual + verbal + texto, los tres a la vez. Nunca “hola, soy Steve y hoy...”."],
  ["Retención = cambio cada ≤5 s", "Cortes cada 2-3 s + zoom, texto o pantalla cada 5. La completion rate es la métrica reina (por eso 20-40 s)."],
  ["Autenticidad calculada", "Luz de ventana, hablar como nota de voz. Lo pulido parece anuncio; lo crudo-pero-nítido parece verdad. Nítido = buen audio SIEMPRE."],
  ["Un video = una idea", "Si necesitas “y además...”, son dos videos."],
  ["La primera hora manda", "Responder cada comentario en <60 min multiplica el alcance."],
  ["Regla 80/20", "80% de los videos ni mencionan Zentro hasta el final; 20% son invitación directa. El error #1: hablar del producto en vez del problema."],
  ["200 views buenas > 50k de curiosos", "Con 15 cupos, el video “aburrido” que trae 3 registros vale más que el trend con 20k views y 0 registros."],
];

export default function ManualPage() {
  const estudio = MANUAL_SECTIONS.find((s) => s.id === "estudio")!;
  const capcut = MANUAL_SECTIONS.find((s) => s.id === "capcut")!;
  const errores = MANUAL_SECTIONS.find((s) => s.id === "errores")!;

  return (
    <div>
      <PageHeader
        title="Manual"
        sub="Todo lo educativo, navegable: diccionario buscable, tu estudio casero, la receta de CapCut y los errores de principiante."
      />

      {/* Diccionario */}
      <Card>
        <p className="font-display text-sm font-bold text-white">Diccionario · los términos raros, en cristiano</p>
        <div className="mt-3">
          <GlossarySearch entries={GLOSSARY} />
        </div>
      </Card>

      {/* Estudio y CapCut */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="font-display text-sm font-bold text-white">{estudio.title}</p>
          {estudio.intro && <p className="mt-1 text-xs text-zinc-500">{estudio.intro}</p>}
          <ol className="mt-4 space-y-3">
            {estudio.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/[0.06] font-display text-[11px] font-bold text-[#3ee6a8]">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <p className="font-display text-sm font-bold text-white">{capcut.title}</p>
          {capcut.intro && (
            <p className="mt-2 rounded-xl bg-amber-400/[0.07] p-3 text-xs leading-relaxed text-amber-300 ring-1 ring-amber-400/15">{capcut.intro}</p>
          )}
          <ol className="mt-4 space-y-3">
            {capcut.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/[0.06] font-display text-[11px] font-bold text-[#3ee6a8]">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* Errores */}
      <SectionTitle sub={errores.intro}>{errores.title}</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {errores.steps.map((e, i) => {
          const [title, ...rest] = e.split(":");
          return (
            <div key={i} className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-rose-500/15">
              <p className="text-sm font-semibold text-rose-300">{i + 1}. {title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{rest.join(":").trim()}</p>
            </div>
          );
        })}
      </div>

      {/* Hashtags */}
      <SectionTitle sub="Mezcla grandes + medios + nicho + #zentro. Nunca el mismo set en todos los posts y nunca #fyp.">
        Sets de hashtags por tipo de contenido
      </SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">
        {HASHTAG_SETS.map((h) => (
          <Card key={h.pillar} className="!p-4">
            <p className="font-display text-sm font-bold text-white">{h.pillar}</p>
            <p className="mt-1.5 select-all font-mono text-xs text-[#3ee6a8]">{h.tags}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{h.why}</p>
          </Card>
        ))}
      </div>

      {/* Principios */}
      <SectionTitle sub="Los 8 principios extraídos de los creadores que sí funcionan — el porqué detrás de cada guion.">
        Principios, no tendencias
      </SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {PRINCIPLES.map(([t, d]) => (
          <Card key={t} className="!p-4">
            <p className="font-display text-sm font-bold text-[#3ee6a8]">{t}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{d}</p>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-[11px] text-zinc-600">
        Respaldo en documentos: <code className="font-mono">Marketing-Assets-Zentro/</code> (solo para rediseños profundos; el trabajo diario es aquí).
      </p>
    </div>
  );
}
