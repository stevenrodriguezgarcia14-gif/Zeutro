import { escapeHtml } from "@/lib/email";
import { formatMoney } from "@/lib/money";
import { groupLineItems, type LineItem } from "@/components/LineItems";

/**
 * Correo de una cotización o una factura para enviárselo al cliente.
 *
 * Va a nombre del NEGOCIO, no de Zentro: quien lo recibe es el cliente de la
 * usuaria y tiene que ver el nombre de ella. Zentro solo aparece como una
 * línea discreta al pie, igual que en el PDF.
 *
 * Todo lo que viene de la base se escapa: un cliente que se llame
 * `<script>` no debe poder inyectar nada en el correo de nadie.
 */
export type DocEmailInput = {
  kind: "quotation" | "invoice";
  orgName: string;
  orgLegalName?: string | null;
  orgTaxId?: string | null;
  customerName: string;
  number: string;
  issueDate: string;
  /** Válida hasta (cotización) o vence (factura). */
  dueDate: string;
  currency: string;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  items: LineItem[];
  notes?: string | null;
  /** Mensaje personal que escribe la usuaria antes del detalle. */
  message?: string | null;
  paymentLink?: string | null;
};

function row(label: string, value: string, bold = false) {
  const w = bold ? "font-weight:bold;color:#0f172a" : "color:#475569";
  return `<tr><td style="padding:3px 0;font-size:14px;${w}">${label}</td><td style="padding:3px 0;text-align:right;font-size:14px;${w}">${value}</td></tr>`;
}

export function renderDocumentEmail(d: DocEmailInput): { subject: string; html: string } {
  const esCotizacion = d.kind === "quotation";
  const titulo = esCotizacion ? "Cotización" : "Factura";
  const fechaLabel = esCotizacion ? "Válida hasta" : "Vence";

  const grupos = groupLineItems(d.items);
  const conPartidas = grupos.some((g) => g.section);

  const filas = grupos
    .map((g) => {
      const encabezado = conPartidas && g.section
        ? `<tr><td colspan="3" style="padding:10px 0 4px;font-size:12px;font-weight:bold;color:#334155;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(g.section)}</td></tr>`
        : "";
      const lineas = g.lines
        .map((l) => {
          const cant = `${l.quantity}${l.unit ? " " + escapeHtml(l.unit) : ""}`;
          return `<tr>
            <td style="padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a">${escapeHtml(l.description)}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;text-align:right;white-space:nowrap">${escapeHtml(cant)}</td>
            <td style="padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#0f172a;text-align:right;white-space:nowrap">${escapeHtml(formatMoney(l.line_total_minor, d.currency))}</td>
          </tr>`;
        })
        .join("");
      const sub = conPartidas && g.section && g.lines.length > 1
        ? `<tr><td colspan="2" style="padding:2px 0 8px;text-align:right;font-size:12px;color:#94a3b8">Subtotal ${escapeHtml(g.section)}</td><td style="padding:2px 0 8px;text-align:right;font-size:12px;color:#475569;font-weight:bold">${escapeHtml(formatMoney(g.subtotal, d.currency))}</td></tr>`
        : "";
      return encabezado + lineas + sub;
    })
    .join("");

  const mensaje = d.message?.trim()
    ? `<p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.6;white-space:pre-wrap">${escapeHtml(d.message.trim())}</p>`
    : "";

  const notas = d.notes?.trim()
    ? `<div style="margin-top:20px;padding-top:14px;border-top:1px solid #e2e8f0">
         <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#334155">${esCotizacion ? "Alcance y condiciones" : "Notas"}</p>
         <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;white-space:pre-wrap">${escapeHtml(d.notes.trim())}</p>
       </div>`
    : "";

  const boton = d.paymentLink
    ? `<div style="margin-top:20px"><a href="${encodeURI(d.paymentLink)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:bold">Pagar en línea</a></div>`
    : "";

  const emisor = [d.orgLegalName, d.orgTaxId ? `Cédula: ${d.orgTaxId}` : null]
    .filter(Boolean)
    .map((x) => `<div style="font-size:12px;color:#94a3b8">${escapeHtml(String(x))}</div>`)
    .join("");

  const html = `<div style="background:#f1f5f9;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
  <table align="center" width="100%" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;border-collapse:separate">
    <tr><td style="padding:22px 24px 0">
      <table width="100%" style="border-collapse:collapse"><tr>
        <td style="vertical-align:top">
          <div style="font-size:18px;font-weight:bold;color:#0f172a">${escapeHtml(d.orgName)}</div>
          ${emisor}
        </td>
        <td style="vertical-align:top;text-align:right">
          <div style="font-size:16px;font-weight:bold;color:#0f172a;letter-spacing:.06em">${titulo.toUpperCase()}</div>
          <div style="font-size:13px;color:#64748b">${escapeHtml(d.number)}</div>
        </td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:18px 24px 0">
      <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em">Para</p>
      <p style="margin:0 0 14px;font-size:15px;font-weight:bold;color:#0f172a">${escapeHtml(d.customerName)}</p>
      ${mensaje}
      <p style="margin:0 0 14px;font-size:13px;color:#64748b">Fecha: ${escapeHtml(d.issueDate)} &middot; ${fechaLabel}: ${escapeHtml(d.dueDate)}</p>
    </td></tr>

    <tr><td style="padding:0 24px">
      <table width="100%" style="border-collapse:collapse">
        <tr>
          <td style="padding:0 0 6px;border-bottom:2px solid #e2e8f0;font-size:12px;color:#94a3b8">Concepto</td>
          <td style="padding:0 8px 6px;border-bottom:2px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:right">Cant.</td>
          <td style="padding:0 0 6px;border-bottom:2px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:right">Importe</td>
        </tr>
        ${filas}
      </table>
    </td></tr>

    <tr><td style="padding:16px 24px 0">
      <table align="right" style="border-collapse:collapse;min-width:220px">
        ${row("Subtotal", formatMoney(d.subtotalMinor, d.currency))}
        ${row("Impuestos", formatMoney(d.taxMinor, d.currency))}
        ${row("Total", formatMoney(d.totalMinor, d.currency), true)}
      </table>
      <div style="clear:both"></div>
    </td></tr>

    <tr><td style="padding:8px 24px 24px">${notas}${boton}</td></tr>
    <tr><td style="padding:14px 24px;border-top:1px solid #e2e8f0;color:#cbd5e1;font-size:11px">Enviado con Zentro</td></tr>
  </table>
</div>`;

  return { subject: `${titulo} ${d.number} · ${d.orgName}`, html };
}
