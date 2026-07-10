// ============================================================================
// RECETARIO CAPCUT (versión GRATUITA, app de celular, interfaz en español).
// Cada receta: dónde está el botón, qué tocar en orden, qué configurar,
// alternativa gratis si algo es de pago (corona 👑) y cómo verificar.
// Es el "editor profesional sentado al lado": cero pasos implícitos.
// ============================================================================

export type CapcutRecipe = {
  id: string;
  title: string;
  /** Dónde se encuentra (menú/ruta exacta). */
  where: string;
  steps: string[];
  /** Alternativa si la función es de pago o no aparece. */
  freeAlt?: string;
  /** Cómo comprobar que quedó bien. */
  verify: string;
  /** Palabras del guion que disparan esta receta (para vincularla automáticamente). */
  keywords: string[];
};

export const CAPCUT_RECIPES: CapcutRecipe[] = [
  {
    id: "proyecto",
    title: "Crear el proyecto e importar clips",
    where: "Pantalla inicial de CapCut → botón grande “+ Nuevo proyecto”",
    steps: [
      "Abre CapCut y toca “+ Nuevo proyecto” (el rectángulo grande arriba).",
      "Se abre tu galería: toca los clips EN EL ORDEN del guion (a cada uno le sale un número al seleccionarlo).",
      "Toca “Añadir” (abajo a la derecha). Se abre el editor con los clips ya en fila.",
      "Orientación: si un clip salió girado, tócalo en la línea de tiempo → desliza el menú inferior hasta “Rotar”.",
    ],
    verify: "En la línea de tiempo (la tira de abajo) los clips aparecen en el mismo orden del guion.",
    keywords: ["importa", "proyecto", "orden"],
  },
  {
    id: "cortes",
    title: "Cortar silencios y errores (jump cuts)",
    where: "Línea de tiempo → botón “Dividir” (icono de tijeras en el menú inferior)",
    steps: [
      "Reproduce el video con ▶. Cuando llegue un silencio o un error, PAUSA.",
      "Arrastra la línea de tiempo hasta que la barra vertical blanca (el “cabezal”) quede JUSTO donde empieza lo que sobra.",
      "Toca el clip (se pone con borde blanco) → toca “Dividir” en el menú de abajo.",
      "Mueve el cabezal a donde TERMINA lo que sobra → “Dividir” otra vez.",
      "Toca el pedazo del medio (queda seleccionado) → botón “Eliminar” (papelera, en el mismo menú).",
      "Repite en cada pausa/error. Tarda 10-15 min por video y es el paso que más calidad aporta.",
      "IMPORTANTE: respeta los silencios que el guion marca como dramáticos — están contados en el tiempo del video.",
    ],
    verify: "Reproduce completo: el video salta de frase a frase sin aire, EXCEPTO en los silencios marcados por el guion.",
    keywords: ["limpieza", "corte", "cortes", "dividir", "silencios"],
  },
  {
    id: "subtitulos",
    title: "Subtítulos automáticos (y corregirlos)",
    where: "Menú inferior → “Texto” → “Subtítulos automáticos”",
    steps: [
      "Con el cabezal al inicio, toca “Texto” en el menú inferior (icono T).",
      "Toca “Subtítulos automáticos”.",
      "En “Idioma de sonido” elige Español → toca “Generar” (o “Continuar”). Espera unos segundos.",
      "Aparecen los subtítulos como clips naranjas debajo del video. LÉELOS TODOS: toca cada uno y corrige errores con el teclado (escribirá “centro” o “Sentro” en vez de “Zentro”).",
      "Estilo: toca cualquier subtítulo → pestaña “Estilo” → fuente en Negrita → color Blanco → activa “Trazo” (borde) en Negro.",
      "Tamaño: que nunca ocupen más de 2 líneas (baja el tamaño si pasa).",
      "Posición: arrastra el texto con el dedo hasta el centro-bajo de la pantalla (a un tercio del borde inferior). NUNCA pegado al borde: los botones de TikTok lo tapan.",
    ],
    freeAlt: "Si “Subtítulos automáticos” pide Pro en tu versión: usa “Texto” → “Añadir texto” y escribe cada frase a mano (más lento pero gratis), o prueba la app CapCut actualizada — la función es gratuita en la versión estándar.",
    verify: "Mira 10 s con el volumen a cero: cada palabra dicha aparece escrita, sin errores, y se lee completa.",
    keywords: ["subtítulos", "subtitulos"],
  },
  {
    id: "palabra-verde",
    title: "Resaltar UNA palabra en verde Zentro (#00C781)",
    where: "Toca el subtítulo → pestaña “Estilo” → selección de palabra",
    steps: [
      "Toca el clip del subtítulo que tiene la palabra clave.",
      "Toca el texto en la vista previa para editar → selecciona SOLO esa palabra (mantén el dedo sobre ella y ajusta los topes azules).",
      "Con la palabra seleccionada, pestaña “Estilo” → “Color de texto”.",
      "Desliza los colores hasta el selector con cuentagotas/arcoíris → tócalo → en “Valor hexadecimal” escribe 00C781 → OK.",
      "Si tu versión no deja escribir el código: elige el verde esmeralda más parecido de la paleta.",
      "Máximo 1-3 palabras verdes por pantalla: si todo es verde, nada resalta.",
    ],
    verify: "Solo la palabra clave quedó verde; el resto del subtítulo sigue blanco con borde negro.",
    keywords: ["verde", "resalta", "palabra"],
  },
  {
    id: "texto-grande",
    title: "Texto grande (titular) con animación",
    where: "Menú inferior → “Texto” → “Añadir texto”",
    steps: [
      "Pon el cabezal donde el guion dice que aparece el titular.",
      "Toca “Texto” → “Añadir texto” → escribe el titular EXACTO del guion.",
      "Pestaña “Estilo”: Negrita, color Blanco, “Trazo” en Negro.",
      "Arrastra el texto con el dedo al TERCIO SUPERIOR de la pantalla (el guion dice el lugar exacto).",
      "Pestaña “Animación” → “Entrada” → elige “Emerger” (o “Rebote” si el guion lo pide) → duración de la animación: ~0.3 s (el deslizador pequeño).",
      "Duración total del texto: en la línea de tiempo, arrastra los bordes blancos de la barrita del texto para que dure lo que dura el bloque del guion.",
    ],
    verify: "El titular entra con su animación justo en la frase indicada y desaparece cuando el guion lo dice (no se queda pegado al bloque siguiente).",
    keywords: ["texto grande", "titular", "texto:"],
  },
  {
    id: "zoom",
    title: "Zoom de énfasis con keyframes (fotogramas clave)",
    where: "Selecciona el clip de video → icono de rombo ◇ (aparece a la derecha del panel, sobre la línea de tiempo)",
    steps: [
      "Toca el clip de video en la línea de tiempo (borde blanco).",
      "Mueve el cabezal JUSTO ANTES de la palabra a enfatizar.",
      "Toca el rombo ◇ (keyframe). Se pone rojo: acabas de marcar “aquí empieza el cambio”.",
      "Avanza el cabezal ~0.2 s (un pelín a la derecha).",
      "En la vista previa, agranda la imagen con dos dedos (pellizco hacia afuera) hasta ~110% — un 10% más grande, apenas notorio. CapCut crea el segundo keyframe SOLO.",
      "Para volver al tamaño normal: avanza el cabezal a donde termina el énfasis → toca ◇ → avanza 0.2 s más → pellizca hacia adentro al tamaño original.",
      "El guion dice exactamente EN QUÉ PALABRA va cada zoom y cuánto sostenerlo. No añadas zooms extra.",
    ],
    freeAlt: "Si los keyframes te abruman la primera vez: sáltate el zoom — un buen corte vale más que un zoom mal hecho. (El “Zoom automático” con corona 👑 es Pro: no lo necesitas.)",
    verify: "Reproduce: la imagen se acerca suave EXACTAMENTE en la palabra indicada y regresa; no “salta” de golpe (si salta, los keyframes están muy juntos: sepáralos).",
    keywords: ["zoom", "keyframe"],
  },
  {
    id: "inserto",
    title: "Insertar una imagen o grabación de pantalla encima (superposición)",
    where: "Menú inferior → “Superposición” → “Añadir superposición”",
    steps: [
      "Pon el cabezal donde el guion dice que aparece la captura/pantalla.",
      "Vuelve al menú principal (flecha ← abajo a la izquierda si estás dentro de otro menú) → toca “Superposición”.",
      "Toca “Añadir superposición” → elige la imagen o video de pantalla en tu galería → “Añadir”.",
      "Aparece pequeña sobre el video: agrándala con dos dedos hasta llenar la pantalla completa (o el tamaño que pida el guion).",
      "Duración: arrastra los bordes de su barrita en la línea de tiempo — el guion dice cuántos segundos exactos se ve.",
      "Para que se OIGA tu voz debajo mientras se ve la pantalla: no toques nada más — la superposición no borra el audio del clip principal.",
    ],
    verify: "La captura aparece en la frase exacta, dura lo que dice el guion, y tu voz se sigue oyendo debajo.",
    keywords: ["inserto", "superposición", "captura", "pantalla #", "flash"],
  },
  {
    id: "voz-off",
    title: "Voz en off debajo de una grabación de pantalla",
    where: "Toca el clip que tiene tu voz → “Extraer audio” (o menú “Audio” → “Grabar”)",
    steps: [
      "Si grabaste tu voz como VIDEO (cámara tapada): añade ese clip al proyecto → tócalo → desliza el menú inferior hasta “Extraer audio” → tócalo. El audio queda como pista aparte; borra el video (tócalo → Eliminar).",
      "Arrastra la pista de audio (barrita azul) hasta alinearla con la grabación de pantalla.",
      "Alternativa: graba directo en CapCut — menú “Audio” → “Grabar” → botón rojo mientras lees el bloque → detén.",
      "Ajusta: reproduce y mueve la pista hasta que cada frase coincida con lo que se ve (el guion dice qué se ve en cada frase).",
    ],
    verify: "Lo que dices coincide con lo que se ve: cuando nombras algo, ESO está en pantalla.",
    keywords: ["voz en off", "extraer audio"],
  },
  {
    id: "musica",
    title: "Música de fondo con el volumen correcto",
    where: "Menú inferior → “Audio” → “Sonidos”",
    steps: [
      "Cabezal al inicio del video (o donde el guion dice que entra la música).",
      "Toca “Audio” → “Sonidos” → usa el buscador con el término EXACTO del guion (ej: “lofi tension”, “emotional piano”, “upbeat lofi”).",
      "Escucha con ▶ junto a cada resultado → toca “+” en el elegido. Se añade como pista azul.",
      "VOLUMEN (lo más importante): toca la pista de música → “Volumen” → baja a 15-20 (el guion da el número). Tu voz SIEMPRE por encima.",
      "Subidas/bajadas que pide el guion (ej: “a cero en el bloque serio”): divide la pista de música con “Dividir” en ese punto y cambia el volumen solo a ese pedazo.",
      "Recorta la música al final del video: cabezal al final → “Dividir” → elimina el sobrante.",
    ],
    verify: "Cierra los ojos y reproduce: entiendes cada palabra sin esfuerzo. Si la música compite, bájala 5 puntos más.",
    keywords: ["música", "musica", "volumen", "lofi", "piano"],
  },
  {
    id: "sfx",
    title: "Efectos de sonido (pop, whoosh, cha-ching, teclas)",
    where: "Menú inferior → “Audio” → “Efectos”",
    steps: [
      "Pon el cabezal EXACTO donde va el efecto (ej: donde aparece un texto).",
      "Toca “Audio” → “Efectos” → busca en inglés: “pop” (textos), “whoosh” (transición a pantalla), “cash register” (momento dinero), “keyboard typing” (teclas), “notification”.",
      "Escucha → “+” para añadir. Queda como pista corta.",
      "Ajusta su posición arrastrando la pista hasta que suene AL FRAME con lo visual (el cha-ching debe sonar exactamente cuando aparece “Cobraste $X”).",
      "Volumen del efecto: tócalo → “Volumen” → 60-80 (deben oírse claros pero no asustar).",
      "Máximo 4-5 efectos por video: más se vuelve ruido.",
    ],
    verify: "Cada efecto suena exactamente con su evento visual, ni antes ni después.",
    keywords: ["sfx", "pop", "whoosh", "cha-ching", "sonido", "teclas", "notificación", "tick-tock", "chasquido"],
  },
  {
    id: "ruido",
    title: "Reducir ruido de fondo de tu voz",
    where: "Toca el clip con tu voz → desliza el menú inferior → “Reducir ruido”",
    steps: [
      "Toca el clip de video (o la pista de audio extraída) en la línea de tiempo.",
      "Desliza el menú inferior hacia la izquierda hasta encontrar “Reducir ruido” (icono de onda).",
      "Actívalo (interruptor). CapCut procesa unos segundos.",
      "Escucha el antes/después: si tu voz suena “robótica” o “bajo el agua”, DESACTÍVALO — mejor un poco de ruido que una voz procesada.",
    ],
    freeAlt: "Si no aparece la opción: graba más cerca del micrófono (10-15 cm) y en el cuarto con cortinas/cama — prevenir el ruido vale más que quitarlo.",
    verify: "La voz se oye limpia y natural, sin efecto “robot”.",
    keywords: ["ruido"],
  },
  {
    id: "velocidad",
    title: "Cambiar la velocidad de un clip (timelapse casero)",
    where: "Toca el clip → “Velocidad” → “Normal”",
    steps: [
      "Toca el clip en la línea de tiempo → “Velocidad” en el menú inferior.",
      "Elige “Normal” → mueve el deslizador (2x, 5x... para timelapse de pantalla/código).",
      "Para tus bloques hablados NUNCA cambies la velocidad: se nota y suena falso.",
    ],
    verify: "El clip acelerado se ve fluido y sin audio chillón (silencia su audio si quedó raro: clip → Volumen → 0).",
    keywords: ["velocidad", "timelapse"],
  },
  {
    id: "mascara",
    title: "Pantalla dividida (dos videos a la vez, con máscara)",
    where: "Clip principal + “Superposición” → toca la superposición → “Máscara”",
    steps: [
      "Añade el video A como clip principal y el video B como superposición (receta de insertar).",
      "Toca la superposición (video B) → desliza el menú → “Máscara”.",
      "Elige la máscara “Dividir” (línea recta) → arrástrala para que B ocupe la mitad inferior y A la superior.",
      "Ajusta el tamaño/posición de cada video con dos dedos hasta que ambos se vean bien en su mitad.",
      "Para “congelar” un lado mientras el otro corre: toca ese clip → “Congelar” (icono de fotograma) en el punto deseado.",
    ],
    verify: "Se ven los dos videos a la vez, cada uno en su mitad, sin bordes negros raros.",
    keywords: ["dividida", "máscara", "mitades"],
  },
  {
    id: "cortinilla",
    title: "Crear la cortinilla de cierre (una sola vez) y reutilizarla",
    where: "Proyecto nuevo → “Añadir” sin clips → fondo negro",
    steps: [
      "Crea un proyecto nuevo. Si te exige un clip: usa cualquier foto y luego tócala → “Reemplazar” → “Color” → Negro (o añade “Fondo” negro).",
      "Recórtalo a 1.5 segundos (bordes del clip).",
      "“Superposición” → añade el logo Z (PNG transparente de Marketing-Assets-Zentro/png/) → centrado, tamaño mediano.",
      "“Texto” → “El centro de control de tu negocio” debajo del logo (blanco, mediano) y “@zentronegocios” más pequeño abajo.",
      "Exporta (receta de exportar). Guarda el MP4 en tu galería como “cortinilla”.",
      "En CADA video: al final de la línea de tiempo, toca “+” → añade el MP4 de la cortinilla.",
    ],
    verify: "Todos tus videos terminan con el mismo cierre de 1.5 s: negro + Z + claim + @zentronegocios.",
    keywords: ["cortinilla"],
  },
  {
    id: "marca-agua",
    title: "Quitar la marca de agua de CapCut (gratis)",
    where: "Al FINAL de la línea de tiempo",
    steps: [
      "Desliza la línea de tiempo hasta el final del video.",
      "Si hay un clip extra que dice “CapCut” (el logo animado): tócalo → “Eliminar”. Es un clip normal, se borra gratis.",
      "OJO: evita la pestaña “Plantillas” de la pantalla inicial — muchas plantillas SÍ fuerzan marca de agua o funciones Pro. Trabaja siempre desde “Nuevo proyecto”.",
    ],
    verify: "El video exportado termina en tu cortinilla, sin el logo de CapCut.",
    keywords: ["marca de agua"],
  },
  {
    id: "exportar",
    title: "Exportar en calidad correcta",
    where: "Flecha hacia arriba ↑ (esquina superior derecha)",
    steps: [
      "Toca la flecha ↑ arriba a la derecha.",
      "Toca el texto de resolución (ej. “1080P”) si quieres ajustar: Resolución 1080p · Fotogramas 30 (o 60 si tus clips son 60).",
      "NO toques “Tasa de bits inteligente/alta” si aparece con corona 👑: la estándar es suficiente.",
      "Toca “Exportar” y espera sin salir de la app. Se guarda en tu galería.",
      "Prueba final: reproduce el exportado EN SILENCIO. ¿Se entiende todo sin sonido? Si no, faltan textos.",
    ],
    verify: "El archivo está en la galería, se ve nítido en pantalla completa y se entiende en silencio.",
    keywords: ["exporta", "exportar"],
  },
];

/** Recetas relevantes para un guion, detectadas por sus pasos de edición. */
export function recipesForScript(editSteps: string[], segmentEdits: (string | undefined)[]): CapcutRecipe[] {
  const text = (editSteps.join(" ") + " " + segmentEdits.filter(Boolean).join(" ")).toLowerCase();
  const base = new Set(["proyecto", "cortes", "subtitulos", "palabra-verde", "texto-grande", "musica", "marca-agua", "exportar"]);
  for (const r of CAPCUT_RECIPES) {
    if (base.has(r.id)) continue;
    if (r.keywords.some((k) => text.includes(k))) base.add(r.id);
  }
  return CAPCUT_RECIPES.filter((r) => base.has(r.id));
}
