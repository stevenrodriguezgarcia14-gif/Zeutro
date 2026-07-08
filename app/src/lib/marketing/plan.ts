import type { CalendarTask, ChecklistDef, GlossaryEntry, ManualSection, ResourceItem } from "./types";

// Plan operativo del Marketing OS.
// Fuente: Estrategia-Contenido-Organico-Zentro.md + PARTE C de los guiones (2026-07-07).

/** Meta de la campaña de validación. */
export const FOUNDERS_TARGET = 15;

export const REF_LINK = "zentro-ten-phi.vercel.app/register?ref=fundadores";

/** Ritmo semanal recurrente (se repite después del plan fechado). */
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

/** Plan fechado (julio 2026). El check de cada tarea se guarda como cal:<date>:<id>. */
export const CALENDAR: CalendarTask[] = [
  // Semana 1-2: campaña F1-F5 (ya programada en Meta Business Suite)
  { id: "f1", date: "2026-07-06", kind: "campaña", label: "F1 “Te deben dinero” (FB+IG 11 am)", detail: "Ya programada. Tu trabajo: responder comentarios <1 h." },
  { id: "f2", date: "2026-07-08", kind: "campaña", label: "F2 “Tu negocio vive en 6 lugares” (FB+IG 11 am)", detail: "Responder comentarios; repost a stories con sticker de pregunta." },
  { id: "ses1", date: "2026-07-08", kind: "grabar", label: "SESIÓN 1: grabar #5 → #2 → #1 → #4 (90-120 min)", detail: "Orden de más fácil a más importante. Checklist “Antes de grabar” primero." },
  { id: "edit1", date: "2026-07-09", kind: "editar", label: "Editar los 4 videos de la sesión 1 (2 h, receta 0.3)" },
  { id: "pub1", date: "2026-07-09", kind: "publicar", label: "Publicar #1 en TikTok (7-9 pm)", videoId: 1, platform: "tiktok", time: "19:00-21:00", detail: "El mejor gancho frío del lote abre la cuenta." },
  { id: "f3", date: "2026-07-10", kind: "campaña", label: "F3 “Zentro cobra por ti” (FB+IG 11 am)" },
  { id: "pub2", date: "2026-07-10", kind: "publicar", label: "Publicar #1 en Reels + FB (7 pm)", videoId: 1, platform: "reels", time: "19:00", detail: "Misma promesa que F3: imagen de día + video de noche se refuerzan." },
  { id: "pub3", date: "2026-07-11", kind: "publicar", label: "Publicar #4 en TikTok (mediodía) + Reels/FB (7 pm) y FIJARLO en los 3 perfiles", videoId: 4, platform: "tiktok", detail: "La campaña ya manda visitas a tu perfil: el pitch fijado las convierte." },
  { id: "rev1", date: "2026-07-12", kind: "revisar", label: "Revisar métricas de la semana (retención 3 s, registros ?ref=fundadores)" },
  { id: "f4", date: "2026-07-13", kind: "campaña", label: "F4 “15 Usuarios Fundadores” (FB+IG 11 am) — FIJAR el post" },
  { id: "pub4", date: "2026-07-14", kind: "publicar", label: "Publicar #2 en TikTok (7-9 pm)", videoId: 2, platform: "tiktok", time: "19:00-21:00" },
  { id: "pub5", date: "2026-07-15", kind: "publicar", label: "Publicar #2 en Reels + FB (11 am-1 pm)", videoId: 2, platform: "reels" },
  { id: "f5", date: "2026-07-16", kind: "campaña", label: "F5 “Primero 15” (FB+IG 11 am)", detail: "Si ya hay inscritos: rellenar casillas del SVG y re-renderizar." },
  { id: "pub6", date: "2026-07-16", kind: "publicar", label: "Publicar #5 en TikTok (7-9 pm)", videoId: 5, platform: "tiktok", detail: "Urgencia por la mañana (F5), deseo de calma por la noche (#5)." },
  { id: "pub7", date: "2026-07-17", kind: "publicar", label: "Publicar #5 en Reels + FB", videoId: 5, platform: "reels" },
  { id: "com1", date: "2026-07-16", kind: "comunidad", label: "Post de texto personal en FB + compartir en 3 grupos de emprendedores", detail: "En grupos: texto sin QR y link en comentario si lo prohíben." },

  // Semana 3
  { id: "ses2", date: "2026-07-19", kind: "grabar", label: "SESIÓN 2: grabar #3 → #7 → #6 → #13", detail: "#3 y #7 inauguran las series; #13 es el comodín de humor." },
  { id: "rev2", date: "2026-07-19", kind: "revisar", label: "Métricas: ¿qué gancho tuvo mejor retención a 3 s? Duplicarlo esta semana" },
  { id: "edit2", date: "2026-07-20", kind: "editar", label: "Editar los 4 videos de la sesión 2" },
  { id: "pub8", date: "2026-07-21", kind: "publicar", label: "Publicar #7 “Semana 1 construyendo Zentro” en TikTok", videoId: 7, platform: "tiktok" },
  { id: "pub9", date: "2026-07-22", kind: "publicar", label: "Publicar #7 en Reels + FB", videoId: 7, platform: "reels" },
  { id: "pub10", date: "2026-07-23", kind: "publicar", label: "Publicar #6 en TikTok", videoId: 6, platform: "tiktok" },
  { id: "pub11", date: "2026-07-24", kind: "publicar", label: "Publicar #6 en Reels + FB", videoId: 6, platform: "reels" },
  { id: "pub12", date: "2026-07-25", kind: "publicar", label: "Publicar #3 “Cómo nació Zentro” en TikTok + Reels (sábado)", videoId: 3, platform: "tiktok", detail: "Fijarlo en IG junto al #4 si el perfil lo permite." },

  // Semana 4
  { id: "ses3", date: "2026-07-26", kind: "grabar", label: "SESIÓN 3: grabar #10 → #12 → #14 → #24 → #34", detail: "#24 se graba aquí por su timing de fin de mes. + regrabar el formato ganador." },
  { id: "rev3", date: "2026-07-26", kind: "revisar", label: "Métricas semana 3: el mejor formato se graba 2 veces; el peor se elimina" },
  { id: "edit3", date: "2026-07-27", kind: "editar", label: "Editar los videos de la sesión 3" },
  { id: "pub13", date: "2026-07-28", kind: "publicar", label: "Publicar #14 en TikTok", videoId: 14, platform: "tiktok" },
  { id: "pub14", date: "2026-07-29", kind: "publicar", label: "Publicar #14 en Reels + FB", videoId: 14, platform: "reels" },
  { id: "pub15", date: "2026-07-30", kind: "publicar", label: "Publicar #24 “Cerraste el mes” (timing: 30-31 jul)", videoId: 24, platform: "tiktok" },
  { id: "pub16", date: "2026-07-31", kind: "publicar", label: "Publicar #13 en TikTok + #24 en Reels/FB", videoId: 13, platform: "tiktok" },
  { id: "rev4", date: "2026-08-02", kind: "revisar", label: "Cierre de fase 2: ¿1 video >10k views? ¿30 seguidores/sem? ¿cupos llenos?" },
];

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
      "Silencios y errores eliminados (jump cuts, receta 0.3 paso 2)",
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
      "Dura menos de 40 s (60 si es historia)",
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

