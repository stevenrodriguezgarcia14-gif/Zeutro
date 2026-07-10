import type { ChecklistDef, GlossaryEntry, ManualSection, ResourceItem } from "./types";

// Plan operativo del Marketing OS.
// Fuente: Estrategia-Contenido-Organico-Zentro.md + PARTE C de los guiones (2026-07-07).

/** Meta de la campaña de validación. */
export const FOUNDERS_TARGET = 15;

export const REF_LINK = "zentro-ten-phi.vercel.app/register?ref=fundadores";

/** Ritmo semanal recurrente (la regla que sigue el planificador dinámico). */
export const WEEKLY_RHYTHM: { day: string; tasks: string[] }[] = [
  { day: "Domingo", tasks: ["🎬 Batch de grabación: 4-5 videos (90-120 min)", "Revisar métricas y decidir el mix de la semana"] },
  { day: "Lunes", tasks: ["✂️ Batch de edición en CapCut (2 h)", "Pieza de campaña FB+IG 11 am (si toca)"] },
  { day: "Martes", tasks: ["📤 Video → TikTok 7-9 pm"] },
  { day: "Miércoles", tasks: ["📤 Mismo video → Reels + FB 11 am-1 pm", "Grabar 1 video reactivo si hubo comentario jugoso"] },
  { day: "Jueves", tasks: ["📤 Video → TikTok 7-9 pm", "Post de texto en tu perfil FB + 3 grupos"] },
  { day: "Viernes", tasks: ["📤 Mismo video → Reels + FB"] },
  { day: "Sábado", tasks: ["📤 Video → TikTok 12-3 pm y Reels 7-9 pm"] },
];

export const DAILY_HABITS = [
  "Responder TODO comentario en <1 h tras publicar",
  "Estado de WhatsApp + story de IG (repost del mejor contenido del día)",
];

// El plan fechado fijo se eliminó: el calendario lo genera schedule.ts
// dinámicamente desde la fecha actual + el estado real de cada video.

export const CHECKLISTS: ChecklistDef[] = [
  {
    id: "antes-grabar",
    title: "Antes de grabar",
    moment: "Al empezar cada sesión de grabación",
    items: [
      "Lente limpiado con la camiseta",
      "Celular en modo No molestar",
      "Audífonos-micrófono puestos y prueba de audio de 5 s ESCUCHADA",
      "Ventana DELANTE de ti (nunca detrás), celular a la altura de los ojos",
      "Celular vertical y fijo en el soporte",
      "Guion leído 2 veces (memoriza la IDEA, no las palabras)",
      "Recursos del video listos (capturas, pantallas, utilería)",
      "2 camisetas a mano para cambiar a mitad de sesión",
    ],
  },
  {
    id: "antes-editar",
    title: "Antes de editar",
    moment: "Al abrir CapCut",
    items: [
      "Clips importados en el orden del guion",
      "Silencios y errores eliminados (receta “Cortar silencios” del Manual) — SIN tocar los silencios dramáticos del guion",
      "Subtítulos automáticos generados Y corregidos (dice “Zentro”, no “centro”)",
      "Palabras clave en verde #00C781 (máx 1-3 por pantalla)",
      "Textos grandes con animación de entrada, en el tercio superior",
      "Música al volumen 15-20 · SFX en textos y momento dinero",
      "Cortinilla pegada al final",
      "Clip “CapCut” del final eliminado (marca de agua fuera)",
    ],
  },
  {
    id: "antes-publicar",
    title: "Antes de publicar",
    moment: "Con el video exportado, antes de subirlo",
    items: [
      "Visto completo en SILENCIO: ¿se entiende todo sin sonido?",
      "La duración cuadra con la calculada del guion (los tiempos reales ya incluyen tus pausas; no recortes silencios marcados)",
      "UNA sola instrucción final (no tres CTAs)",
      "Caption distinto por plataforma (TikTok corto · IG con CTA de comentario · FB narrativo)",
      "Hashtags del pilar correcto (nunca #fyp / #parati)",
      "Portada elegida: fotograma expresivo + 3-5 palabras",
      "Hora correcta (TikTok 7-9 pm · Reels 11 am-1 pm o 7-9 pm · FB 11 am)",
    ],
  },
  {
    id: "despues-publicar",
    title: "Después de publicar",
    moment: "La primera hora y las 48 h siguientes",
    items: [
      "Responder CADA comentario en <1 h (la primera hora decide el alcance)",
      "Repost a story de IG y estado de WhatsApp",
      "A las 24-48 h: anotar métricas en la Analítica del OS (views, retención 3 s, saves)",
      "¿Alguien comentó la palabra clave? → responder público (“te escribí 📩”) + DM con pregunta sobre SU negocio",
      "Decidir: ¿este formato se duplica la próxima semana o se elimina?",
    ],
  },
];

