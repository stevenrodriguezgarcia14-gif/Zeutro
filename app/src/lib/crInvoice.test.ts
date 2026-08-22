import { describe, it, expect } from "vitest";
import { parseCrInvoiceXml, describeCrInvoice, isForTaxId, decimalToMinor } from "./crInvoice";

// Comprobante v4.4 como el que manda una ferretería por correo: con firma
// (que hay que saltar), con namespace por defecto y con prefijo ds: en la
// firma, con acentos y con un & escapado en el nombre del emisor.
const FACTURA_44 = `<?xml version="1.0" encoding="UTF-8"?>
<FacturaElectronica xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica"
                    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Clave>50620082600310112345600100001010000000123456789012</Clave>
  <CodigoActividadEmisor>475201</CodigoActividadEmisor>
  <NumeroConsecutivo>00100001010000000123</NumeroConsecutivo>
  <FechaEmision>2026-08-20T10:15:00-06:00</FechaEmision>
  <Emisor>
    <Nombre>FERRETER&#205;A EL MARTILLO &amp; CIA S.A.</Nombre>
    <Identificacion>
      <Tipo>02</Tipo>
      <Numero>3101123456</Numero>
    </Identificacion>
    <CorreoElectronico>ventas@martillo.cr</CorreoElectronico>
  </Emisor>
  <Receptor>
    <Nombre>MARIA JIMENEZ ROJAS</Nombre>
    <Identificacion>
      <Tipo>01</Tipo>
      <Numero>112345678</Numero>
    </Identificacion>
  </Receptor>
  <CondicionVenta>01</CondicionVenta>
  <DetalleServicio>
    <LineaDetalle>
      <NumeroLinea>1</NumeroLinea>
      <Cantidad>10</Cantidad>
      <UnidadMedida>Sp</UnidadMedida>
      <Detalle>Cemento gris 50 kg</Detalle>
      <PrecioUnitario>8500.00</PrecioUnitario>
      <MontoTotal>85000.00</MontoTotal>
      <SubTotal>85000.00</SubTotal>
      <Impuesto><Codigo>01</Codigo><Tarifa>13.00</Tarifa><Monto>11050.00</Monto></Impuesto>
      <MontoTotalLinea>96050.00</MontoTotalLinea>
    </LineaDetalle>
    <LineaDetalle>
      <NumeroLinea>2</NumeroLinea>
      <Cantidad>3</Cantidad>
      <UnidadMedida>m3</UnidadMedida>
      <Detalle>Arena de r&#237;o</Detalle>
      <PrecioUnitario>18000.00</PrecioUnitario>
      <MontoTotal>54000.00</MontoTotal>
      <SubTotal>54000.00</SubTotal>
      <MontoTotalLinea>61020.00</MontoTotalLinea>
    </LineaDetalle>
  </DetalleServicio>
  <ResumenFactura>
    <CodigoTipoMoneda>
      <CodigoMoneda>CRC</CodigoMoneda>
      <TipoCambio>1.00000</TipoCambio>
    </CodigoTipoMoneda>
    <TotalMercanciasGravadas>139000.00</TotalMercanciasGravadas>
    <TotalGravado>139000.00</TotalGravado>
    <TotalVenta>139000.00</TotalVenta>
    <TotalDescuentos>0.00</TotalDescuentos>
    <TotalVentaNeta>139000.00</TotalVentaNeta>
    <TotalImpuesto>18070.00</TotalImpuesto>
    <TotalComprobante>157070.00</TotalComprobante>
  </ResumenFactura>
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:SignedInfo>
      <ds:Reference URI=""><ds:DigestValue>Tm9tYnJl</ds:DigestValue></ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>bWlmaXJtYQ==</ds:SignatureValue>
    <ds:Object><Nombre>ESTO NO DEBE LEERSE</Nombre></ds:Object>
  </ds:Signature>
</FacturaElectronica>`;