export const RESOURCES: ResourceItem[] = [
  // Grabaciones de pantalla (sprint único, se recortan mil veces)
  { id: "sc1", group: "Grabaciones de pantalla", label: "#1 Abrir app → dashboard + Centro de Prioridades del día", detail: "La base de #5 y #2. Lenta y con dedo firme." },
  { id: "sc2", group: "Grabaciones de pantalla", label: "#2 Venta rápida desde el botón “+” móvil (3 taps)", detail: "Para #34 y #10." },
  { id: "sc3", group: "Grabaciones de pantalla", label: "#3 Factura vencida → recordatorio automático enviado", detail: "La joya: correo real con nombre del negocio. Para #1 y #36." },
  { id: "sc4", group: "Grabaciones de pantalla", label: "#4 “Cobraste $X de <cliente>” + ¡Factura saldada!", detail: "El momento dinero. Para #9." },
  { id: "sc5", group: "Grabaciones de pantalla", label: "#5 Ganancia real del mes (número verde)", detail: "Para #6, #14, #38." },
  { id: "sc6", group: "Grabaciones de pantalla", label: "#6 “Quién te debe” — cuentas por cobrar con montos", detail: "Para #5 y #35." },
  { id: "sc7", group: "Grabaciones de pantalla", label: "#7 Instalar la PWA (pantalla /guide → ícono en el home)", detail: "Para #33." },
  { id: "sc8", group: "Grabaciones de pantalla", label: "#8 Centro de Orientación / Academia", detail: "Para videos de “no sabes por dónde empezar”." },
  { id: "sc9", group: "Grabaciones de pantalla", label: "#9 Scroll rápido de TODO (30 s, b-roll genérico)", detail: "Para #4 (flash “ya funciona”)." },
  { id: "sc10", group: "Grabaciones de pantalla", label: "#10 Editor de código con el proyecto abierto (20-30 s)", detail: "Para build in public (#7, #26)." },
  // Recursos visuales (una sola vez)
  { id: "rv1", group: "Recursos visuales", label: "Cortinilla de cierre 1.5 s", detail: "Negro + Z + “El centro de control de tu negocio” + @zentronegocios. Se crea una vez en CapCut y se reutiliza siempre." },
  { id: "rv2", group: "Recursos visuales", label: "Logo Z en PNG transparente", path: "Marketing-Assets-Zentro/png/" },
  { id: "rv3", group: "Recursos visuales", label: "Captura de chat “Holaa, disculpa que te moleste 🙈”", detail: "Créala en un chat contigo mismo. Para #1." },
  { id: "rv4", group: "Recursos visuales", label: "Capturas del caos: cuaderno, Excel, chats de WhatsApp", detail: "El “antes”. Para #2, #3, #10." },
  { id: "rv5", group: "Recursos visuales", label: "3-4 fotos tuyas trabajando (laptop, café, teléfono)", detail: "B-roll de historias (#3, #43)." },
  { id: "rv6", group: "Recursos visuales", label: "PNGs de campaña F1-F5 como insertos", path: "Marketing-Assets-Zentro/png/campana-fundadores/" },
  { id: "rv7", group: "Recursos visuales", label: "Screenshot del primer feedback real (nombre censurado)", detail: "Para #11 y #55 — solo cuando exista." },
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
