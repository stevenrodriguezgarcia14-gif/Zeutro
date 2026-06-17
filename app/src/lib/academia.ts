// =====================================================================
// Academia Zentro — lecciones cortas y prácticas para el emprendedor.
// Contenido educativo conectado a los módulos del producto.
// body: cada string es un párrafo; si empieza con "- " es viñeta,
// si empieza con "## " es subtítulo.
// =====================================================================

import type { ModuleSlug, ActivationData } from "@/lib/guide";
import type { Tier, GlyphKey } from "@/components/academy/Emblem";

export type Category = { slug: string; title: string; emoji: string; desc: string };

export type Difficulty = "basico" | "intermedio" | "avanzado";
export type ChallengeOption = { text: string; correct: boolean; feedback: string };

// Dos clases de desafío:
//  - scenario: caso real con opciones (comprensión).
//  - action: se cumple en el negocio real, verificado con datos (adopción).
export type Challenge = {
  id: string;
  type: "scenario" | "action";
  difficulty: Difficulty;
  prompt: string;
  // scenario
  options?: ChallengeOption[];
  explanation?: string;
  // action
  check?: (d: ActivationData) => boolean;
  cta?: string;
  href?: string;
};

export const CATEGORIES: Category[] = [
  { slug: "rentabilidad", title: "Rentabilidad", emoji: "📈", desc: "Saber si de verdad ganas." },
  { slug: "precios", title: "Precios y costos", emoji: "🏷️", desc: "Cobrar bien sin perder." },
  { slug: "ventas", title: "Ventas y clientes", emoji: "💬", desc: "Vender y dar seguimiento." },
  { slug: "caja", title: "Flujo de caja", emoji: "💧", desc: "Que nunca te falte dinero." },
  { slug: "organizacion", title: "Organización", emoji: "🗂️", desc: "Orden para crecer sin caos." },
];

export type Lesson = {
  slug: string;
  category: string;
  title: string;
  emoji: string;
  minutes: number;
  resumen: string;
  body: string[];
  related?: ModuleSlug;
  challenges?: Challenge[];
};

