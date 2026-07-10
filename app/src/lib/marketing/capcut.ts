// ============================================================================
// RECETARIO CAPCUT — **versión de ESCRITORIO para Windows (gratuita)**.
// El usuario edita en el PC (los archivos de OneDrive ya están locales en
// C:\Users\...\OneDrive\...\Marketing-Assets-Zentro\Biblioteca\).
//
// Anatomía de CapCut Desktop (para ubicarte SIEMPRE):
// · Arriba-izquierda: pestañas de contenido (Multimedia, Audio, Texto,
//   Stickers, Efectos, Transiciones, Filtros...).
// · Centro-derecha: el REPRODUCTOR (vista previa).
// · Derecha: PANEL DE PROPIEDADES del clip seleccionado (Video, Audio,
//   Velocidad, Animación...). Si no lo ves, haz click en un clip.
// · Abajo: la LÍNEA DE TIEMPO (pistas apiladas; la de más abajo es la
//   principal, lo que pongas encima se superpone).
// · El CABEZAL es la línea vertical blanca de la línea de tiempo: marca el
//   fotograma que estás viendo. Se mueve haciendo click o arrastrando.
// Atajos que usarás mil veces: Ctrl+B divide en el cabezal · Supr elimina ·
// Ctrl+Z deshace · barra espaciadora reproduce/pausa · Ctrl+rueda hace zoom
// a la línea de tiempo.
// ============================================================================

export type CapcutRecipe = {
  id: string;
  title: string;
  /** Dónde se encuentra (panel/menú exacto en Desktop). */
  where: string;
  steps: string[];
  /** Alternativa si la función es de pago (corona 👑) o no aparece. */
  freeAlt?: string;
  /** Cómo comprobar que quedó bien. */
  verify: string;
  /** Palabras de los guiones que disparan esta receta. */
  keywords: string[];
};

