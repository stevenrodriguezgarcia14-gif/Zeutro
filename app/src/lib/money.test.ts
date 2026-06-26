import { describe, it, expect } from "vitest";
import { toMinor, fromMinor, formatMoney } from "./money";

describe("toMinor", () => {
  it("convierte decimales a centavos", () => {
    expect(toMinor("1234.50")).toBe(123450);
    expect(toMinor(10)).toBe(1000);
  });
  it("ignora separadores y símbolos", () => {
    expect(toMinor("$1,234.50")).toBe(123450);
  });
  it("devuelve 0 para entradas no numéricas", () => {
    expect(toMinor("abc")).toBe(0);
    expect(toMinor("")).toBe(0);
  });
  it("redondea correctamente (sin errores de float)", () => {
    expect(toMinor("0.1")).toBe(10);
    expect(toMinor("19.99")).toBe(1999);
  });
});

describe("fromMinor", () => {
  it("convierte centavos a decimal", () => {
    expect(fromMinor(123450)).toBe(1234.5);
    expect(fromMinor(0)).toBe(0);
  });
  it("tolera null/undefined", () => {
    // @ts-expect-error probando robustez ante valores nulos
    expect(fromMinor(null)).toBe(0);
  });
});

describe("formatMoney", () => {
  it("formatea con moneda", () => {
    const s = formatMoney(123450, "USD", "en-US");
    expect(s).toContain("1,234.50");
  });
  it("tolera null", () => {
    // @ts-expect-error probando robustez
    expect(typeof formatMoney(null, "USD", "en-US")).toBe("string");
  });
});
