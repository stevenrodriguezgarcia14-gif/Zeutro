import { describe, expect, it } from "vitest";
import { matches, normalize } from "./search";

describe("normalize", () => {
  it("quita acentos y baja a minúsculas", () => {
    expect(normalize("Sofía")).toBe("sofia");
    expect(normalize("LÓPEZ")).toBe("lopez");
    expect(normalize("Ñandú")).toBe("nandu");
  });
});

describe("matches", () => {
  it("encuentra sin acentos lo que está escrito con acentos", () => {
    expect(matches("sofia", "Boutique Sofía")).toBe(true);
    expect(matches("lopez", "Ana López")).toBe(true);
    expect(matches("cafe", "Café premium")).toBe(true);
  });
  it("busca en varios campos e ignora nulos", () => {
    expect(matches("ana", null, undefined, "Ana López")).toBe(true);
    expect(matches("xyz", "Ana López", null)).toBe(false);
  });
  it("término vacío coincide con todo", () => {
    expect(matches("", "cualquier cosa")).toBe(true);
  });
});
