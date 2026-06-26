import { describe, it, expect } from "vitest";
import { defaultVatPct } from "./tax";

describe("defaultVatPct", () => {
  it("devuelve la tasa estándar por país", () => {
    expect(defaultVatPct("MX")).toBe(16);
    expect(defaultVatPct("ES")).toBe(21);
    expect(defaultVatPct("CO")).toBe(19);
  });
  it("es insensible a mayúsculas/minúsculas", () => {
    expect(defaultVatPct("mx")).toBe(16);
  });
  it("devuelve 0 para país desconocido o vacío", () => {
    expect(defaultVatPct("ZZ")).toBe(0);
    expect(defaultVatPct(null)).toBe(0);
    expect(defaultVatPct(undefined)).toBe(0);
  });
});