describe("parseCrInvoiceXml", () => {
  const inv = parseCrInvoiceXml(FACTURA_44)!;

  it("reconoce el tipo de comprobante", () => {
    expect(inv).not.toBeNull();
    expect(inv.tipo).toBe("FacturaElectronica");
    expect(inv.tipoLabel).toBe("Factura electrónica");
  });

  it("lee la clave, el consecutivo y la fecha sin la hora", () => {
    expect(inv.clave).toBe("50620082600310112345600100001010000000123456789012");
    expect(inv.consecutivo).toBe("00100001010000000123");
    expect(inv.fecha).toBe("2026-08-20");
  });

  it("distingue Emisor de Receptor (los dos tienen <Nombre>)", () => {
    expect(inv.emisorNombre).toBe("FERRETERÍA EL MARTILLO & CIA S.A.");
    expect(inv.emisorCedula).toBe("3101123456");
    expect(inv.receptorNombre).toBe("MARIA JIMENEZ ROJAS");
    expect(inv.receptorCedula).toBe("112345678");
  });

  it("convierte los totales a céntimos", () => {
    expect(inv.totalVentaMinor).toBe(13_900_000);
    expect(inv.totalImpuestoMinor).toBe(1_807_000);
    expect(inv.totalComprobanteMinor).toBe(15_707_000);
  });

  it("saca la moneda aunque esté anidada en CodigoTipoMoneda", () => {
    expect(inv.moneda).toBe("CRC");
  });

  it("lee las líneas con cantidad, unidad y total", () => {
    expect(inv.lineas).toHaveLength(2);
    expect(inv.lineas[0]).toEqual({
      detalle: "Cemento gris 50 kg",
      cantidad: 10,
      unidad: "Sp",
      montoTotalLineaMinor: 9_605_000,
    });
    expect(inv.lineas[1].detalle).toBe("Arena de río");
  });

  it("ignora por completo el bloque de la firma", () => {
    // Dentro de <ds:Signature> hay un <Nombre> trampa: no debe contaminar nada.
    expect(JSON.stringify(inv)).not.toContain("ESTO NO DEBE LEERSE");
  });

  it("resume las líneas en una descripción usable", () => {
    expect(describeCrInvoice(inv)).toBe("Cemento gris 50 kg y Arena de río");
  });
});

describe("otras versiones y tipos", () => {
  it("lee un tiquete electrónico v4.3 sin Receptor", () => {
    const xml = `<TiqueteElectronico xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.3/tiqueteElectronico">
      <Clave>506ABC</Clave>
      <FechaEmision>2026-07-01T08:00:00-06:00</FechaEmision>
      <Emisor><Nombre>EPA</Nombre><Identificacion><Numero>3101999888</Numero></Identificacion></Emisor>
      <ResumenFactura><TotalComprobante>12500.50</TotalComprobante></ResumenFactura>
    </TiqueteElectronico>`;
    const t = parseCrInvoiceXml(xml)!;
    expect(t.tipoLabel).toBe("Tiquete electrónico");
    expect(t.emisorNombre).toBe("EPA");
    expect(t.receptorCedula).toBeNull();
    expect(t.totalComprobanteMinor).toBe(1_250_050);
    // Sin líneas, la descripción cae al nombre del emisor.
    expect(describeCrInvoice(t)).toBe("EPA");
  });

  it("lee la moneda suelta de un esquema viejo (sin CodigoTipoMoneda)", () => {
    const xml = `<FacturaElectronica xmlns="https://tribunet.hacienda.go.cr/docs/esquemas/2017/v4.2/facturaElectronica">
      <Emisor><Nombre>X</Nombre></Emisor>
      <ResumenFactura><CodigoMoneda>USD</CodigoMoneda><TotalComprobante>100.00</TotalComprobante></ResumenFactura>
    </FacturaElectronica>`;
    expect(parseCrInvoiceXml(xml)!.moneda).toBe("USD");
  });

  it("no revienta con campos ausentes", () => {
    const xml = `<NotaCreditoElectronica xmlns="x"><Clave>1</Clave></NotaCreditoElectronica>`;
    const n = parseCrInvoiceXml(xml)!;
    expect(n.tipoLabel).toBe("Nota de crédito");
    expect(n.totalComprobanteMinor).toBeNull();
    expect(n.lineas).toEqual([]);
  });

  it("devuelve null si el archivo no es un comprobante costarricense", () => {
    expect(parseCrInvoiceXml("<Invoice><Total>5</Total></Invoice>")).toBeNull();
    expect(parseCrInvoiceXml("esto no es xml")).toBeNull();
    expect(parseCrInvoiceXml("")).toBeNull();
  });
});

describe("isForTaxId", () => {
  const inv = parseCrInvoiceXml(FACTURA_44)!;

  it("acepta la cédula aunque venga con guiones", () => {
    expect(isForTaxId(inv, "1-1234-5678")).toBe(true);
  });
  it("detecta que el comprobante es de otra persona", () => {
    expect(isForTaxId(inv, "3101999999")).toBe(false);
  });
  it("no afirma nada si falta algún dato", () => {
    expect(isForTaxId(inv, null)).toBeNull();
    expect(isForTaxId(inv, "")).toBeNull();
    const sinReceptor = parseCrInvoiceXml(
      `<TiqueteElectronico xmlns="x"><Emisor><Nombre>Y</Nombre></Emisor></TiqueteElectronico>`,
    )!;
    expect(isForTaxId(sinReceptor, "112345678")).toBeNull();
  });
});

describe("decimalToMinor", () => {
  it("convierte y redondea correctamente", () => {
    expect(decimalToMinor("0.00")).toBe(0);
    expect(decimalToMinor("1")).toBe(100);
    expect(decimalToMinor("1234.567")).toBe(123457);
    expect(decimalToMinor("157070.00")).toBe(15707000);
  });
  it("rechaza basura sin explotar", () => {
    expect(decimalToMinor(null)).toBeNull();
    expect(decimalToMinor("")).toBeNull();
    expect(decimalToMinor("1.234,56")).toBeNull();
    expect(decimalToMinor("abc")).toBeNull();
  });
});