export const LESSONS: Lesson[] = [
  {
    slug: "vender-no-es-ganar", category: "rentabilidad", emoji: "🤔", minutes: 3,
    title: "Vender mucho no siempre es ganar",
    resumen: "Por qué el volumen engaña y qué mirar en su lugar.",
    related: "profitability",
    body: [
      "Muchos negocios venden mucho y aun así no les queda dinero. ¿La razón? Confunden ventas con ganancia.",
      "## La diferencia",
      "Ventas es todo lo que entra. Ganancia es lo que sobra después de pagar el costo de lo que vendiste y tus gastos.",
      "- Vendiste $10,000 este mes (ventas).",
      "- Te costó $6,000 la mercancía y $3,000 de renta, luz y demás (costos + gastos).",
      "- Tu ganancia real fue $1,000, no $10,000.",
      "## Qué hacer en Zentro",
      "Registra siempre el costo de tus productos y tus gastos. Así la pantalla de Rentabilidad te muestra la ganancia real, no solo cuánto facturaste.",
      "Regla de oro: un producto que se vende mucho pero deja poco margen puede estar quitándote tiempo y dinero. Revisa la Rentabilidad por producto.",
    ],
    challenges: [
      {
        id: "renta-1", type: "scenario", difficulty: "basico",
        prompt: "Tus ventas subieron 30% este mes, pero tu ganancia bajó. ¿Qué revisas PRIMERO?",
        options: [
          { text: "El costo de lo que vendes y tus gastos", correct: true, feedback: "Exacto. Más ventas con menos ganancia casi siempre es costo o gasto que subió." },
          { text: "Vender todavía más para compensar", correct: false, feedback: "Vender más sin arreglar el margen agranda el problema, no lo resuelve." },
          { text: "Bajar los precios para vender más", correct: false, feedback: "Bajar precios sin conocer tu costo puede hacerte perder en cada venta." },
        ],
        explanation: "Ganancia = ventas − costos − gastos. Si las ventas suben y la ganancia baja, el costo o el gasto creció: ahí está la fuga.",
      },
      {
        id: "renta-accion-precio", type: "action", difficulty: "basico",
        prompt: "Ponle precio de venta a al menos un producto para poder medir tu ganancia real.",
        check: (d) => d.productsWithPrice > 0, cta: "Ir a Productos", href: "/products",
      },
    ],
  },
  {
    slug: "numeros-que-vigilar", category: "rentabilidad", emoji: "🔢", minutes: 4,
    title: "Los 5 números que todo negocio debe vigilar",
    resumen: "El tablero mínimo para no volar a ciegas.",
    related: "profitability",
    body: [
      "No necesitas ser contador. Con vigilar 5 números cada semana ya vas adelante de la mayoría:",
      "- 1. Dinero en cuentas: cuánto tienes hoy de verdad (módulo Cuentas).",
      "- 2. Por cobrar: cuánto te deben tus clientes (Cobranzas).",
      "- 3. Por pagar: cuánto debes tú (Gastos pendientes).",
      "- 4. Ganancia del mes: ingresos menos gastos (Rentabilidad / Dashboard).",
      "- 5. Flujo proyectado: si te alcanzará el dinero las próximas semanas (Flujo de caja).",
      "## Cómo usarlos",
      "El Dashboard de Zentro te muestra casi todos de un vistazo. Dedica 5 minutos cada lunes a revisarlos: es el hábito que separa a los negocios que crecen de los que viven al día.",
    ],
    challenges: [
      {
        id: "numeros-1", type: "scenario", difficulty: "intermedio",
        prompt: "Tienes $50,000 en el banco, pero tus clientes te deben $80,000 y tú debes pagar $90,000 esta semana. ¿Cuál es tu mayor riesgo?",
        options: [
          { text: "Quedarte sin efectivo aunque 'en papel' tengas dinero", correct: true, feedback: "Correcto. Te deben más de lo que tienes y debes pagar ya: es un problema de liquidez." },
          { text: "Ninguno, te deben más de lo que debes", correct: false, feedback: "Que te deban no paga tus cuentas hoy. El dinero por cobrar no es dinero disponible." },
          { text: "Estás en quiebra", correct: false, feedback: "No necesariamente; es un problema de tiempo (liquidez), no de rentabilidad. Hay que acelerar cobros." },
        ],
        explanation: "El dinero por cobrar no sirve para pagar hoy. Vigila tu caja y tus vencimientos, no solo cuánto te deben.",
      },
    ],
  },
  {
    slug: "poner-precio-correcto", category: "precios", emoji: "🏷️", minutes: 4,
    title: "Cómo poner el precio correcto",
    resumen: "Del costo al precio, sin adivinar.",
    related: "products",
    body: [
      "Poner precio 'a ojo' es de los errores más caros. Hazlo en 3 pasos:",
      "## 1. Conoce tu costo real",
      "No es solo lo que pagaste por el producto. Suma flete, comisiones y empaque. Ese es tu costo unitario real.",
      "## 2. Decide tu margen",
      "El margen es el porcentaje que quieres ganar sobre el precio de venta. La fórmula que usa Zentro es: precio = costo ÷ (1 − margen).",
      "- Costo $60, margen deseado 40% → precio = 60 ÷ 0.6 = $100.",
      "## 3. Usa 3 precios",
      "Zentro te sugiere un precio mínimo (no vendas por debajo), uno objetivo (tu meta) y uno alto. Así negocias con piso y techo claros.",
      "Revisa tus precios cada vez que cambie tu costo: si te subió el proveedor y no subiste el precio, estás regalando margen.",
    ],
    challenges: [
      {
        id: "precio-1", type: "scenario", difficulty: "intermedio",
        prompt: "Un producto te cuesta $60 y quieres ganar 40% sobre el precio de venta. ¿A cuánto lo vendes?",
        options: [
          { text: "$100", correct: true, feedback: "Correcto: precio = costo ÷ (1 − margen) = 60 ÷ 0.6 = $100." },
          { text: "$84 (costo + 40%)", correct: false, feedback: "Cuidado: sumar 40% al costo da 40% sobre el costo, no sobre el precio. Tu margen real sería menor (~29%)." },
          { text: "$60 + $40 = $100 pero por otra razón", correct: false, feedback: "El resultado se parece, pero la fórmula correcta es costo ÷ (1 − margen)." },
        ],
        explanation: "Margen sobre precio: precio = costo ÷ (1 − margen). Sumar el % al costo (margen sobre costo) da un margen real menor.",
      },
    ],
  },
  {
    slug: "costo-vs-gasto", category: "precios", emoji: "⚖️", minutes: 3,
    title: "Costo vs gasto: no son lo mismo",
    resumen: "Separarlos bien es clave para tu rentabilidad.",
    related: "expenses",
    body: [
      "Confundir costos y gastos descuadra tus números. Esta es la diferencia simple:",
      "- Costo: lo que pagas por aquello que vendes. Si vendes camisas, las camisas son costo. Sube si vendes más.",
      "- Gasto: lo que pagas para operar, vendas o no. Renta, luz, internet, sueldos. Es más o menos fijo.",
      "## Por qué importa",
      "Tu ganancia bruta = ventas − costos. Tu ganancia neta = ganancia bruta − gastos. Si mezclas todo, no sabes si el problema es que compras caro o que gastas de más.",
      "## En Zentro",
      "La mercancía para revender va en Compras. Lo operativo (renta, servicios, sueldos) va en Gastos. No los mezcles y tu Rentabilidad será confiable.",
    ],
  },
  {
    slug: "comprar-sin-perder", category: "precios", emoji: "🛒", minutes: 4,
    title: "Comprar para revender sin perder",
    resumen: "Cómo saber tu costo real por unidad.",
    related: "purchases",
    body: [
      "Cuando compras mercancía para revender, tu costo no es solo el precio de la factura del proveedor.",
      "## Suma todo lo que invertiste",
      "Al precio de los productos súmale flete, aduana, comisiones y cualquier gasto de esa compra. Zentro reparte esos gastos extra entre los productos (prorrateo) para darte el costo real de cada unidad.",
      "## Cuida tu capital",
      "El dinero invertido en mercancía que aún no vendes es 'capital en mercancía': está ahí, pero no lo puedes gastar. Vigílalo para no quedarte sin efectivo por sobre-comprar.",
      "## Mide la recuperación",
      "Registra cuántas unidades vendes. Zentro te dice cuánto recuperaste, cuánto ganaste y tu ROI. Así sabes si esa compra fue buen negocio antes de repetirla.",
    ],
    challenges: [
      {
        id: "compra-1", type: "scenario", difficulty: "basico",
        prompt: "Compraste mercancía por $100,000 y pagaste $20,000 de envío. Recibiste 120 piezas. ¿Cuál es el costo real por pieza?",
        options: [
          { text: "$1,000 — sumas el envío y divides entre 120", correct: true, feedback: "Correcto: (100,000 + 20,000) ÷ 120 = $1,000. El envío es parte del costo." },
          { text: "$833 — solo divides los $100,000 entre 120", correct: false, feedback: "Dejaste fuera el envío. Si no lo cuentas, crees que ganas más de lo real." },
          { text: "$120,000 — ese es el costo", correct: false, feedback: "Ese es el total de la compra, no el costo por pieza." },
        ],
        explanation: "Costo real = (precio + todos los gastos de la compra) ÷ unidades. Zentro reparte el envío entre las piezas automáticamente (prorrateo).",
      },
      {
        id: "compra-accion", type: "action", difficulty: "basico",
        prompt: "Registra una compra para ver tu inversión, recuperación y ganancia reales.",
        check: (d) => d.purchases > 0, cta: "Ir a Compras", href: "/purchases",
      },
    ],
  },
  {
    slug: "embudo-de-ventas", category: "ventas", emoji: "📊", minutes: 4,
    title: "El embudo: de prospecto a cliente",
    resumen: "Para no perder ventas por falta de seguimiento.",
    related: "sales",
    body: [
      "La mayoría de las ventas no se cierran en el primer contacto. El embudo te ayuda a no dejar a nadie en el olvido.",
      "## Las etapas",
      "Un prospecto avanza por etapas: contacto, propuesta, negociación, cierre. En cada etapa hay una probabilidad de que se concrete.",
      "## La regla del seguimiento",
      "Una oportunidad estancada es una venta que se enfría. Revisa tu embudo cada semana y mueve o contacta lo que lleva mucho tiempo quieto.",
      "## En Zentro",
      "El módulo Ventas (Embudo) te muestra el valor probable de tu pipeline y alimenta tu Flujo de caja con las ventas que esperas cerrar. Así proyectas ingresos, no solo deseos.",
    ],
  },
  {
    slug: "cotizar-para-cerrar", category: "ventas", emoji: "📝", minutes: 3,
    title: "Cotiza para cerrar (y da seguimiento)",
    resumen: "Una cotización clara vende; una olvidada se pierde.",
    related: "quotations",
    body: [
      "Una buena cotización transmite profesionalismo y acelera el sí del cliente.",
      "- Sé claro con qué incluye y qué no.",
      "- Pon una vigencia ('válida hasta...'): crea urgencia sana.",
      "- Haz seguimiento a los 2-3 días si no responden.",
      "## El paso clave",
      "Cuando el cliente acepta, conviértela en factura con un clic en Zentro. No vuelvas a capturar todo: evitas errores y ahorras tiempo.",
      "Las cotizaciones enviadas sin respuesta aparecen como pendientes en tu Centro de Orientación para que no se te escapen.",
    ],
  },
  {
    slug: "nunca-falte-dinero", category: "caja", emoji: "💧", minutes: 4,
    title: "Que nunca te falte dinero",
    resumen: "Flujo de caja explicado fácil.",
    related: "cashflow",
    body: [
      "Un negocio puede ser rentable y aun así quebrar si se queda sin efectivo en el momento equivocado. Eso lo previene el flujo de caja.",
      "## Qué es",
      "Es una proyección: cuánto dinero tendrás en las próximas semanas sumando lo que vas a cobrar y restando lo que vas a pagar.",
      "## Cómo cuidarlo",
      "- Cobra a tiempo (no dejes que las facturas se venzan).",
      "- No concentres todos tus pagos el mismo día.",
      "- Si ves un hueco próximo, adelanta cobros o pospón un gasto no urgente.",
      "## En Zentro",
      "El módulo Flujo de caja te avisa si tu saldo proyectado se va a negativo. Si ves esa alerta roja, actúa antes de que pase, no después.",
    ],
    challenges: [
      {
        id: "caja-1", type: "scenario", difficulty: "intermedio",
        prompt: "Tu proyección de flujo de caja se pone en rojo en 3 semanas. ¿Qué haces HOY?",
        options: [
          { text: "Acelero cobros y pospongo un pago no urgente", correct: true, feedback: "Correcto. Mueves las fechas para que no se crucen: cobras antes, pagas después." },
          { text: "Espero a ver si se arregla solo", correct: false, feedback: "El problema de caja avisa con tiempo justo para actuar; esperar lo vuelve crisis." },
          { text: "Pido un préstamo de inmediato", correct: false, feedback: "Endeudarte es el último recurso, no el primero. Primero ajusta cobros y pagos." },
        ],
        explanation: "El flujo de caja te avisa ANTES. Tienes margen para acelerar cobros y reprogramar pagos sin endeudarte.",
      },
      {
        id: "caja-accion", type: "action", difficulty: "basico",
        prompt: "Crea tu caja o cuenta de banco con su saldo actual para que el flujo de caja sea real.",
        check: (d) => d.accounts > 0, cta: "Ir a Cuentas", href: "/accounts",
      },
    ],
  },
  {
    slug: "cobranza-sin-miedo", category: "caja", emoji: "📬", minutes: 3,
    title: "Cobranza sin pena ni miedo",
    resumen: "Cobrar a tiempo es tu derecho, no un favor.",
    related: "collections",
    body: [
      "Cobrar incomoda a muchos emprendedores. Pero el dinero que no cobras es trabajo que regalaste.",
      "## Hazlo un sistema, no un drama",
      "- Acuerda las condiciones de pago desde el inicio (contado, 15 o 30 días).",
      "- Manda un recordatorio amable unos días antes del vencimiento.",
      "- Si se vence, un segundo recordatorio firme pero cordial.",
      "## En Zentro",
      "Cobranzas te ordena a quién cobrar por urgencia y te deja enviar recordatorios con un clic. Atender lo vencido cada semana mejora tu flujo más que cualquier venta nueva.",
    ],
  },
  {
    slug: "ordena-tu-dia", category: "organizacion", emoji: "✅", minutes: 3,
    title: "Tareas y proyectos: ordena tu día",
    resumen: "Cuándo usar una tarea y cuándo un proyecto.",
    related: "tasks",
    body: [
      "Tener todo 'en la cabeza' es agotador y se te olvidan cosas. Sácalo a Zentro.",
      "## Tarea o proyecto",
      "- Tarea: algo puntual ('llamar al proveedor', 'pagar la luz'). Ponle fecha y prioridad.",
      "- Proyecto: un trabajo grande con varios pasos ('lanzar la tienda', 'evento del cliente X'). Agrupa varias tareas.",
      "## El truco de la fecha",
      "Una tarea sin fecha no entra a tus prioridades. Si algo importa, ponle fecha. Y si se repite (pagar renta cada mes), márcala como recurrente: Zentro crea la siguiente sola.",
      "Dedica 5 minutos en la mañana a mirar tus tareas de hoy. Es el hábito de organización más rentable que existe.",
    ],
    challenges: [
      {
        id: "org-1", type: "scenario", difficulty: "basico",
        prompt: "Tienes 10 pendientes y poco tiempo. ¿Cómo decides qué hacer primero?",
        options: [
          { text: "Lo urgente + lo que trae o cuida dinero (cobrar, entregar)", correct: true, feedback: "Correcto. Prioriza por impacto en el negocio, no por lo que es más fácil o agradable." },
          { text: "Lo más rápido y fácil, para avanzar en número", correct: false, feedback: "Tachar tareas fáciles se siente bien pero no mueve tu negocio." },
          { text: "En el orden en que llegaron", correct: false, feedback: "El orden de llegada no dice nada de la importancia." },
        ],
        explanation: "Prioriza por impacto (dinero/compromisos) y urgencia. Es la base del Centro de Prioridades de Zentro.",
      },
      {
        id: "org-accion", type: "action", difficulty: "basico",
        prompt: "Organiza tu trabajo: registra al menos un cliente o un proyecto.",
        check: (d) => d.customers > 0 || d.projects > 0, cta: "Ir a Clientes", href: "/customers",
      },
    ],
  },
  {
    slug: "primeros-7-dias", category: "organizacion", emoji: "🚀", minutes: 5,
    title: "Tus primeros 7 días en Zentro",
    resumen: "Un plan simple para arrancar con valor rápido.",
    body: [
      "No intentes usar todo el primer día. Sigue este plan y en una semana ya tendrás control real de tu negocio:",
      "## Día 1 — Configura lo básico",
      "- Elige tu tipo de negocio (te personaliza todo).",
      "- Crea tu cuenta de caja/banco con su saldo actual.",
      "## Días 2-3 — Carga lo tuyo",
      "- Agrega tus productos o servicios con su costo y precio.",
      "- Importa o crea tus clientes principales.",
      "## Días 4-5 — Opera de verdad",
      "- Registra tus ventas/facturas reales del día.",
      "- Registra tus gastos conforme ocurren.",
      "## Días 6-7 — Mira los números",
      "- Revisa tu Rentabilidad y tu Flujo de caja.",
      "- Atiende lo que el Centro de Orientación te sugiera.",
      "Sigue el checklist de tu Centro de Orientación: cuando llegue al 100%, ya dominas lo esencial.",
    ],
  },
];

