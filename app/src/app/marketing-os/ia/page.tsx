import { IconSparkle } from "../icons";
import { Card, PageHeader } from "../parts";

// Módulo IA: estructura lista + prompts exactos para usar con Claude en el
// chat del proyecto (mismo resultado, costo cero). Se conecta a la API
// cuando Zentro genere ingresos (regla: lo pago se paga con lo generado).

const TOOLS = [
  { title: "Generador de ganchos", desc: "5 variantes del gancho de cualquier video, ordenadas por potencial de retención.", prompt: "Genera 5 variantes del gancho del video #N de Zentro (primeros 3 segundos: frase + texto grande + expresión), manteniendo el tono honesto no-vendedor." },
  { title: "Análisis de rendimiento", desc: "Lee las métricas anotadas y explica POR QUÉ un video funcionó, con el cambio concreto a probar.", prompt: "Con las métricas de mis últimos videos de Zentro (te las pego), dime qué formato duplicar el domingo, cuál eliminar y qué hipótesis probar la próxima semana." },
  { title: "Mejorador de guiones", desc: "Expande cualquier brief (13-60) al nivel dirigido de los 12 principales.", prompt: "Expande el guion #N al nivel de los 12 principales: preparación, guion dirigido segundo a segundo (tono, energía, cuerpo, cámara, mirada), edición CapCut, textos por capas, ritmo y errores." },
  { title: "Recomendador de publicación", desc: "Qué video publicar, cuándo y con qué caption, según calendario y métricas.", prompt: "Según mi calendario del Marketing OS y las métricas de la semana, ¿qué video publico esta semana, en qué horario y con qué caption para cada red?" },
  { title: "Respuestas a comentarios", desc: "Borradores que convierten comentarios en DMs sin sonar a robot.", prompt: "Me comentaron esto en un video de Zentro: “...”. Dame una respuesta pública breve + el primer DM (con una pregunta sobre SU negocio antes del link)." },
  { title: "Radar de tendencias", desc: "Valida cada lote contra búsquedas en alza (trends-mcp, ya probado).", prompt: "Valida los ejes de contenido de Zentro contra tendencias frescas de Google/TikTok y dime si algún gancho del próximo lote debe cambiar." },
];

export default function IAPage() {
  return (
    <div>
      <PageHeader
        title="Asistente IA"
        sub="La estructura está lista para conectarse a la API de Claude cuando Zentro genere ingresos. Mientras tanto, cada tarjeta trae el prompt exacto para pedírselo a Claude en el chat — mismo resultado, costo cero."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((f) => (
          <Card key={f.title} className="flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-white">
                <IconSparkle className="h-4 w-4 text-[#3ee6a8]" /> {f.title}
              </p>
              <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-500 ring-1 ring-white/[0.06]">próximamente</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">{f.desc}</p>
            <div className="mt-3 rounded-xl border border-dashed border-white/[0.1] bg-black/20 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Prompt listo · cópialo al chat</p>
              <p className="mt-1.5 select-all text-xs leading-relaxed text-zinc-300">{f.prompt}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-dashed !bg-transparent">
        <p className="font-display text-sm font-bold text-zinc-300">Diseño de la integración futura</p>
        <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-zinc-500">
          <li>· Una server action por herramienta (generateHooks, analyzeMetrics...) llamando a la API de Claude con el contexto de <code className="font-mono">src/lib/marketing/*</code>.</li>
          <li>· Resultados cacheados en <code className="font-mono">marketing_state</code> (clave <code className="font-mono">ai:&lt;videoId&gt;:&lt;tool&gt;</code>) para no re-generar.</li>
          <li>· Presupuesto tope mensual configurable; se activa solo con el primer ingreso real.</li>
        </ul>
      </Card>
    </div>
  );
}