// Las grabaciones de pantalla y recursos visuales viven ahora en el catálogo
// de la Biblioteca Multimedia (media.ts) con metadatos completos y usos por
// guion. Aquí queda solo lo físico y las referencias de audio.
export const RESOURCES: ResourceItem[] = [
  // Equipo físico
  { id: "eq1", group: "Equipo", label: "Soporte casero: pila de libros + apoyo firme, altura de ojos" },
  { id: "eq2", group: "Equipo", label: "Audífonos de cable con micrófono (mic a 10-15 cm de la boca)" },
  { id: "eq3", group: "Equipo", label: "2 camisetas lisas por sesión (colores sólidos, sin estampados)" },
  { id: "eq4", group: "Equipo", label: "Cuaderno arrugado (utilería de #2 y #16)" },
  // Audio de referencia (biblioteca CapCut gratis)
  { id: "au1", group: "Música y SFX", label: "Música: “lofi tension” (#1) · “upbeat lofi” (#2) · “inspiring minimal / piano” (#4) · “lo-fi calmado” (#5)", detail: "Volumen 15-20 bajo tu voz; 12-15 en el #4." },
  { id: "au2", group: "Música y SFX", label: "SFX: pop (textos) · whoosh (cara→pantalla) · cash/cha-ching (momento dinero) · teclas (#1) · notificación", detail: "Audio → Efectos en CapCut. Máx 4-5 por video." },
];