export function lessonsByCategory(cat: string): Lesson[] {
  return LESSONS.filter((l) => l.category === cat);
}

// =====================================================================
// Fase B/C — Rutas, Logros y Certificaciones
// =====================================================================

export type Route = { slug: string; title: string; emoji: string; desc: string; category: string };
export const ROUTES: Route[] = [
  { slug: "rentabilidad", title: "Ruta Rentabilidad", emoji: "📈", desc: "Saber si de verdad ganas.", category: "rentabilidad" },
  { slug: "precios", title: "Ruta Precios y Costos", emoji: "🏷️", desc: "Cobrar bien sin perder.", category: "precios" },
  { slug: "caja", title: "Ruta Flujo de Caja", emoji: "💧", desc: "Que nunca te falte dinero.", category: "caja" },
  { slug: "organizacion", title: "Ruta Organización", emoji: "🗂️", desc: "Orden para crecer sin caos.", category: "organizacion" },
];

export type LearnSummary = {
  guidesRead: number; guidesTotal: number;
  scenariosPassed: number; scenariosTotal: number;
  actionsDone: number; actionsTotal: number;
  routesComplete: number; routesTotal: number;
  certsEarned: number;
};

export type Achievement = { slug: string; title: string; desc: string; tier: Tier; glyph: GlyphKey; unlocked: (s: LearnSummary) => boolean };
export const ACHIEVEMENTS: Achievement[] = [
  { slug: "primera-guia", title: "Primeros pasos", desc: "Leíste tu primera guía", tier: "bronce", glyph: "guide", unlocked: (s) => s.guidesRead >= 1 },
  { slug: "lector", title: "Lector aplicado", desc: "Leíste 5 guías", tier: "plata", glyph: "stack", unlocked: (s) => s.guidesRead >= 5 },
  { slug: "primer-reto", title: "Mente analítica", desc: "Aprobaste tu primer desafío", tier: "bronce", glyph: "analysis", unlocked: (s) => s.scenariosPassed >= 1 },
  { slug: "estratega", title: "Estratega", desc: "Aprobaste 5 desafíos", tier: "oro", glyph: "target", unlocked: (s) => s.scenariosPassed >= 5 },
  { slug: "manos-obra", title: "Manos a la obra", desc: "Hiciste una acción real en tu negocio", tier: "plata", glyph: "spark", unlocked: (s) => s.actionsDone >= 1 },
  { slug: "ruta-1", title: "Camino recorrido", desc: "Completaste una ruta entera", tier: "oro", glyph: "route", unlocked: (s) => s.routesComplete >= 1 },
  { slug: "erudito", title: "Erudito Zentro", desc: "Completaste todas las rutas", tier: "platino", glyph: "crown", unlocked: (s) => s.routesTotal > 0 && s.routesComplete >= s.routesTotal },
  { slug: "certificado", title: "Certificado", desc: "Obtuviste tu primera certificación", tier: "platino", glyph: "shield", unlocked: (s) => s.certsEarned >= 1 },
];

