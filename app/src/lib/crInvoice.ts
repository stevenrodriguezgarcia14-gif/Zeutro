// =====================================================================
// Lector de comprobantes electrónicos de Costa Rica (XML de Hacienda)
//
// PARA QUÉ: cuando alguien compra materiales en una ferretería, el
// proveedor está obligado a enviarle el XML y el PDF del comprobante por
// correo. Ese XML ya es SUYO: leerlo no requiere ninguna credencial, llave
// criptográfica ni permiso de Hacienda. Lo que sí requiere llave y permisos
// es EMITIR comprobantes y enviar el mensaje de aceptación — eso Zentro no
// lo hace y no pretende hacerlo.
//
// Así que esto no conecta con Hacienda: lee un archivo que el usuario ya
// tiene, para que no tenga que teclear el gasto a mano.
//
// SIN DEPENDENCIAS a propósito. Es un parser mínimo y tolerante:
//   - Ignora el namespace y la versión (4.2, 4.3, 4.4…): busca por nombre
//     LOCAL de etiqueta, porque el namespace cambia en cada versión.
//   - Sirve para FacturaElectronica, TiqueteElectronico, FacturaCompra,
//     NotaCredito/DebitoElectronica y ReciboElectronicoPago.
//   - Salta el bloque <ds:Signature>, que es base64 enorme y no aporta nada.
//   - Si un campo no está, devuelve null en vez de reventar. Un XML de una
//     versión futura debe degradar, no romper la pantalla.
//
// El dinero sale en unidades menores (céntimos), como todo Zentro.
// =====================================================================

export type CrInvoiceLine = {
  detalle: string;
  cantidad: number | null;
  unidad: string | null;
  montoTotalLineaMinor: number | null;
};

export type CrInvoice = {
  /** Nombre local del elemento raíz: FacturaElectronica, TiqueteElectronico… */
  tipo: string;
  /** Etiqueta legible en español para mostrarle al usuario. */
  tipoLabel: string;
  /** Clave de 50 dígitos. Es el identificador único del comprobante. */
  clave: string | null;
  consecutivo: string | null;
  /** Fecha de emisión en YYYY-MM-DD (se recorta del timestamp ISO). */
  fecha: string | null;
  emisorNombre: string | null;
  emisorCedula: string | null;
  receptorNombre: string | null;
  receptorCedula: string | null;
  moneda: string | null;
  totalVentaMinor: number | null;
  totalImpuestoMinor: number | null;
  totalComprobanteMinor: number | null;
  lineas: CrInvoiceLine[];
};

// ---------------------------------------------------------------------
// Parser mínimo de XML → árbol
// ---------------------------------------------------------------------
type Node = { name: string; children: Node[]; text: string };

/** Quita el prefijo de namespace: "ds:Signature" → "Signature". */
function localName(raw: string): string {
  const i = raw.indexOf(":");
  return i === -1 ? raw : raw.slice(i + 1);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    // El &amp; va de último para no re-decodificar lo ya decodificado.
    .replace(/&amp;/g, "&");
}

/**
 * Construye un árbol de nodos a partir del XML. Tolerante: no valida nada,
 * solo extrae estructura. Devuelve null si no encuentra un elemento raíz.
 */
function parseXml(xml: string): Node | null {
  // Fuera declaración, comentarios, DOCTYPE e instrucciones de proceso.
  let s = xml
    .replace(/<\?[\s\S]*?\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "");
  // El CDATA se convierte en texto plano ya escapado.
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, c) =>
    String(c).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
  );

  const root: Node = { name: "#root", children: [], text: "" };
  const stack: Node[] = [root];
  // La firma es base64 de decenas de KB y no aporta ningún dato útil.
  let skipDepth = 0;

  const tagRe = /<\s*(\/?)\s*([A-Za-z_][\w.\-:]*)([^>]*?)(\/?)\s*>/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(s)) !== null) {
    const [full, closing, rawName, , selfClose] = m;
    const name = localName(rawName);

    if (skipDepth === 0) {
      const text = s.slice(last, m.index);
      if (text.trim()) {
        const top = stack[stack.length - 1];
        top.text += decodeEntities(text);
      }
    }
    last = m.index + full.length;

    if (skipDepth > 0) {
      // Dentro de la firma: solo se lleva la cuenta para saber cuándo sale.
      if (closing) skipDepth--;
      else if (!selfClose) skipDepth++;
      continue;
    }

    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    if (name === "Signature") {
      if (!selfClose) skipDepth = 1;
      continue;
    }
    const node: Node = { name, children: [], text: "" };
    stack[stack.length - 1].children.push(node);
    if (!selfClose) stack.push(node);
  }

  return root.children[0] ?? null;
}

/** Primer hijo directo con ese nombre local. */
function child(node: Node | null, name: string): Node | null {
  if (!node) return null;
  return node.children.find((c) => c.name === name) ?? null;
}

/** Texto de un hijo directo, ya recortado. Null si no existe o va vacío. */
function childText(node: Node | null, name: string): string | null {
  const c = child(node, name);
  const t = c?.text.trim();
  return t ? t : null;
}