export const GLOSSARY: GlossaryEntry[] = [
  { term: "Gancho (hook)", meaning: "Los primeros 3 segundos del video. Deciden si la persona sigue viendo o pasa al siguiente.", how: "Tres cosas a la vez en el segundo 0: la frase más llamativa (sin saludar), un texto grande y tu cara ya expresiva." },
  { term: "CTA", meaning: "“Llamada a la acción”: la instrucción que das al final (comenta COBRA, sígueme).", how: "La dices hablando Y la pones como texto. Siempre UNA sola por video." },
  { term: "Primer plano", meaning: "Se ve tu cara y hombros. Íntimo, para confesiones.", how: "Celular a ~60 cm (un brazo estirado)." },
  { term: "Plano medio", meaning: "De la cintura para arriba. El estándar, para explicar.", how: "Celular a ~1-1.2 m." },
  { term: "Plano abierto", meaning: "Cuerpo casi entero y el lugar. Para mostrar tu espacio.", how: "Celular a ~2 m. Casi no lo usarás." },
  { term: "A-roll", meaning: "El video principal: tú hablando a cámara.", how: "Lo que grabas con el celular apuntándote." },
  { term: "B-roll", meaning: "Imágenes de apoyo que se VEN mientras se te OYE (pantalla de Zentro, cuaderno).", how: "Se añaden en CapCut encima de tu voz (receta, paso 7)." },
  { term: "Corte / jump cut", meaning: "El video “salta” de una frase a la siguiente sin pausas. Da ritmo.", how: "Grabas frases sueltas y en CapCut borras los silencios (receta, paso 2)." },
  { term: "Zoom punch", meaning: "La imagen se acerca de golpe (~10% más grande) para enfatizar una palabra.", how: "Con keyframes (receta, paso 6). Si te abruma al inicio, sáltalo: un buen corte vale más." },
  { term: "Keyframe", meaning: "Marca que le dice a CapCut “aquí empieza un cambio y aquí termina” (anima el zoom).", how: "Tocando el rombo ◇ que aparece al seleccionar un clip." },
  { term: "Inserto / superposición", meaning: "Imagen o clip que aparece ENCIMA de tu video 1-2 s.", how: "Botón “Superposición” en CapCut (receta, paso 7)." },
  { term: "Voz en off", meaning: "Se oye tu voz pero no se te ve (se ve otra cosa).", how: "Grabas el audio aparte y en CapCut lo pones debajo del video de pantalla." },
  { term: "Transición", meaning: "Cómo pasa de una escena a otra. Corte seco = sin adorno (casi siempre). Whoosh = con sonido de barrido (solo cara→pantalla).", how: "El corte seco no requiere nada; el whoosh es solo un SONIDO en ese punto." },
  { term: "SFX", meaning: "Efecto de sonido corto: pop al aparecer texto, cha-ching al hablar de dinero.", how: "Audio → Efectos → buscar “pop”, “whoosh”, “cash”." },
  { term: "Subtítulos", meaning: "Transcripción palabra por palabra de lo que dices, abajo-centro. CapCut los genera solo.", how: "Texto → Subtítulos automáticos (receta, paso 3)." },
  { term: "Texto grande (titular)", meaning: "Texto de pocas palabras que TÚ añades aparte, arriba, para resumir la idea. NO es lo mismo que los subtítulos: conviven.", how: "Texto → Añadir texto (receta, paso 5)." },
  { term: "Cortinilla", meaning: "Cierre de 1.5 s con el logo, al final de TODOS los videos.", how: "Se crea UNA vez (fondo negro + Z + claim + @zentronegocios), se exporta y se pega al final de cada proyecto." },
  { term: "POV", meaning: "“Punto de vista”: video visto desde tus ojos.", how: "Grabas la pantalla o lo que ves, sin salir tú (o casi)." },
  { term: "Retención", meaning: "Cuánta gente sigue viendo segundo a segundo. LA métrica que el algoritmo premia.", how: "Se mejora con gancho fuerte, cortes frecuentes y videos cortos. Se ve en las estadísticas de cada red." },
  { term: "Interrupción de patrón", meaning: "Cualquier cambio (corte, zoom, texto nuevo) que “despierta” al cerebro. Algo debe pasar cada ≤5 s.", how: "La suma de cortes + zooms + textos + insertos." },
  { term: "Portada (cover)", meaning: "La imagen fija que representa el video en tu perfil.", how: "Al publicar, TikTok/IG dejan elegir el fotograma y añadirle texto: tú expresivo + 3-5 palabras." },
];

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "estudio",
    title: "Tu “estudio” casero (30 min, una sola vez)",
    intro: "El montaje que se prepara una vez y sirve para todos los videos.",
    steps: [
      "Lugar: mesa frente a una ventana, en un cuarto con cama/cortinas (absorben eco). Nunca cocina ni baño.",
      "Tú sentado MIRANDO hacia la ventana; el celular ENTRE tú y la ventana. La ventana jamás detrás (cara negra).",
      "Soporte casero: pila de libros con el celular VERTICAL apoyado en algo firme. Centro de la cámara a la altura de TUS OJOS sentado.",
      "Empieza con la cámara frontal (te ves mientras grabas). Con práctica, pasa a la trasera (mejor calidad). Ajustes: 1080p, 30 o 60 fps.",
      "Limpia el lente con la camiseta antes de CADA sesión (el 50% de los videos borrosos es un lente engrasado).",
      "Audio: audífonos de cable con micrófono a 10-15 cm de la boca. Prueba de 5 s ESCUCHADA antes de grabar la sesión.",
      "Celular en modo No molestar.",
      "Ropa: un color sólido (azul, gris, verde oscuro, negro). Evita estampados, blanco puro y rayas finas. 2 camisetas por sesión = parecen 2 días.",
      "Grabar sin ayudante: no cortes entre frases. Di una frase → pausa 2 s mirando a cámara → si salió mal repítela → sigue. Los errores se borran en edición. Este truco elimina el 90% del miedo.",
    ],
  },
  {
    id: "capcut",
    title: "Receta de CapCut (la misma para todos los videos)",
    intro: "CapCut GRATIS alcanza para todo. No toques la pestaña “Plantillas” (ahí viven las funciones de pago). Botón con corona 👑 = de pago: siempre hay alternativa gratis aquí.",
    steps: [
      "Nuevo proyecto → selecciona tus clips en el orden del guion → Añadir.",
      "Limpieza (jump cuts): reproduce; en cada silencio/error, cabezal al inicio → “Dividir” → cabezal al final → “Dividir” → toca el pedazo → “Eliminar”. 10-15 min/video, el paso que más calidad aporta.",
      "Subtítulos: Texto → Subtítulos automáticos → Español → Generar. LÉELOS y corrige (escribirá “centro” en vez de “Zentro”). Estilo: negrita, blanco, borde negro, máx 2 líneas. Posición: centro-bajo (nunca pegados al borde: los tapan los botones de TikTok).",
      "Palabras en verde: toca el subtítulo → selecciona SOLO esa palabra → color #00C781. Máx 1-3 verdes por pantalla.",
      "Texto grande: Texto → Añadir texto → negrita, blanco, borde negro → tercio SUPERIOR → Animación de entrada “Emerger” (0.3 s). Duración: arrastra los bordes de su barrita.",
      "Zoom de énfasis: selecciona el clip → cabezal ANTES de la palabra → rombo ◇ → avanza 0.2 s → agranda a ~110% con dos dedos (CapCut crea el 2º keyframe solo). Para volver: lo mismo al revés.",
      "Insertos: cabezal donde va la imagen → Superposición → Añadir → agrándala a pantalla completa → 1-2 s.",
      "Música: Audio → Sonidos → busca el estilo del guion → Volumen 15-20. SFX: Audio → Efectos → “pop”, “whoosh”, “cash register”.",
      "Cortinilla al final.",
      "Marca de agua: si al final aparece un clip “CapCut”, tócalo y elimínalo (es un clip normal).",
      "Exportar: 1080p, 30 o 60 fps.",
      "Prueba final: mira el video exportado SIN sonido. ¿Se entiende completo? Si no, faltan textos (el 85% lo verá en silencio).",
    ],
  },
  {
    id: "errores",
    title: "Los 10 errores de principiante",
    intro: "Aplican a TODOS los videos. Revisa esta lista cuando algo “no funcione”.",
    steps: [
      "Saludar al inicio (“hola, ¿qué tal?”): la gente decide en 1 s. La primera frase del guion ES la primera palabra que dices.",
      "Leer el guion: se nota en los ojos. Memoriza la IDEA de cada frase, no las palabras.",
      "Hablar con tu energía normal: la cámara “apaga” un 20%. Habla más fuerte y expresivo de lo que se siente natural.",
      "Ventana detrás de ti: cara negra. Ventana SIEMPRE delante.",
      "Grabar horizontal: todo va vertical. Sin excepciones.",
      "Mirar tu imagen en pantalla en vez del lente: pega un sticker junto a la cámara y háblale al sticker.",
      "Cortar la grabación en cada error: repite la frase y sigue. Decide en edición.",
      "Subtítulos pegados al borde inferior: los tapan los botones. Centro-bajo.",
      "Meter la app antes que el problema: primero el dolor (ellos), luego la solución (tú).",
      "Esperar el video perfecto: tu video 10 será el doble de bueno que el 1. Publica el 1.",
    ],
  },
];