export type Certification = {
  slug: string; title: string; desc: string; level: string; category: string;
  tier: Tier; accent: string;
  routeSlugs: string[]; minScorePct: number; requiredActionIds: string[];
  requiresCerts?: string[];
};

const ALL_ROUTES = ["rentabilidad", "precios", "caja", "organizacion"];
const ALL_ACTIONS = ["renta-accion-precio", "compra-accion", "caja-accion", "org-accion"];

export const CERTIFICATIONS: Certification[] = [
  // --- 4 especializaciones por área (Plata) ---
  { slug: "esp-rentabilidad", title: "Especialista en Rentabilidad", desc: "Sabes si tu negocio gana de verdad y por qué.",
    level: "Especialista", category: "Rentabilidad", tier: "plata", accent: "#00c781",
    routeSlugs: ["rentabilidad"], minScorePct: 80, requiredActionIds: ["renta-accion-precio"] },
  { slug: "esp-precios", title: "Especialista en Precios y Costos", desc: "Pones precios que dejan ganancia, sin adivinar.",
    level: "Especialista", category: "Precios y Costos", tier: "plata", accent: "#f5a623",
    routeSlugs: ["precios"], minScorePct: 80, requiredActionIds: ["compra-accion"] },
  { slug: "esp-caja", title: "Especialista en Flujo de Caja", desc: "Te aseguras de que nunca falte dinero.",
    level: "Especialista", category: "Flujo de Caja", tier: "plata", accent: "#2e90fa",
    routeSlugs: ["caja"], minScorePct: 80, requiredActionIds: ["caja-accion"] },
  { slug: "esp-organizacion", title: "Especialista en Organización", desc: "Ordenas tu trabajo para crecer sin caos.",
    level: "Especialista", category: "Organización", tier: "plata", accent: "#8b5cf6",
    routeSlugs: ["organizacion"], minScorePct: 80, requiredActionIds: ["org-accion"] },

  // --- 3 niveles generales ascendentes ---
  { slug: "fundamentos", title: "Fundamentos de Negocio", desc: "Dominas lo esencial de las 4 áreas clave.",
    level: "Fundamental", category: "Gestión de negocio", tier: "oro", accent: "#e9c45a",
    routeSlugs: ALL_ROUTES, minScorePct: 80, requiredActionIds: ALL_ACTIONS },
  { slug: "profesional", title: "Gestión Profesional", desc: "Aprobaste todas las áreas con excelencia.",
    level: "Profesional", category: "Gestión integral", tier: "platino", accent: "#38bdf8",
    routeSlugs: ALL_ROUTES, minScorePct: 100, requiredActionIds: [],
    requiresCerts: ["esp-rentabilidad", "esp-precios", "esp-caja", "esp-organizacion"] },
  { slug: "maestro", title: "Maestría Zentro", desc: "El máximo reconocimiento: dominio total y aplicado.",
    level: "Maestro", category: "Maestría", tier: "platino", accent: "#d4af37",
    routeSlugs: ALL_ROUTES, minScorePct: 100, requiredActionIds: ALL_ACTIONS,
    requiresCerts: ["profesional", "fundamentos"] },
];

