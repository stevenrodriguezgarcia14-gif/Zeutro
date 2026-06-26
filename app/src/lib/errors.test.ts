import { describe, it, expect, vi } from "vitest";
import { safeError } from "./errors";

// Silenciar el logger en estas pruebas (errors.ts loggea los desconocidos).
vi.mock("@/lib/log", () => ({ report: () => {} }));

describe("safeError", () => {
  it("muestra mensajes de negocio propios (en español)", () => {
    expect(safeError({ message: "El pago excede el saldo de la factura" })).toContain("excede");
    expect(safeError({ message: "Stock insuficiente para el producto" })).toContain("Stock");
  });

  it("traduce códigos de Postgres conocidos", () => {
    expect(safeError({ code: "23505", message: "duplicate key value violates unique constraint" }))
      .toBe("Ya existe un registro con esos datos.");
    expect(safeError({ code: "23502", message: "null value in column ..." }))
      .toBe("Falta un dato obligatorio.");
  });

  it("convierte errores de permisos/RLS en mensaje seguro", () => {
    expect(safeError({ message: "new row violates row-level security policy" }))
      .toBe("No tienes permiso para realizar esta acción.");
  });

  it("NO filtra internals desconocidos: devuelve el fallback", () => {
    const out = safeError({ message: "syntax error at or near SELECT pg_catalog..." });
    expect(out).toBe("Ocurrió un error. Inténtalo de nuevo.");
  });

  it("usa el fallback personalizado cuando se provee", () => {
    expect(safeError({ message: "weird internal thing" }, "No se pudo generar el folio."))
      .toBe("No se pudo generar el folio.");
  });

  it("tolera null/undefined", () => {
    expect(typeof safeError(null)).toBe("string");
    expect(typeof safeError(undefined)).toBe("string");
  });
});
