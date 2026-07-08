import { Card, SectionTitle } from "../parts";

// Módulo IA: hoy es la estructura + los "prompts listos" para usar con Claude
// en el chat del proyecto. Cuando haya presupuesto (regla: se paga solo con lo
// generado), estas tarjetas se conectan a la API de Claude vía server actions.

const FUTURE = [
  {
    title: "Generador de ganchos",
    desc: "5 variantes del gancho de cualquier video, ordenadas por potencial de retención.",
    prompt: "Genera 5 variantes del gancho del video #N de Zentro (primeros 3 segundos: frase + texto grande + expresión), manteniendo el tono honesto no-vendedor.",
  },
  {
    title: "Análisis de rendimiento",
    desc: "Lee las métricas anotadas y explica POR QUÉ un video funcionó o no, con el cambio concreto a probar.",
    prompt: "Con las métricas de mis últimos videos de Zentro (te las pego), dime qué formato duplicar el domingo, cuál eliminar y qué hipótesis probar la próxima semana.",
  },
  {
    title: "Mejorador de guiones",
    desc: "Expande cualquier brief (13-60) al nivel segundo-a-segundo del lote 1.",
    prompt: "Expande el guion #N al nivel del lote 1: preparación, guion segundo a segundo (tono, cara, manos, mirada), edición CapCut, textos por capas, ritmo y errores.",
  },
  {
    title: "Recomendador de publicación",
    desc: "Sugiere qué video publicar, cuándo y con qué caption, según el calendario y las métricas.",
    prompt: "Según mi calendario del Marketing OS y las métricas de la semana, ¿qué video publico esta semana, en qué horario y con qué caption para cada red?",
  },
  {
    title: "Respuestas a comentarios",
    desc: "Borradores de respuesta que convierten comentarios en DMs sin sonar a robot.",
    prompt: "Me comentaron esto en un video de Zentro: “...”. Dame una respuesta pública breve + el primer DM (con una pregunta sobre SU negocio antes del link).",
  },
  {
    title: "Radar de tendencias",
    desc: "Valida cada lote contra búsquedas en alza (ya se hace con trends-mcp en el chat).",
    prompt: "Valida los ejes de contenido de Zentro contra tendencias frescas de Google/TikTok y dime si algún gancho del próximo lote debe cambiar.",
  },
];

export default function IAPage() {
  return (
    <div>
      <SectionTitle sub="La estructura está lista para conectarse a la API de Claude cuando Zentro genere ingresos (regla: lo pago se paga solo con lo generado). Mientras tanto, cada tarjeta trae el prompt exacto para pedírselo a Claude en el chat del proyecto — mismo resultado, costo cero.">
        ✧ Asistente IA
      </SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FUTURE.map((f) => (
          <Card key={f.title} className="flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{f.title}</p>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500">próximamente</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{f.desc}</p>
            <div className="mt-3 rounded-lg border border-dashed border-slate-700 bg-slate-950/50 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Prompt listo (cópialo al chat)</p>
              <p className="mt-1 select-all text-xs leading-relaxed text-slate-300">{f.prompt}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-dashed">
        <p className="text-sm font-semibold text-slate-300">Diseño de la integración futura</p>
        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-500">
          <li>• Server action por función (generateHooks, analyzeMetrics...) llamando a la API de Claude con el contexto de <code className="font-mono">src/lib/marketing/*</code>.</li>
          <li>• Los resultados se guardan en <code className="font-mono">marketing_state</code> (clave <code className="font-mono">ai:&lt;videoId&gt;:&lt;tool&gt;</code>) para no re-generar.</li>
          <li>• Presupuesto tope mensual configurable; se activa solo cuando exista el primer ingreso real.</li>
        </ul>
      </Card>
    </div>
  );
}
