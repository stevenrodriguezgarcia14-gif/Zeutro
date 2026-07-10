import type { MediaAsset, MediaUse } from "./types";

// ============================================================================
// BIBLIOTECA MULTIMEDIA — catálogo único de todos los recursos de marketing.
//
// Arquitectura elegida: los ARCHIVOS viven en OneDrive (llegan a tu teléfono
// con la app de OneDrive para insertarlos en CapCut, y la web no carga MBs);
// este catálogo es el índice profesional: qué existe, dónde está, cuánto
// dura, en qué guion se usa y en qué frase exacta entra.
//
// Los clips de app se PRODUCEN automáticamente (no se graban a mano):
//   video-build/capture-library.mjs  → graba la app real en 9:16 (720×1280)
//   video-build/prepare-library.mjs  → MP4 H.264 1080×1920 30fps + miniatura
// Re-generarlos: npm run dev en zentro/app → node capture-library.mjs →
// node prepare-library.mjs. Salen listos para CapCut: sin recortar nada.
// ============================================================================

/** Raíz del repositorio de archivos (OneDrive). */
export const MEDIA_ROOT = "Marketing-Assets-Zentro";

export const MEDIA: MediaAsset[] = [
  // ————————————————————— Clips de app (9:16, listos para CapCut) —————————————————————
  {
    id: "dashboard-principal",
    name: "Dashboard principal",
    file: "dashboard-principal_9x16.mp4",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Grabaciones de pantalla",
    tags: ["dashboard", "panel", "resumen", "métricas"],
    durationSec: 7.7,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    notes: "Scroll suave por el panel con datos reales (ingresos, por cobrar, clientes). Generado automáticamente.",
    usedIn: [
      { videoId: 2, cue: "“Yo estoy construyendo esto: todo tu negocio en una pantalla...”", purpose: "La solución tras el frenazo: el negocio junto en un lugar", holdSec: 4 },
      { videoId: 5, cue: "“Son las 7 de la mañana. Abro la app de mi negocio...”", purpose: "Apertura del POV: lo primero que ves al abrir Zentro", holdSec: 4 },
    ],
    campaigns: ["Usuarios Fundadores"],
  },
  {
    id: "centro-prioridades",
    name: "Centro de Prioridades (qué hacer hoy)",
    file: "centro-prioridades_9x16.mp4",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Grabaciones de pantalla",
    tags: ["prioridades", "hoy", "diferenciador", "cobrar"],
    durationSec: 10.3,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    notes: "EL diferenciador de Zentro en pantalla: la lista de qué cobrar y hacer hoy.",
    usedIn: [
      { videoId: 2, cue: "“...que cada mañana te dice qué cobrar y qué hacer primero.”", purpose: "Segunda mitad del cierre del #2", holdSec: 4 },
      { videoId: 3, cue: "justo al TERMINAR la pregunta “¿y si tu negocio te dijera...?”", purpose: "La app ES la respuesta a la pregunta central", holdSec: 2 },
      { videoId: 5, cue: "“...y ya sé exactamente qué hacer hoy: cobrarle a Marta...”", purpose: "El corazón del POV (los 3 zooms van sobre este clip)", holdSec: 7 },
    ],
    campaigns: ["Usuarios Fundadores"],
  },
  {
    id: "quien-te-debe",
    name: "Quién te debe (cartera por cobrar)",
    file: "quien-te-debe_9x16.mp4",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Grabaciones de pantalla",
    tags: ["cobranza", "deudas", "cartera", "morosos"],
    durationSec: 9.6,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    notes: "Lista de cuentas por cobrar con montos reales de demo.",
    usedIn: [
      { videoId: 5, cue: "“No lo pensé yo. No revisé seis aplicaciones...”", purpose: "Respiro visual: pasa 2 s por aquí y vuelve", holdSec: 2 },
      { videoId: 8, cue: "“...construí una app que te lo dice al abrirla.”", purpose: "Flash de 2 s como prueba tras la conclusión", holdSec: 2 },
      { videoId: 35, cue: "gancho del video (es su protagonista)", purpose: "Tutorial completo de cobranza", holdSec: 8 },
    ],
    campaigns: ["Usuarios Fundadores"],
  },
  {
    id: "venta-rapida-3-taps",
    name: "Venta rápida en 3 taps",
    file: "venta-rapida-3-taps_9x16.mp4",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Grabaciones de pantalla",
    tags: ["venta", "rapidez", "3 taps", "registrar"],
    durationSec: 11.4,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    notes: "Monto 80 → Registrar → hecho. Se escribe lento a propósito (el espectador sigue el dedo).",
    usedIn: [
      { videoId: 10, cue: "lado B: “Mi yo de hoy: botón más... ochenta... listo.”", purpose: "El contraste veloz contra el Excel", holdSec: 6 },
      { videoId: 34, cue: "todo el video (protagonista)", purpose: "Micro-tutorial cronometrado", holdSec: 10 },
    ],
    campaigns: ["Usuarios Fundadores"],
  },
  {
    id: "cobro-celebrado",
    name: "Cobro celebrado (¡Factura saldada!)",
    file: "cobro-celebrado_9x16.mp4",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Grabaciones de pantalla",
    tags: ["momento dinero", "cobro", "celebración", "factura"],
    durationSec: 14.4,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    notes: "Registrar pago → “Cobraste COP 89,000 de Boutique Sofía 💰 ¡Factura saldada!”. El cha-ching va AL FRAME en que aparece el banner verde (~seg 12).",
    usedIn: [
      { videoId: 9, cue: "“...cuando cobras, la app te lo dice con todas las letras”", purpose: "EL momento del video: la celebración en pantalla", holdSec: 5 },
    ],
    campaigns: ["Usuarios Fundadores"],
  },
  {
    id: "ganancia-real",
    name: "Ganancia real del mes (número verde)",
    file: "ganancia-real_9x16.mp4",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Grabaciones de pantalla",
    tags: ["finanzas", "utilidad", "ganancia", "rentabilidad"],
    durationSec: 9.3,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    notes: "Rentabilidad: ingresos − gastos, el número que importa.",
    usedIn: [
      { videoId: 6, cue: "“Hoy lo veo así: ingresos, menos gastos, menos compras.”", purpose: "La solución tras el frenazo de “la MITAD”", holdSec: 5 },
      { videoId: 14, cue: "“si dudaste, tu negocio vive en tu cabeza” (cierre)", purpose: "La respuesta que el reto promete", holdSec: 4 },
      { videoId: 38, cue: "todo el video (protagonista)", purpose: "Demo del número verde", holdSec: 8 },
    ],
    campaigns: ["Usuarios Fundadores"],
  },
  {
    id: "registrar-cliente",
    name: "Registrar cliente (desde WhatsApp)",
    file: "registrar-cliente_9x16.mp4",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Grabaciones de pantalla",
    tags: ["crm", "clientes", "whatsapp"],
    durationSec: 12.9,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    notes: "Formulario simple: nombre + WhatsApp → guardar. Útil para demos de CRM y del eje WhatsApp.",
    usedIn: [],
    campaigns: ["Usuarios Fundadores"],
  },
  {
    id: "instalar-pwa",
    name: "Instalar Zentro en el teléfono (PWA)",
    file: "instalar-pwa_9x16.mp4",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Grabaciones de pantalla",
    tags: ["pwa", "instalar", "bolsillo"],
    durationSec: 10.4,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    notes: "La tarjeta “Lleva Zentro en tu bolsillo” del Centro de Orientación.",
    usedIn: [
      { videoId: 33, cue: "todo el video (protagonista)", purpose: "“Sin App Store, sin 200 MB”", holdSec: 8 },
    ],
  },
  {
    id: "scroll-general-broll",
    name: "Recorrido general (b-roll de fondo)",
    file: "scroll-general-broll_9x16.mp4",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Grabaciones de pantalla",
    tags: ["b-roll", "recorrido", "todo"],
    durationSec: 41.2,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    notes: "Dashboard → prioridades → clientes → facturas → cobranzas → flujo de caja. CORTA el pedazo que necesites: cualquier tramo de 2-3 s sirve de fondo.",
    usedIn: [
      { videoId: 4, cue: "“Ya funciona.”", purpose: "Flash de 2 s como prueba (usa el tramo del dashboard)", holdSec: 2 },
      { videoId: 42, cue: "de fondo durante el vlog", purpose: "B-roll genérico", holdSec: 10 },
    ],
    campaigns: ["Usuarios Fundadores"],
  },

  // ————————————————————— Videos finales (reels ya montados) —————————————————————
  {
    id: "reel-whatsapp-v2",
    name: "Reel: eje WhatsApp (v2, final)",
    file: "zentro_reel_whatsapp_v2_1080x1920.mp4",
    path: ".",
    kind: "video",
    category: "Videos finales",
    tags: ["reel", "whatsapp", "publicable"],
    durationSec: 28,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    notes: "Ya publicable tal cual (lo referencia el Kit de Publicación para TikTok).",
    usedIn: [],
    campaigns: ["Usuarios Fundadores", "Tendencias jun-2026"],
  },
  {
    id: "reel-appnegocio-v2",
    name: "Reel: eje “app para mi negocio” (v2, final)",
    file: "zentro_reel_appnegocio_v2_1080x1920.mp4",
    path: ".",
    kind: "video",
    category: "Videos finales",
    tags: ["reel", "app negocio", "publicable"],
    durationSec: 28,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    usedIn: [],
    campaigns: ["Usuarios Fundadores", "Tendencias jun-2026"],
  },
  {
    id: "reel-marca",
    name: "Reel de marca (claim + isotipo)",
    file: "zentro_reel_marca_1080x1920.mp4",
    path: ".",
    kind: "video",
    category: "Videos finales",
    tags: ["marca", "reel"],
    durationSec: 32,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    usedIn: [],
  },
  {
    id: "demo-landscape",
    name: "Demo completo (horizontal, v3)",
    file: "zentro_demo_landscape_v3.mp4",
    path: ".",
    kind: "video",
    category: "Videos finales",
    tags: ["demo", "horizontal", "landing"],
    durationSec: 69,
    resolution: "1920×1080",
    orientation: "horizontal",
    status: "listo",
    notes: "Para landing/FB horizontal; NO para TikTok/Reels (es 16:9).",
    usedIn: [],
  },
  {
    id: "reels-v1-archivo",
    name: "Reels v1 (reemplazados por v2)",
    path: "Biblioteca/archivo",
    kind: "video",
    category: "Videos finales",
    tags: ["archivo", "obsoleto"],
    status: "archivado",
    notes: "Superados por las versiones v2. Archivados el 2026-07-10; no publicar.",
    usedIn: [],
  },

  // ————————————————————— Gráficos de campaña —————————————————————
  {
    id: "campana-f1-f5",
    name: "Campaña F1-F5 (15 Usuarios Fundadores)",
    path: "png/campana-fundadores",
    kind: "grafico",
    category: "Gráficos de campaña",
    tags: ["campaña", "fundadores", "feed"],
    resolution: "1080×1350",
    orientation: "vertical",
    status: "listo",
    notes: "5 piezas ya programadas en Meta (6-16 jul). F1 te-deben-dinero · F2 seis-lugares · F3 cobra-por-ti · F4 oferta · F5 urgencia. Insertables 1-2 s en videos como refuerzo.",
    usedIn: [],
    campaigns: ["Usuarios Fundadores"],
  },
  {
    id: "tendencias-wa-app",
    name: "Piezas de tendencias (WA1-2, APP1-2)",
    path: "png/tendencias",
    kind: "grafico",
    category: "Gráficos de campaña",
    tags: ["tendencias", "whatsapp", "app negocio"],
    status: "listo",
    usedIn: [],
    campaigns: ["Tendencias jun-2026"],
  },
  {
    id: "piezas-base",
    name: "Piezas base de marca (9) + carrusel ganancia real (6) + conceptos (8)",
    path: "png",
    kind: "grafico",
    category: "Gráficos de campaña",
    tags: ["marca", "carrusel", "conceptos"],
    status: "listo",
    notes: "Fuente editable en svg/ · re-render con render-png.mjs.",
    usedIn: [],
  },
  {
    id: "perfil-redes",
    name: "Fotos de perfil @zentronegocios (4 variantes)",
    path: "png/perfil",
    kind: "grafico",
    category: "Identidad",
    tags: ["perfil", "redes"],
    resolution: "1080×1080",
    orientation: "cuadrado",
    status: "listo",
    usedIn: [],
  },
  {
    id: "isotipo-z",
    name: "Isotipo Z (PNG transparente)",
    file: "10_isotipo_zentro.png",
    path: "png",
    kind: "logo",
    category: "Identidad",
    tags: ["logo", "isotipo", "esquina"],
    status: "listo",
    notes: "Para la esquina de los videos (60% opacidad) y la cortinilla.",
    usedIn: [{ videoId: 0, cue: "todos los videos", purpose: "Marca de esquina + cortinilla" }],
  },
  {
    id: "qr-fundadores",
    name: "QR fundadores con logo (→ /register?ref=fundadores)",
    file: "qr-fundadores-logo.png",
    path: ".",
    kind: "qr",
    category: "Identidad",
    tags: ["qr", "medible", "registro"],
    status: "listo",
    notes: "El QR medible de la campaña. qr-code.png (genérico) y qr-fundadores.png (sin logo) también existen; usa SIEMPRE este.",
    usedIn: [],
    campaigns: ["Usuarios Fundadores"],
  },

  // ————————————————————— PENDIENTES (lo único que falta grabar/crear) —————————————————————
  {
    id: "cortinilla",
    name: "Cortinilla oficial de cierre (animada)",
    file: "cortinilla_9x16.mp4",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Identidad",
    tags: ["cierre", "marca", "handle"],
    durationSec: 2,
    resolution: "1080×1920",
    orientation: "vertical",
    status: "listo",
    notes:
      "Generada automáticamente (video-build/build-cortinilla.mjs): base negra + glow verde + isotipo Z + claim + @zentronegocios, con zoom sutil y fundidos. Sin QR a propósito (en 2 s nadie escanea; el CTA vive en el video hablado). Se arrastra al final de CADA proyecto: es la firma de marca.",
    usedIn: [{ videoId: 0, cue: "el final de TODOS los videos", purpose: "Cierre estándar: reconocimiento de marca + handle" }],
  },
  {
    id: "correo-recordatorio",
    name: "Recordatorio de pago (correo real en Gmail)",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Grabaciones de pantalla",
    tags: ["cobranza", "correo", "recordatorio"],
    status: "pendiente",
    notes: "La joya del guion #1 y #36: el correo REAL que recibe el cliente moroso, con el nombre del negocio.",
    usedIn: [
      { videoId: 1, cue: "“Zentro le manda a tu cliente un recordatorio amable, con tu nombre”", purpose: "La prueba tangible del diferenciador", holdSec: 6 },
      { videoId: 36, cue: "todo el video (protagonista)", purpose: "Leerlo línea por línea con zoom", holdSec: 15 },
    ],
    campaigns: ["Usuarios Fundadores"],
    capture: {
      priority: "alta",
      estMin: 10,
      batch: "Sesión Gmail (teléfono)",
      how: "Abre Gmail en TU teléfono con la bandeja de zeutro.notificaciones (o el buzón del cliente de prueba que recibió el recordatorio del cron) → abre el correo “Recordatorio de pago” → graba pantalla (menú rápido → Grabar pantalla) haciendo scroll LENTO por el correo, 15 s. Guarda como correo-recordatorio_9x16.mp4 en Biblioteca/clips-app (OneDrive).",
    },
  },
  {
    id: "codigo-editor",
    name: "Editor de código con el proyecto",
    path: "Biblioteca/clips-app",
    kind: "clip",
    category: "Grabaciones de pantalla",
    tags: ["build in public", "código"],
    status: "pendiente",
    usedIn: [
      { videoId: 7, cue: "“Estoy construyendo una app en público”", purpose: "Flash de 1 s + b-roll del episodio", holdSec: 3 },
      { videoId: 26, cue: "timelapse mientras cuentas la madrugada", purpose: "Prueba visual del sacrificio", holdSec: 8 },
    ],
    capture: {
      priority: "media",
      estMin: 5,
      batch: "Sesión código (PC)",
      how: "En el PC: abre VS Code con el proyecto zentro → Win+G (grabadora de Windows) o graba con el teléfono EN MANO apuntando al monitor (aquí lo “sucio” suma) → 20-30 s de scroll/typing. Guarda como codigo-editor.mp4 en Biblioteca/clips-app.",
    },
  },
  {
    id: "captura-chat-holaa",
    name: "Chat “Holaa, disculpa que te moleste 🙈”",
    path: "Biblioteca/capturas",
    kind: "grafico",
    category: "Capturas e insertos",
    tags: ["whatsapp", "pena", "cobrar"],
    status: "pendiente",
    usedIn: [
      { videoId: 1, cue: "“Y tú ahí... redactando el holaa”", purpose: "El inserto que hace reír de identificación", holdSec: 1.5 },
      { videoId: 23, cue: "protagonista (escribir y borrar 3 veces)", purpose: "Versión video del mismo dolor", holdSec: 10 },
    ],
    capture: {
      priority: "alta",
      estMin: 3,
      batch: "Sesión utilería (teléfono)",
      how: "En WhatsApp, chat contigo mismo: escribe “Holaa, disculpa que te moleste 🙈” SIN enviar → captura de pantalla. Para el #23: graba pantalla mientras lo escribes y borras 3 veces. Guarda en Biblioteca/capturas (OneDrive).",
    },
  },
  {
    id: "capturas-caos",
    name: "El caos: cuaderno, Excel y chats (el “antes”)",
    path: "Biblioteca/capturas",
    kind: "grafico",
    category: "Capturas e insertos",
    tags: ["caos", "antes", "excel", "cuaderno"],
    status: "pendiente",
    usedIn: [
      { videoId: 3, cue: "“Tienen MIL datos: WhatsApp, Excel, cuadernos”", purpose: "3 insertos de 1 s alineados a cada palabra", holdSec: 3 },
      { videoId: 10, cue: "lado A completo", purpose: "El Excel caótico que se sufre en pantalla", holdSec: 10 },
    ],
    capture: {
      priority: "media",
      estMin: 10,
      batch: "Sesión utilería (teléfono)",
      how: "Foto del cuaderno arrugado con números · captura de un Excel desordenado (crea uno con muchas filas y un #¡REF!) · captura de una lista de chats de WhatsApp (tapa nombres). Guarda las 3 en Biblioteca/capturas.",
    },
  },
  {
    id: "fotos-broll-personal",
    name: "Fotos tuyas trabajando (b-roll de historias)",
    path: "Biblioteca/capturas",
    kind: "grafico",
    category: "Capturas e insertos",
    tags: ["b-roll", "historia", "personal"],
    status: "pendiente",
    usedIn: [
      { videoId: 3, cue: "de apoyo en el bloque de contexto", purpose: "Humanizar la historia origen", holdSec: 2 },
      { videoId: 43, cue: "insertos durante el storytelling", purpose: "B-roll emocional", holdSec: 3 },
    ],
    capture: {
      priority: "baja",
      estMin: 10,
      batch: "Sesión utilería (teléfono)",
      how: "3-4 fotos: tú en el escritorio con la laptop, un café, el teléfono en mano. Luz de ventana. Las toma alguien más o con temporizador.",
    },
  },
  {
    id: "screenshot-feedback",
    name: "Screenshot del primer feedback real",
    path: "Biblioteca/capturas",
    kind: "grafico",
    category: "Capturas e insertos",
    tags: ["feedback", "prueba social"],
    status: "pendiente",
    notes: "SOLO cuando exista de verdad. No se inventa jamás.",
    usedIn: [
      { videoId: 11, cue: "gancho: “Un usuario me mandó esto el lunes”", purpose: "La prueba del modelo pides→programo", holdSec: 4 },
      { videoId: 55, cue: "gancho del video", purpose: "El feedback duro que aceptas", holdSec: 4 },
    ],
    capture: {
      priority: "baja",
      estMin: 2,
      batch: "Cuando exista (material real)",
      how: "Captura del mensaje/chat del usuario fundador (nombre tapado si no hay permiso). Guarda en Biblioteca/capturas.",
    },
  },
];

/** Recursos usados por un guion, en orden de aparición (para la vista del video). */
export function assetsForVideo(videoId: number): { asset: MediaAsset; use: MediaUse }[] {
  const out: { asset: MediaAsset; use: MediaUse }[] = [];
  for (const asset of MEDIA) {
    for (const use of asset.usedIn) {
      if (use.videoId === videoId || use.videoId === 0) out.push({ asset, use });
    }
  }
  return out;
}

/** Pendientes agrupados por lote de captura (para aprovechar cada sesión). */
export function captureBatches(): Map<string, MediaAsset[]> {
  const map = new Map<string, MediaAsset[]>();
  for (const a of MEDIA) {
    if (a.status !== "pendiente" || !a.capture) continue;
    if (!map.has(a.capture.batch)) map.set(a.capture.batch, []);
    map.get(a.capture.batch)!.push(a);
  }
  return map;
}
