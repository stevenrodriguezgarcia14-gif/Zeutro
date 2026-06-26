import { describe, it, expect } from "vitest";
import { netOfTaxInclusive, taxOfInclusive } from "./income";

describe("netOfTaxInclusive", () => {
  it("sin IVA (rate 0) el neto es el bruto", () => {
    expect(netOfTaxInclusive(10000, 0)).toBe(10000);
    expect(netOfTaxInclusive(10000, null)).toBe(10000);
    expect(netOfTaxInclusive(10000, undefined)).toBe(10000);
  });
  it("netea IVA del 16% (1600 bps) de un monto IVA-incluido", () => {
    // 11600 con IVA incluido del 16% → neto 10000
    expect(netOfTaxInclusive(11600, 1600)).toBe(10000);
  });
});

describe("taxOfInclusive", () => {
  it("el IVA es el complemento del neto", () => {
    expect(taxOfInclusive(11600, 1600)).toBe(1600);
  });
  it("neto + IVA reconstruye el bruto", () => {
    const gross = 12345;
    const rate = 1900;
    expect(netOfTaxInclusive(gross, rate) + taxOfInclusive(gross, rate)).toBe(gross);
  });
  it("sin IVA el impuesto es 0", () => {
    expect(taxOfInclusive(10000, 0)).toBe(0);
  });
});
