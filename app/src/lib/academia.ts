// =====================================================================
// Academia Zentro — lecciones cortas y prácticas para el emprendedor.
// Contenido educativo conectado a los módulos del producto.
// body: cada string es un párrafo; si empieza con "- " es viñeta,
// si empieza con "## " es subtítulo.
// =====================================================================

import type { ModuleSlug } from "@/lib/guide";

export type Category = { slug: string; title: string; emoji: string; desc: string };

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
