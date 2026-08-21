/**
 * Aviso honesto sobre lo que Zentro NO hace en materia fiscal.
 *
 * Zentro no emite comprobantes electrónicos ante ninguna autoridad tributaria:
 * las facturas que genera son documentos de cobro y control interno, con folio
 * propio (F-1, F-2…). En países donde la factura electrónica es obligatoria
 * —Costa Rica entre ellos— el usuario tiene que seguir emitiéndola con su
 * facturador autorizado.
 *
 * Esto se dice DENTRO de la app, en los cuatro momentos donde alguien podría
 * asumir lo contrario (alta del negocio, módulo de Facturas, Configuración
 * fiscal y el PDF que recibe el cliente), en vez de dejarlo en manos de que
 * el fundador se acuerde de aclararlo en cada venta. Un usuario que lo
 * descubre solo se siente engañado; uno al que se le dice de entrada, no.
 *
 * Mismo criterio que ya se usa con las Cuentas ("Zentro NO se conecta a tu
 * banco"): las limitaciones se declaran, no se esconden.
 */

/** Texto del pie del PDF. Lo lee el CLIENTE, así que es neutro y breve. */
export const FISCAL_PRINT_NOTE =
  "Documento de cobro. No sustituye el comprobante fiscal electrónico donde la ley lo exija.";

export function FiscalNotice({ variant = "inline" }: { variant?: "inline" | "card" }) {
  if (variant === "inline") {
    return (
      <p className="text-xs text-slate-500">
        Zentro <b>no emite factura electrónica</b> ante la autoridad tributaria. Estas facturas son tu control de cobro:
        si tu país la exige, seguí emitiéndola con tu facturador autorizado.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-600">
        <b>Zentro no es un facturador electrónico.</b> No transmite comprobantes a Hacienda ni a ninguna autoridad
        tributaria. Lo que genera son documentos de cobro con folio propio, para que sepas quién te debe y cuánto. Si
        en tu país la factura electrónica es obligatoria, seguí usando tu facturador autorizado para el comprobante
        fiscal.
      </p>
    </div>
  );
}
