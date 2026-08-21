import { describe, it, expect } from "vitest";
import { groupLineItems, type LineItem } from "./LineItems";

function line(p: Partial<LineItem> & { id: string }): LineItem {
  return {
    description: "línea",
    quantity: 1,
    unit_price_minor: 1000,
    line_total_minor: 1000,
    ...p,
  };
}

describe("groupLineItems", () => {
  it("respeta el orden de `position` aunque lleguen desordenadas", () => {
    const g = groupLineItems([
      line({ id: "c", position: 2, description: "tercera" }),
      line({ id: "a", position: 0, description: "primera" }),
      line({ id: "b", position: 1, description: "segunda" }),
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].lines.map((l) => l.description)).toEqual(["primera", "segunda", "tercera"]);
  });

  it("agrupa por partida y suma el subtotal de cada una", () => {
    const g = groupLineItems([
      line({ id: "1", position: 0, section: "Demolición", line_total_minor: 5000 }),
      line({ id: "2", position: 1, section: "Demolición", line_total_minor: 2500 }),
      line({ id: "3", position: 2, section: "Acabados", line_total_minor: 9000 }),
    ]);
    expect(g.map((x) => x.section)).toEqual(["Demolición", "Acabados"]);
    expect(g[0].subtotal).toBe(7500);
    expect(g[1].subtotal).toBe(9000);
  });

  it("no reordena partidas intercaladas a propósito: agrupa por contigüidad", () => {
    const g = groupLineItems([
      line({ id: "1", position: 0, section: "A" }),
      line({ id: "2", position: 1, section: "B" }),
      line({ id: "3", position: 2, section: "A" }),
    ]);
    expect(g.map((x) => x.section)).toEqual(["A", "B", "A"]);
  });

  it("trata la partida vacía o con espacios como 'sin agrupar'", () => {
    const g = groupLineItems([
      line({ id: "1", position: 0, section: "   " }),
      line({ id: "2", position: 1, section: null }),
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].section).toBeNull();
    expect(g[0].lines).toHaveLength(2);
  });

  it("líneas viejas (sin position ni section) se ordenan por created_at y quedan en un solo grupo", () => {
    const g = groupLineItems([
      line({ id: "2", created_at: "2026-01-02T10:00:00Z", description: "segunda" }),
      line({ id: "1", created_at: "2026-01-01T10:00:00Z", description: "primera" }),
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].section).toBeNull();
    expect(g[0].lines.map((l) => l.description)).toEqual(["primera", "segunda"]);
  });

  it("no muta el arreglo que recibe", () => {
    const items = [line({ id: "b", position: 1 }), line({ id: "a", position: 0 })];
    groupLineItems(items);
    expect(items.map((i) => i.id)).toEqual(["b", "a"]);
  });
});