/** Sets de hashtags por tipo de contenido (mezclar, nunca el mismo set siempre). */
export const HASHTAG_SETS: { pillar: string; tags: string; why: string }[] = [
  { pillar: "Dolor / cobranza", tags: "#emprendedores #negociopropio #cobranza #clientesmorosos #flujodecaja #zentro", why: "“clientesmorosos” y “cobranza” = nicho con dolor exacto y audiencia calificada." },
  { pillar: "WhatsApp / ventas", tags: "#venderporwhatsapp #whatsappbusiness #ventasonline #revendedoras #emprendedoras #zentro", why: "“venderporwhatsapp” está en máximo histórico (jun-2026); “revendedoras” = segmento núcleo." },
  { pillar: "Build in public", tags: "#construyendoenpublico #startup #emprendimiento #saas #hechoenlatam #zentro", why: "Chico pero exacto: atrae early adopters y otros makers que comparten." },
  { pillar: "Demo / tutorial", tags: "#appparanegocios #herramientasdigitales #pymes #negociosonline #productividad #zentro", why: "Replica la búsqueda real “app para mi negocio” (demanda naciente 2026)." },
  { pillar: "Historia personal", tags: "#emprendedor #historiareal #motivacion #negocios #emprendedoreslatinos #zentro", why: "Los hashtags grandes solo aquí, donde lo emocional puede competir en volumen." },
  { pillar: "Fundadores / oferta", tags: "#usuariosfundadores #oportunidad #emprendedores #pymes #negociopropio #zentro", why: "#usuariosfundadores casi no existe → se convierte en TU etiqueta rastreable." },
];