/**
 * Busca en profundidad el primer descendiente con ese nombre. Se usa solo
 * donde la ruta exacta cambió entre versiones (CodigoMoneda vivía suelto en
 * 4.2 y dentro de CodigoTipoMoneda desde 4.3).
 */
function deepText(node: Node | null, name: string): string | null {
  if (!node) return null;
  for (const c of node.children) {
    if (c.name === name && c.text.trim()) return c.text.trim();
    const found = deepText(c, name);
    if (found) return found;
  }
  return null;
}

/**
 * "96050.00" → 9605000 céntimos.
 *
 * No se reutiliza `toMinor` de lib/money porque aquí el formato viene fijado
 * por el esquema de Hacienda (punto decimal, sin separador de miles) y no
 * por lo que teclea un usuario.
 */
export function decimalToMinor(raw: string | null): number | null {
  if (!raw) return null;
  const t = raw.trim().replace(/\s/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

const TIPO_LABEL: Record<string, string> = {
  FacturaElectronica: "Factura electrónica",
  TiqueteElectronico: "Tiquete electrónico",
  FacturaElectronicaCompra: "Factura de compra",
  FacturaElectronicaExportacion: "Factura de exportación",
  NotaCreditoElectronica: "Nota de crédito",
  NotaDebitoElectronica: "Nota de débito",
  ReciboElectronicoPago: "Recibo electrónico de pago",
};

/**
 * Lee un comprobante electrónico costarricense. Devuelve null si el archivo
 * no parece uno (para poder decírselo al usuario con claridad).
 */
export function parseCrInvoiceXml(xml: string): CrInvoice | null {
  const root = parseXml(xml);
  if (!root) return null;
  if (!TIPO_LABEL[root.name]) return null;

  const emisor = child(root, "Emisor");
  const receptor = child(root, "Receptor");
  const resumen = child(root, "ResumenFactura");
  const detalle = child(root, "DetalleServicio");

  const lineas: CrInvoiceLine[] = (detalle?.children ?? [])
    .filter((c) => c.name === "LineaDetalle")
    .map((l) => {
      const cantidadRaw = childText(l, "Cantidad");
      const cantidad = cantidadRaw != null && /^-?\d+(\.\d+)?$/.test(cantidadRaw) ? Number(cantidadRaw) : null;
      return {
        detalle: childText(l, "Detalle") ?? "",
        cantidad,
        unidad: childText(l, "UnidadMedida"),
        montoTotalLineaMinor: decimalToMinor(childText(l, "MontoTotalLinea")),
      };
    })
    .filter((l) => l.detalle);

  const fechaRaw = childText(root, "FechaEmision");
  const fecha = fechaRaw && /^\d{4}-\d{2}-\d{2}/.test(fechaRaw) ? fechaRaw.slice(0, 10) : null;

  return {
    tipo: root.name,
    tipoLabel: TIPO_LABEL[root.name],
    clave: childText(root, "Clave"),
    consecutivo: childText(root, "NumeroConsecutivo"),
    fecha,
    emisorNombre: childText(emisor, "Nombre"),
    emisorCedula: childText(child(emisor, "Identificacion"), "Numero"),
    receptorNombre: childText(receptor, "Nombre"),
    receptorCedula: childText(child(receptor, "Identificacion"), "Numero"),
    moneda: deepText(resumen, "CodigoMoneda"),
    totalVentaMinor: decimalToMinor(childText(resumen, "TotalVenta")),
    totalImpuestoMinor: decimalToMinor(childText(resumen, "TotalImpuesto")),
    totalComprobanteMinor: decimalToMinor(childText(resumen, "TotalComprobante")),
    lineas,
  };
}

/**
 * Resume las líneas en una descripción corta para el gasto.
 * "Cemento 50kg, Arena m³ y 3 artículos más"
 */
export function describeCrInvoice(inv: CrInvoice): string {
  const nombres = inv.lineas.map((l) => l.detalle.trim()).filter(Boolean);
  if (nombres.length === 0) return inv.emisorNombre ?? "Compra";
  if (nombres.length === 1) return nombres[0];
  if (nombres.length === 2) return `${nombres[0]} y ${nombres[1]}`;
  return `${nombres[0]}, ${nombres[1]} y ${nombres.length - 2} artículo(s) más`;
}

/**
 * ¿El comprobante está a nombre del negocio?
 *
 * Importa de verdad: un tiquete electrónico o una factura sin la cédula del
 * comprador NO respalda el crédito de IVA ni el gasto deducible. Vale más
 * avisarlo al registrar el gasto que descubrirlo en la declaración.
 *
 * Compara solo dígitos: las cédulas se escriben con guiones de mil formas.
 */
export function isForTaxId(inv: CrInvoice, orgTaxId: string | null | undefined): boolean | null {
  const mine = (orgTaxId ?? "").replace(/\D/g, "");
  const theirs = (inv.receptorCedula ?? "").replace(/\D/g, "");
  if (!mine || !theirs) return null; // No se puede saber: no se afirma nada.
  return mine === theirs;
}