export function routeLessons(route: Route): Lesson[] { return lessonsByCategory(route.category); }

function challengeDone(c: Challenge, passed: Set<string>, d: ActivationData): boolean {
  return c.type === "scenario" ? passed.has(c.id) : !!c.check?.(d);
}

function lessonDone(l: Lesson, read: Set<string>, passed: Set<string>, d: ActivationData): boolean {
  if (!read.has(l.slug)) return false;
  return (l.challenges ?? []).every((c) => challengeDone(c, passed, d));
}

export function routeComplete(route: Route, read: Set<string>, passed: Set<string>, d: ActivationData): boolean {
  return routeLessons(route).every((l) => lessonDone(l, read, passed, d));
}

export function allScenarios(): Challenge[] { return LESSONS.flatMap((l) => (l.challenges ?? []).filter((c) => c.type === "scenario")); }
export function allActions(): Challenge[] { return LESSONS.flatMap((l) => (l.challenges ?? []).filter((c) => c.type === "action")); }

export function learnSummary(read: Set<string>, passed: Set<string>, d: ActivationData, certsEarned: number): LearnSummary {
  const scen = allScenarios(); const act = allActions();
  return {
    guidesRead: LESSONS.filter((l) => read.has(l.slug)).length,
    guidesTotal: LESSONS.length,
    scenariosPassed: scen.filter((c) => passed.has(c.id)).length,
    scenariosTotal: scen.length,
    actionsDone: act.filter((c) => !!c.check?.(d)).length,
    actionsTotal: act.length,
    routesComplete: ROUTES.filter((r) => routeComplete(r, read, passed, d)).length,
    routesTotal: ROUTES.length,
    certsEarned,
  };
}

