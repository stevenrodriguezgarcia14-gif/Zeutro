import { describe, it, expect } from "vitest";
import { normalizeSubtitle, SUBTITLE_MAX } from "./products";

describe("normalizeSubtitle", () => {
  it("vacío o solo espacios ⇒ null (para no dejar hueco bajo el nombre)", () => {
    expect(normalizeSubtitle("")).toBeNull();
    expect(normalizeSubtitle("   ")).toBeNull();
    expect(normalizeSubtitle("\n\t ")).toBeNull();
    expect(normalizeSubtitle(undefined)).toBeNull();
    expect(normalizeSubtitle(null)).toBeNull();
    expect(normalizeSubtitle(42)).toBeNull(); // un File en el FormData, p. ej.
  });

  it("recorta y colapsa espacios, para que quepa en una línea", () => {
    expect(normalizeSubtitle("  Productos elaborados  para venta \n individual ")).toBe(
      "Productos elaborados para venta individual",
    );
  });

  it("limita el largo sin cortar dejando espacios sueltos", () => {
    const largo = "a".repeat(SUBTITLE_MAX + 40);
    expect(normalizeSubtitle(largo)).toHaveLength(SUBTITLE_MAX);
    expect(normalizeSubtitle("x".repeat(SUBTITLE_MAX - 1) + "   fin")!.endsWith(" ")).toBe(false);
  });

  it("respeta acentos, emojis y texto normal del emprendedor", () => {
    expect(normalizeSubtitle("Helados artesanales 🍦 hechos hoy")).toBe("Helados artesanales 🍦 hechos hoy");
  });
});
