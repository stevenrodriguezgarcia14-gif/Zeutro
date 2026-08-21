import { formatMoney } from "@/lib/money";

export type LineItem = {
  id: string;
  section?: string | null;
  description: string;
  quantity: number;
  unit?: string | null;
  unit_price_minor: number;
  line_total_minor: number;
  position?: number | null;
  created_at?: string | null;
};

/**
 * Ordena las líneas y las agrupa por partida (capítulo), respetando el orden
 * en que aparece cada partida por primera vez.
 *
 * Las líneas creadas antes de la migración 0045 tienen `position = 0` y
 * `section = null`: caen todas en un único grupo sin nombre y se ordenan por
 * `created_at`, o sea que se ven exactamente igual que antes.
 */
export function groupLineItems(items: LineItem[]): { section: string | null; lines: LineItem[]; subtotal: number }[] {
  const sorted = [...items].sort((a, b) => {
    const pa = a.position ?? 0;
    const pb = b.position ?? 0;
    if (pa !== pb) return pa - pb;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });

  const groups: { section: string | null; lines: LineItem[]; subtotal: number }[] = [];
  for (const it of sorted) {
    const name = it.section?.trim() || null;
    const last = groups.length > 0 ? groups[groups.length - 1] : null;
    // Se agrupa por partidas CONTIGUAS: si el usuario ordenó sus líneas
    // intercalando capítulos, se respeta su orden en vez de reordenárselo.
    if (last && last.section === name) {
      last.lines.push(it);
      last.subtotal += it.line_total_minor;
    } else {
      groups.push({ section: name, lines: [it], subtotal: it.line_total_minor });
    }
  }
  return groups;
}

/** ¿Vale la pena mostrar los encabezados de partida y sus subtotales? */
function hasSections(groups: { section: string | null }[]) {
  return groups.some((g) => g.section);
}

/**
 * Tabla de líneas de una cotización o factura, agrupada por partidas.
 * `variant="print"` usa el estilo sobrio del PDF.
 */
export function LineItemsTable({
  items,
  currency,
  variant = "app",
}: {
  items: LineItem[];
  currency: string;
  variant?: "app" | "print";
}) {
  const groups = groupLineItems(items);
  const showSections = hasSections(groups);
  const print = variant === "print";

  const th = print
    ? "py-2 font-medium"
    : "px-4 py-2 font-medium";
  const td = print ? "py-2" : "px-4 py-2";

  return (
    <table className={print ? "mt-8 w-full text-sm" : "w-full text-sm"}>
      <thead className={print ? "" : "bg-slate-50"}>
        <tr className={print ? "border-b-2 border-slate-200 text-left text-slate-500" : "text-left text-slate-500"}>
          <th className={th}>Concepto</th>
          <th className={`${th} text-right`}>Cant.</th>
          <th className={th}>Unidad</th>
          <th className={`${th} text-right`}>Precio</th>
          <th className={`${th} text-right`}>Importe</th>
        </tr>
      </thead>
      <tbody className={print ? "" : "divide-y divide-slate-100"}>
        {groups.map((g, gi) => (
          <Group key={`${g.section ?? "sin"}-${gi}`} group={g} currency={currency} showSections={showSections} td={td} print={print} />
        ))}
      </tbody>
    </table>
  );
}

function Group({
  group,
  currency,
  showSections,
  td,
  print,
}: {
  group: { section: string | null; lines: LineItem[]; subtotal: number };
  currency: string;
  showSections: boolean;
  td: string;
  print: boolean;
}) {
  return (
    <>
      {showSections && group.section && (
        <tr className={print ? "border-b border-slate-200" : "bg-slate-50"}>
          <td colSpan={5} className={`${td} text-xs font-semibold uppercase tracking-wide text-slate-600`}>
            {group.section}
          </td>
        </tr>
      )}
      {group.lines.map((it) => (
        <tr key={it.id} className={print ? "border-b border-slate-100" : ""}>
          <td className={`${td} ${print ? "text-slate-800" : "text-slate-900"}`}>{it.description}</td>
          <td className={`${td} text-right text-slate-600`}>{it.quantity}</td>
          <td className={`${td} text-slate-500`}>{it.unit ?? ""}</td>
          <td className={`${td} text-right text-slate-600`}>{formatMoney(it.unit_price_minor, currency)}</td>
          <td className={`${td} text-right ${print ? "text-slate-900" : "text-slate-900"}`}>{formatMoney(it.line_total_minor, currency)}</td>
        </tr>
      ))}
      {showSections && group.section && group.lines.length > 1 && (
        <tr className={print ? "border-b border-slate-100" : ""}>
          <td colSpan={4} className={`${td} text-right text-xs text-slate-400`}>Subtotal {group.section}</td>
          <td className={`${td} text-right text-xs font-medium text-slate-600`}>{formatMoney(group.subtotal, currency)}</td>
        </tr>
      )}
    </>
  );
}