function certScenarios(cert: Certification): Challenge[] {
  const cats = new Set(cert.routeSlugs.map((s) => ROUTES.find((r) => r.slug === s)?.category));
  return LESSONS.filter((l) => cats.has(l.category)).flatMap((l) => (l.challenges ?? []).filter((c) => c.type === "scenario"));
}

export function certRequirements(cert: Certification, read: Set<string>, passed: Set<string>, d: ActivationData, earnedCerts: Set<string> = new Set()) {
  const routes = cert.routeSlugs.map((s) => ROUTES.find((r) => r.slug === s)).filter((r): r is Route => !!r);
  const allRead = routes.every((r) => routeLessons(r).every((l) => read.has(l.slug)));
  const scen = certScenarios(cert);
  const scorePct = scen.length ? Math.round((scen.filter((c) => passed.has(c.id)).length / scen.length) * 100) : 0;
  const acts = allActions();
  const actsOk = cert.requiredActionIds.every((id) => { const c = acts.find((a) => a.id === id); return c ? !!c.check?.(d) : false; });

  const reqs: { label: string; met: boolean }[] = [];
  for (const pre of cert.requiresCerts ?? []) {
    const t = CERTIFICATIONS.find((c) => c.slug === pre)?.title ?? pre;
    reqs.push({ label: `Obtén primero: ${t}`, met: earnedCerts.has(pre) });
  }
  reqs.push({ label: routes.length > 1 ? "Lee las guías de las 4 rutas" : "Lee las guías de la ruta", met: allRead });
  if (scen.length > 0) reqs.push({ label: `Aprueba ≥ ${cert.minScorePct}% de los desafíos (vas ${scorePct}%)`, met: scorePct >= cert.minScorePct });
  if (cert.requiredActionIds.length > 0) reqs.push({ label: "Completa las acciones clave en tu negocio", met: actsOk });

  return { reqs, eligible: reqs.every((r) => r.met), scorePct };
}
