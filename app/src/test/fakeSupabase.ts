/**
 * Supabase en memoria para probar el cron de verdad (no una copia de su
 * lógica). Implementa el subconjunto de PostgREST que usa la ruta:
 * select con filtros, order, range (paginación), insert con índices únicos,
 * update y delete por eq, y rpc.
 *
 * Lo importante que reproduce fielmente:
 *  - los índices únicos parciales de `reminder_log` (el candado que hace
 *    imposible enviar dos veces el mismo período);
 *  - el tope de filas por página, para que el test note si el código deja de
 *    paginar y se queda con las primeras 1000 filas.
 */

export type Row = Record<string, unknown>;

type Filter = { op: string; col: string; value: unknown };

/** Los índices únicos reales de reminder_log (migraciones 0037 y 0038). */
const UNIQUE_INDEXES: { kind: string; cols: string[] }[] = [
  { kind: "collection", cols: ["invoice_id", "period"] },
  { kind: "upcoming", cols: ["invoice_id", "period"] },
  { kind: "weekly", cols: ["organization_id", "period", "recipient"] },
  { kind: "monthly", cols: ["organization_id", "period", "recipient"] },
];

function passes(row: Row, f: Filter): boolean {
  const v = row[f.col];
  switch (f.op) {
    case "eq":
      return v === f.value;
    case "gt":
      return (v as never) > (f.value as never);
    case "gte":
      return (v as never) >= (f.value as never);
    case "lt":
      return (v as never) < (f.value as never);
    case "lte":
      return (v as never) <= (f.value as never);
    case "in":
      return (f.value as unknown[]).includes(v);
    default:
      throw new Error(`Filtro no soportado en el fake: ${f.op}`);
  }
}

class Query implements PromiseLike<{ data: Row[] | null; error: unknown }> {
  private filters: Filter[] = [];
  private orderBy: string | null = null;
  private slice: [number, number] | null = null;

  constructor(
    private readonly db: FakeDb,
    private readonly table: string,
    private readonly select: string,
  ) {}

  eq(col: string, value: unknown) { this.filters.push({ op: "eq", col, value }); return this; }
  gt(col: string, value: unknown) { this.filters.push({ op: "gt", col, value }); return this; }
  gte(col: string, value: unknown) { this.filters.push({ op: "gte", col, value }); return this; }
  lt(col: string, value: unknown) { this.filters.push({ op: "lt", col, value }); return this; }
  lte(col: string, value: unknown) { this.filters.push({ op: "lte", col, value }); return this; }
  in(col: string, value: unknown[]) { this.filters.push({ op: "in", col, value }); return this; }
  order(col: string) { this.orderBy = col; return this; }
  range(from: number, to: number) { this.slice = [from, to]; return this; }

  private rows(): Row[] {
    let rows = (this.db.tables[this.table] ?? []).filter((r) => this.filters.every((f) => passes(r, f)));
    if (this.orderBy) {
      const col = this.orderBy;
      rows = [...rows].sort((a, b) => String(a[col]).localeCompare(String(b[col])));
    }
    // Embebidos: invoices(..., customers(...), organizations(...)).
    if (this.select.includes("customers(")) {
      rows = rows.map((r) => ({
        ...r,
        customers: this.db.tables.customers?.find((c) => c.id === r.customer_id) ?? null,
        organizations: this.db.tables.organizations?.find((o) => o.id === r.organization_id) ?? null,
      }));
    }
    if (this.slice) {
      const [from, to] = this.slice;
      rows = rows.slice(from, to + 1);
    }
    return rows;
  }

  then<R1 = { data: Row[] | null; error: unknown }, R2 = never>(
    onfulfilled?: ((v: { data: Row[] | null; error: unknown }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((r: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    this.db.queries.push(`${this.table}:${this.filters.map((f) => f.op + "." + f.col).join(",")}`);
    return Promise.resolve({ data: this.rows(), error: null }).then(onfulfilled, onrejected);
  }
}

class Mutation implements PromiseLike<{ data: null; error: unknown }> {
  private filters: Filter[] = [];
  constructor(
    private readonly db: FakeDb,
    private readonly table: string,
    private readonly kind: "update" | "delete",
    private readonly patch?: Row,
  ) {}

  eq(col: string, value: unknown) { this.filters.push({ op: "eq", col, value }); return this; }

  then<R1 = { data: null; error: unknown }, R2 = never>(
    onfulfilled?: ((v: { data: null; error: unknown }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((r: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    const all = this.db.tables[this.table] ?? [];
    const hit = (r: Row) => this.filters.every((f) => passes(r, f));
    if (this.kind === "delete") {
      this.db.tables[this.table] = all.filter((r) => !hit(r));
    } else {
      for (const r of all) if (hit(r)) Object.assign(r, this.patch);
    }
    return Promise.resolve({ data: null, error: null }).then(onfulfilled, onrejected);
  }
}

export class FakeDb {
  tables: Record<string, Row[]> = {};
  /** Consultas ejecutadas, para asertar que el código pagina y no re-consulta. */
  queries: string[] = [];

  constructor(seed: Record<string, Row[]> = {}) {
    for (const [t, rows] of Object.entries(seed)) this.tables[t] = rows.map((r) => ({ ...r }));
  }

  from(table: string) {
    this.tables[table] ??= [];
    return {
      select: (cols = "*") => new Query(this, table, cols),
      insert: (row: Row) => this.insert(table, row),
      update: (patch: Row) => new Mutation(this, table, "update", patch),
      delete: () => new Mutation(this, table, "delete"),
    };
  }

  rpc(name: string) {
    if (name !== "org_owner_emails") throw new Error(`rpc no soportada en el fake: ${name}`);
    return new Query(this, "__owners", "*");
  }

  private async insert(table: string, row: Row): Promise<{ data: null; error: unknown }> {
    const rows = (this.tables[table] ??= []);
    if (table === "reminder_log") {
      const idx = UNIQUE_INDEXES.find((i) => i.kind === row.kind);
      if (idx && rows.some((r) => r.kind === row.kind && idx.cols.every((c) => r[c] === row[c]))) {
        // 23505 unique_violation — exactamente lo que devuelve Postgres.
        return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint" } };
      }
    }
    rows.push({ sent: true, sent_at: new Date().toISOString(), ...row });
    return { data: null, error: null };
  }
}
