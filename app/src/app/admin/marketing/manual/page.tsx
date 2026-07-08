import { GLOSSARY, HASHTAG_SETS, MANUAL_SECTIONS } from "@/lib/marketing/plan";
import { Card, SectionTitle } from "../parts";
import { GlossarySearch } from "../ui";

// Contenido 100% estático: no necesita estado ni sesión por request.

export default function ManualPage() {
  const estudio = MANUAL_SECTIONS.find((s) => s.id === "estudio")!;
  const capcut = MANUAL_SECTIONS.find((s) => s.id === "capcut")!;
  const errores = MANUAL_SECTIONS.find((s) => s.id === "errores")!;

  return (
    <div>
      <SectionTitle sub="Todo lo educativo de la Parte 0, navegable. Los términos raros están en el diccionario; las recetas, en tarjetas paso a paso.">
        Manual del creador principiante
      </SectionTitle>

      {/* Diccionario */}
      <Card>
        <p className="text-sm font-semibold text-white">📖 Diccionario — todos los términos raros, en cristiano</p>
        <div className="mt-3">
          <GlossarySearch entries={GLOSSARY} />
        </div>
      </Card>

      {/* Estudio y CapCut */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-semibold text-white">🏠 {estudio.title}</p>
          {estudio.intro && <p className="mt-1 text-xs text-slate-500">{estudio.intro}</p>}
          <ol className="mt-3 space-y-2.5">
            {estudio.steps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-[#2fe3a5]">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-white">✂️ {capcut.title}</p>
          {capcut.intro && <p className="mt-1 rounded-lg bg-amber-500/10 p-2 text-xs leading-relaxed text-amber-300">{capcut.intro}</p>}
          <ol className="mt-3 space-y-2.5">
            {capcut.steps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-[#2fe3a5]">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* Errores */}
      <SectionTitle sub={errores.intro}>🚫 {errores.title}</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {errores.steps.map((e, i) => {
          const [title, ...rest] = e.split(":");
          return (
            <div key={i} className="rounded-xl border border-red-900/40 bg-slate-900 p-4">
              <p className="text-sm font-semibold text-red-300">{i + 1}. {title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{rest.join(":").trim()}</p>
            </div>
          );
        })}
      </div>

      {/* Hashtags */}
      <SectionTitle sub="Mezcla siempre grandes + medios + nicho + #zentro. Nunca el mismo set en todos los posts (patrón de bot) y nunca #fyp.">
        #️⃣ Sets de hashtags por tipo de contenido
      </SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">
        {HASHTAG_SETS.map((h) => (
          <Card key={h.pillar} className="!p-4">
            <p className="text-sm font-semibold text-white">{h.pillar}</p>
            <p className="mt-1 font-mono text-xs text-[#2fe3a5]">{h.tags}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{h.why}</p>
          </Card>
        ))}
      </div>

      {/* Principios */}
      <SectionTitle sub="Los 8 principios extraídos de los creadores que sí funcionan — el porqué detrás de cada guion.">🧠 Principios (no tendencias)</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Documentar > crear", "No “haces marketing”: muestras lo que ya haces (construir, fallar, corregir). Programas Zentro todos los días — ese ES el contenido."],
          ["Gancho triple en el segundo 0", "Visual + verbal + texto, los tres a la vez. Nunca “hola, soy Steve y hoy...”."],
          ["Retención = cambio cada ≤5 s", "Cortes cada 2-3 s + zoom, texto o pantalla cada 5. La completion rate es la métrica reina (por eso 20-40 s)."],
          ["Autenticidad calculada", "Luz de ventana, hablar como nota de voz. Lo pulido parece anuncio; lo crudo-pero-nítido parece verdad. Nítido = buen audio SIEMPRE."],
          ["Un video = una idea", "Si necesitas “y además...”, son dos videos."],
          ["La primera hora manda", "Responder cada comentario en <60 min multiplica el alcance."],
          ["Regla 80/20", "80% de los videos ni mencionan Zentro hasta el final; 20% son invitación directa. El error #1: hablar del producto en vez del problema."],
          ["200 views buenas > 50k de curiosos", "Con 15 cupos, el video “aburrido” que trae 3 registros vale más que el trend con 20k views y 0 registros."],
        ].map(([t, d]) => (
          <Card key={t} className="!p-4">
            <p className="text-sm font-semibold text-[#2fe3a5]">{t}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{d}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <p className="text-sm font-semibold text-white">📄 Documentos de respaldo</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Este manual resume <code className="font-mono">Marketing-Assets-Zentro/Guiones-60-Videos-Zentro.md</code> (Parte 0) y{" "}
          <code className="font-mono">Estrategia-Contenido-Organico-Zentro.md</code>. Los documentos quedan como respaldo y para
          ediciones profundas; el trabajo diario es aquí.
        </p>
      </Card>
    </div>
  );
}