export const CAPCUT_RECIPES: CapcutRecipe[] = [
  {
    id: "proyecto",
    title: "Crear el proyecto e importar TODO de una vez",
    where: "Pantalla de inicio → botón “Crear proyecto”. Luego pestaña “Multimedia” (arriba-izquierda) → “Importar”",
    steps: [
      "Abre CapCut y haz click en “Crear proyecto” (el rectángulo grande).",
      "FORMATO 9:16 (hazlo primero): en el panel derecho, con nada seleccionado, busca “Proporción” (o click derecho en el fondo del reproductor → Proporción) → elige 9:16. El lienzo queda vertical.",
      "Pestaña “Multimedia” → botón “Importar” → navega a tu carpeta de OneDrive: Documentos/OneDrive → sistema para emprendedores → Marketing-Assets-Zentro → Biblioteca → clips-app.",
      "Selecciona con Ctrl+click TODOS los archivos que pide el guion (tus bloques grabados + los clips de app + cortinilla_9x16.mp4) → “Abrir”. Quedan como tarjetas en el panel Multimedia.",
      "Tus bloques grabados: impórtalos desde donde los pasaste del teléfono (recomendado: guárdalos también en Biblioteca/ para tener todo junto).",
    ],
    verify: "En el panel Multimedia ves TODAS las tarjetas (bloques + clips de app + cortinilla) y el lienzo del reproductor es vertical.",
    keywords: ["importa", "proyecto", "orden"],
  },
  {
    id: "pista-principal",
    title: "Montar la pista principal (tus bloques en orden)",
    where: "Arrastrar desde el panel Multimedia a la línea de tiempo (abajo)",
    steps: [
      "Arrastra tu PRIMER bloque grabado a la línea de tiempo, pegado al inicio (posición 0).",
      "Arrastra el segundo bloque a la DERECHA del primero (CapCut lo imanta al borde: suéltalo cuando aparezca la línea de ajuste). Repite con todos, en el orden del guion.",
      "Los clips de pantalla y la cortinilla NO van todavía: primero se limpia la pista principal.",
      "Si un bloque quedó en el lugar equivocado: arrástralo (los demás se reacomodan solos).",
    ],
    verify: "Reproduce con la barra espaciadora: se oyen tus bloques en el orden del guion, aunque con pausas y errores (eso se limpia ahora).",
    keywords: ["pista", "arrastra", "orden"],
  },
  {
    id: "cortes",
    title: "Limpiar silencios y errores (¡sin tocar las pausas del guion!)",
    where: "Línea de tiempo → cabezal + Ctrl+B (dividir) + Supr (eliminar)",
    steps: [
      "Haz zoom a la línea de tiempo con Ctrl+rueda del ratón hasta ver bien la ONDA DE AUDIO de cada clip (las partes planas = silencio).",
      "Reproduce (barra espaciadora). Cuando llegue un error o un silencio muerto, PAUSA.",
      "Coloca el cabezal JUSTO donde empieza lo que sobra (afina con las flechas ← → del teclado, que mueven fotograma a fotograma).",
      "Pulsa Ctrl+B: el clip se divide en dos.",
      "Cabezal JUSTO donde termina lo que sobra → Ctrl+B otra vez.",
      "Click en el pedazo del medio (queda resaltado) → tecla Supr. Los clips se cierran solos sin dejar hueco.",
      "REGLA DE ORO: las pausas que el guion marca como “+ silencio de X s” se CONSERVAN — están contadas en el tiempo del video y son las que crean la tensión. Solo borras errores, muletillas y aire no planeado.",
      "Repite hasta el final. 10-15 min por video: es el paso que más calidad aporta.",
    ],
    verify: "Reproduce completo: salta de frase a frase sin aire muerto, PERO los silencios dramáticos del guion siguen ahí.",
    keywords: ["limpieza", "corte", "cortes", "dividir", "silencios"],
  },
  {
    id: "inserto",
    title: "Insertar un clip de pantalla o imagen ENCIMA (pista superior)",
    where: "Arrastrar desde Multimedia a una pista ARRIBA de la principal",
    steps: [
      "Coloca el cabezal en la FRASE exacta donde el guion dice que entra el recurso (la sección “Recursos de este video” te da la frase y el archivo).",
      "Arrastra el clip de app (p. ej. dashboard-principal_9x16.mp4) desde Multimedia y suéltalo ENCIMA del clip principal, alineado con el cabezal. CapCut crea una pista superior automáticamente.",
      "Tamaño: los clips de la Biblioteca ya son 1080×1920 — llenan la pantalla solos. Si quedara pequeño: selecciónalo → panel derecho → “Escala” al 100%, Posición X=0 Y=0.",
      "Duración: arrastra el BORDE derecho del clip insertado hasta los segundos que pide el guion (el contador aparece mientras arrastras).",
      "Si el clip dura más de lo que necesitas (p. ej. el b-roll de 41 s): recorta con Ctrl+B el tramo bueno y borra el resto — o arrastra sus bordes.",
      "Tu voz sigue sonando debajo: la pista superior solo tapa la IMAGEN, no el audio de la principal.",
    ],
    verify: "En la frase indicada se VE la pantalla de la app y se OYE tu voz. Al terminar los segundos indicados, vuelves a verte tú.",
    keywords: ["inserto", "superposición", "captura", "pantalla", "flash", "clip de app"],
  },
  {
    id: "subtitulos",
    title: "Subtítulos automáticos + estilo de marca",
    where: "Pestaña “Texto” (arriba-izquierda) → “Subtítulos automáticos”",
    steps: [
      "Pestaña “Texto” → subpestaña “Subtítulos automáticos” → idioma: Español → “Generar”. Espera: aparecen como una pista propia sobre el video.",
      "CORRÍGELOS TODOS: doble click en cada subtítulo en el reproductor (o usa la lista del panel derecho) y arregla errores — escribirá “centro” o “Sentro” en vez de “Zentro”.",
      "ESTILO DE MARCA (se define UNA vez): selecciona un subtítulo → panel derecho → pestaña “Texto”: fuente en Negrita, color Blanco, activa “Contorno/Borde” en Negro grosor medio. Tamaño: que nunca pase de 2 líneas.",
      "Aplica a todos: busca el botón “Aplicar a todos” del panel de texto (aparece al editar el estilo de un subtítulo generado).",
      "POSICIÓN: arrastra el subtítulo en el reproductor hasta el centro-bajo (a un tercio del borde inferior). Nunca pegado al borde: los botones de TikTok/IG lo tapan.",
    ],
    freeAlt: "Si “Subtítulos automáticos” pidiera Pro en tu versión: pestaña Texto → “Texto predeterminado”, arrastra un texto por frase y escríbela a mano (lento pero gratis). Suele ser gratuito en Desktop.",
    verify: "Mira 10 s con el volumen a cero: cada palabra dicha aparece escrita, sin errores, legible y sin que la UI de TikTok la tape.",
    keywords: ["subtítulos", "subtitulos"],
  },
  {
    id: "palabra-verde",
    title: "Resaltar UNA palabra en verde Zentro (#00C781)",
    where: "Doble click en el subtítulo → seleccionar la palabra → panel derecho → color",
    steps: [
      "Doble click sobre el subtítulo en el reproductor: entra en modo edición de texto.",
      "Selecciona SOLO la palabra clave con el ratón (como en Word).",
      "Panel derecho → “Color de texto” → click en el selector personalizado (la ruedita de color) → en el campo hexadecimal escribe 00C781 → Enter.",
      "Máximo 1-3 palabras verdes por pantalla: si todo es verde, nada resalta.",
    ],
    verify: "Solo la palabra clave quedó verde; el resto sigue blanco con borde negro.",
    keywords: ["verde", "resalta", "palabra"],
  },
  {
    id: "texto-grande",
    title: "Texto grande (titular) con animación",
    where: "Pestaña “Texto” → “Texto predeterminado” → arrastrar a la línea de tiempo",
    steps: [
      "Cabezal en la frase donde el guion dice que aparece el titular.",
      "Pestaña “Texto” → arrastra “Texto predeterminado” a una pista ENCIMA de todo, alineado con el cabezal.",
      "Doble click y escribe el titular EXACTO del guion.",
      "Panel derecho: Negrita, Blanco, Contorno negro. Arrastra el texto en el reproductor al TERCIO SUPERIOR.",
      "Animación: panel derecho → pestaña “Animación” → “Entrada” → elige “Emerger/Fade” (o “Rebote” si el guion lo pide) → duración ~0.3 s con el deslizador.",
      "Cuánto dura en pantalla: arrastra los bordes de su barrita en la línea de tiempo hasta cubrir el rango de segundos que dice el guion.",
    ],
    verify: "El titular entra con su animación en la frase indicada y desaparece cuando el guion lo dice — no se queda pegado al bloque siguiente.",
    keywords: ["texto grande", "titular", "texto:"],
  },
  {
    id: "zoom",
    title: "Zoom de énfasis con fotogramas clave (keyframes)",
    where: "Selecciona el clip → panel derecho → rombo ◇ junto a “Escala”",
    steps: [
      "Click en el clip de video en la línea de tiempo (borde resaltado).",
      "Cabezal JUSTO ANTES de la palabra a enfatizar.",
      "Panel derecho → sección “Básico” → localiza “Escala”. A su derecha hay un ROMBO ◇: haz click. Se enciende: primer keyframe puesto (“aquí empieza el cambio”).",
      "Avanza el cabezal ~0.2 s (flecha → unas 6 veces).",
      "Sube “Escala” a 110% (escribe 110 o arrastra el deslizador). CapCut crea el segundo keyframe SOLO. Ya está el zoom de entrada.",
      "Para volver al tamaño normal: cabezal donde termina el énfasis → click al rombo ◇ → avanza 0.2 s → Escala a 100%.",
      "El guion dice EN QUÉ PALABRA va cada zoom y cuánto sostenerlo. No añadas zooms extra: cada uno debe dirigir la mirada, no marear.",
    ],
    freeAlt: "Si te abruma la primera vez: sáltate el zoom — un buen corte vale más que un zoom mal hecho.",
    verify: "La imagen se acerca suave EXACTAMENTE en la palabra indicada y regresa. Si “salta” de golpe, los keyframes están muy juntos: arrastra el segundo rombo un poco más a la derecha (se ven sobre el clip).",
    keywords: ["zoom", "keyframe"],
  },
  {
    id: "voz-off",
    title: "Voz en off sobre una grabación de pantalla",
    where: "Click derecho en el clip con tu voz → “Separar audio”",
    steps: [
      "Si grabaste la voz como VIDEO (cámara tapada): arrastra ese clip a la línea de tiempo → click derecho sobre él → “Separar audio”. El audio queda en su propia pista; borra la parte de video (click → Supr).",
      "Arrastra la pista de audio hasta alinearla con la grabación de pantalla que debe acompañar.",
      "Alternativa: graba directo en el PC — pestaña “Audio” → “Grabar” (icono de micrófono) → botón rojo mientras lees el bloque.",
      "Sincroniza: reproduce y mueve la pista de audio hasta que cada frase coincida con lo que se ve (cuando nombras algo, ESO está en pantalla).",
    ],
    verify: "Lo que dices coincide con lo que se ve, frase por frase.",
    keywords: ["voz en off", "separar audio", "extraer audio"],
  },
  {
    id: "musica",
    title: "Música de fondo con el volumen correcto (y sus subidas/bajadas)",
    where: "Pestaña “Audio” (arriba-izquierda) → “Música”",
    steps: [
      "Pestaña “Audio” → buscador → escribe el término EXACTO del guion (ej. “lofi tension”, “emotional piano”, “upbeat lofi”).",
      "Pre-escucha con el ▶ de cada resultado → arrastra el elegido a una pista DEBAJO de tu voz, desde el inicio (o desde donde el guion diga que entra).",
      "VOLUMEN (lo más importante): click en la pista de música → panel derecho → “Audio” → “Volumen”. CapCut Desktop lo mide en dB: pon ≈ −25 dB para “volumen 15-20” del guion (tu voz SIEMPRE por encima; si compite, baja más).",
      "SUBIDAS Y BAJADAS que pide el guion (ej. “a cero en el bloque serio”): coloca el cabezal donde cambia → Ctrl+B sobre la pista de música → ajusta el volumen SOLO de ese pedazo. Repite al salir del bloque.",
      "Recorta la música al final del video: cabezal al final → Ctrl+B → Supr al sobrante.",
    ],
    verify: "Cierra los ojos y reproduce: entiendes cada palabra sin esfuerzo. En los bloques marcados “sin música”, hay silencio real.",
    keywords: ["música", "musica", "volumen", "lofi", "piano"],
  },
  {
    id: "sfx",
    title: "Efectos de sonido (pop, whoosh, cha-ching, teclas)",
    where: "Pestaña “Audio” → “Efectos de sonido”",
    steps: [
      "Cabezal EXACTO donde va el efecto (ej. donde aparece un texto grande).",
      "Pestaña “Audio” → subpestaña “Efectos de sonido” → busca en inglés: “pop” (textos), “whoosh” (paso a pantalla), “cash register” (momento dinero), “keyboard typing” (teclas), “notification”.",
      "Pre-escucha → arrastra el elegido a una pista de audio, alineado al cabezal.",
      "Afina la posición arrastrando la pista hasta que suene AL FRAME con lo visual (el cha-ching debe sonar exactamente cuando aparece “Cobraste $X”).",
      "Volumen del efecto: panel derecho → ≈ −12 a −8 dB (claro pero sin asustar).",
      "Máximo 4-5 efectos por video: más se vuelve ruido.",
    ],
    verify: "Cada efecto suena exactamente con su evento visual, ni antes ni después.",
    keywords: ["sfx", "pop", "whoosh", "cha-ching", "sonido", "teclas", "notificación", "tick-tock", "chasquido"],
  },
  {
    id: "ruido",
    title: "Reducir ruido de fondo de tu voz",
    where: "Click en el clip con tu voz → panel derecho → “Audio” → “Reducción de ruido”",
    steps: [
      "Click en el clip (o pista de audio separada) con tu voz.",
      "Panel derecho → pestaña “Audio” → activa el interruptor “Reducción de ruido”.",
      "Escucha el antes/después: si la voz suena “robótica” o “bajo el agua”, DESACTÍVALO — mejor un poco de ruido que una voz procesada.",
    ],
    freeAlt: "Si no aparece: graba más cerca del micrófono (10-15 cm) y en el cuarto con cortinas — prevenir vale más que quitar.",
    verify: "La voz se oye limpia y natural, sin efecto robot.",
    keywords: ["ruido"],
  },
  {
    id: "velocidad",
    title: "Cambiar velocidad de un clip (timelapse casero)",
    where: "Click en el clip → panel derecho → pestaña “Velocidad”",
    steps: [
      "Click en el clip → panel derecho → “Velocidad” → “Normal” → sube el multiplicador (2x, 5x… para timelapse de pantalla/código).",
      "Silencia su audio si quedó chillón: panel “Audio” → Volumen al mínimo (o click derecho → Silenciar).",
      "Tus bloques hablados NUNCA cambian de velocidad: se nota y suena falso.",
    ],
    verify: "El clip acelerado se ve fluido y sin audio raro.",
    keywords: ["velocidad", "timelapse"],
  },
  {
    id: "mascara",
    title: "Pantalla dividida (dos videos a la vez)",
    where: "Clip B en pista superior → panel derecho → “Máscara”",
    steps: [
      "Video A en la pista principal; arrastra el video B a la pista de ENCIMA (mismo rango de tiempo).",
      "Click en B → panel derecho → pestaña “Máscara” → elige “Lineal” (línea recta).",
      "En el reproductor, arrastra y ROTA la línea de la máscara para que B ocupe la mitad inferior y A la superior.",
      "Ajusta escala/posición de cada video (panel “Básico”) hasta que ambos se vean bien en su mitad.",
      "Para “congelar” un lado mientras el otro corre: click derecho en ese clip → “Congelar” en el punto deseado (crea un fotograma fijo).",
    ],
    verify: "Se ven los dos videos a la vez, cada uno en su mitad, sin bordes negros raros.",
    keywords: ["dividida", "máscara", "mitades"],
  },
  {
    id: "cortinilla",
    title: "Poner la cortinilla oficial al final (ya está creada)",
    where: "Panel Multimedia → cortinilla_9x16.mp4 → arrastrar al final",
    steps: [
      "La cortinilla YA EXISTE (se generó automáticamente): Marketing-Assets-Zentro/Biblioteca/clips-app/cortinilla_9x16.mp4 — negro + Z + claim + @zentronegocios, con fundidos.",
      "Impórtala con el resto de archivos (receta “Crear el proyecto”).",
      "Arrástrala a la pista principal, pegada al FINAL del último bloque.",
      "No le añadas transición: ella trae su propio fundido de entrada.",
      "La música debe terminar ANTES de la cortinilla o desvanecerse sobre ella: Ctrl+B en la música al inicio de la cortinilla → panel Audio → activa “Fundido de salida” ~0.5 s en el último pedazo.",
    ],
    verify: "El video termina en el cierre de marca (2 s) y la música no se corta de golpe.",
    keywords: ["cortinilla"],
  },
  {
    id: "marca-agua",
    title: "Exportar SIN marca de agua (gratis)",
    where: "Final de la línea de tiempo + ajustes de exportación",
    steps: [
      "Desliza hasta el final de la línea de tiempo: si hay un clip extra con el logo “CapCut” añadido automáticamente, click sobre él → Supr (es un clip normal).",
      "Evita las PLANTILLAS de la pantalla de inicio: muchas fuerzan marca de agua o funciones Pro. Trabaja siempre desde “Crear proyecto”.",
      "Cualquier función con corona 👑 es de pago: este recetario siempre da la alternativa gratis.",
    ],
    verify: "El video exportado termina en TU cortinilla, sin logo de CapCut.",
    keywords: ["marca de agua"],
  },
  {
    id: "exportar",
    title: "Exportar en calidad correcta",
    where: "Botón “Exportar” (arriba-derecha)",
    steps: [
      "Click en “Exportar” (arriba a la derecha).",
      "Nombre: el del video (ej. “zentro-01-pena-de-cobrar”). Carpeta: donde lo encuentres fácil.",
      "Resolución: 1080p · Fotogramas: 30 fps (o 60 si tus bloques son 60) · Tasa de bits: “Recomendada” · Formato: MP4 · Códec: H.264.",
      "Click en “Exportar” y espera la barra de progreso.",
      "PRUEBA FINAL: abre el archivo y míralo completo EN SILENCIO. ¿Se entiende toda la historia sin sonido? Si no, faltan textos (el 85% lo verá así).",
      "Pásalo al teléfono para publicar (OneDrive o cable): TikTok/IG/FB se publican desde sus apps.",
    ],
    verify: "El archivo se ve nítido a pantalla completa, pesa razonable (20-60 MB) y se entiende en silencio.",
    keywords: ["exporta", "exportar"],
  },
];

/** Recetas relevantes para un guion, detectadas por sus pasos de edición. */
export function recipesForScript(editSteps: string[], segmentEdits: (string | undefined)[]): CapcutRecipe[] {
  const text = (editSteps.join(" ") + " " + segmentEdits.filter(Boolean).join(" ")).toLowerCase();
  const base = new Set(["proyecto", "pista-principal", "cortes", "subtitulos", "palabra-verde", "texto-grande", "musica", "cortinilla", "marca-agua", "exportar"]);
  for (const r of CAPCUT_RECIPES) {
    if (base.has(r.id)) continue;
    if (r.keywords.some((k) => text.includes(k))) base.add(r.id);
  }
  return CAPCUT_RECIPES.filter((r) => base.has(r.id));
}
