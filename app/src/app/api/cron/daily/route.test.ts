import { describe, it, expect, beforeEach, vi } from "vitest";
import { FakeDb, type Row } from "@/test/fakeSupabase";

/**
 * Pruebas del cron REAL (se importa la ruta, no una copia de su lógica)
 * contra un Supabase en memoria y un `sendMail` espiado.
 *
 * Lo que se verifica es exactamente lo que se rompió en producción:
 *  - cada correo habla del período correcto;
 *  - un período no se vuelve a enviar nunca;
 *  - una semana sin movimiento no genera correo (era la causa del "mismo
 *    resumen todos los lunes");
 *  - si el envío falla, la siguiente corrida lo reintenta;
 *  - correr el job N veces al día no duplica nada;
 *  - da igual el día en que corra: el período resumido no se mueve;
 *  - la zona horaria del negocio decide cuándo cierra la semana.
 */

let db: FakeDb;
const sent: { to: string; subject: string; html: string }[] = [];
let mailWorks = true;

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => db,
}));

vi.mock("@/lib/email", async () => {
  const real = await vi.importActual<typeof import("@/lib/email")>("@/lib/email");
  return {
    ...real,
    sendMail: vi.fn(async (to: string, subject: string, html: string) => {
      if (!mailWorks) return false;
      sent.push({ to, subject, html });
      return true;
    }),
  };
});

const { GET } = await import("./route");

const ORG = "org-1";
const OWNER = "duena@negocio.com";
const SECRET = "test-secret";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
process.env.SUPABASE_SECRET_KEY = "sb_secret_fake";
process.env.CRON_SECRET = SECRET;

function seed(overrides: Record<string, Row[]> = {}) {
  return new FakeDb({
    organizations: [
      {
        id: ORG,
        name: "Taquería El Buen Taco",
        base_currency: "CRC",
        timezone: "America/Mexico_City",
        weekly_summary: true,
        auto_reminders: true,
        created_at: "2026-06-21T00:00:00Z",
      },
    ],
    __owners: [{ organization_id: ORG, email: OWNER }],
    payments: [],
    quick_sales: [],
    expenses: [],
    invoices: [],
    customers: [],
    reminder_log: [],
    ...overrides,
  });
}

/** Corre el cron como si hoy fuera `isoInstant`. */
async function runCron(isoInstant: string, query = "") {
  vi.setSystemTime(new Date(isoInstant));
  const res = await GET(
    new Request(`https://zentro.app/api/cron/daily${query}`, {
      headers: { authorization: `Bearer ${SECRET}` },
    }),
  );
  return (await res.json()) as Record<string, number | boolean>;
}

const weeklyLog = () =>
  db.tables.reminder_log
    .filter((r) => r.kind === "weekly")
    .map((r) => `${r.period}:${r.sent ? "enviado" : "sin-envio"}`)
    .sort();

beforeEach(() => {
  vi.useFakeTimers();
  sent.length = 0;
  mailWorks = true;
  db = seed();
});

describe("autorización", () => {
  it("rechaza sin el secreto", async () => {
    vi.setSystemTime(new Date("2026-08-24T13:00:00Z"));
    const res = await GET(new Request("https://zentro.app/api/cron/daily"));
    expect(res.status).toBe(401);
    expect(sent).toHaveLength(0);
  });
});

describe("EL BUG: semana sin movimiento con facturas viejas pendientes", () => {
  beforeEach(() => {
    // Reproduce el estado real de producción: la última actividad fue el
    // 20 de junio y quedaron 2 facturas sin pagar. Nada más ocurrió desde
    // entonces. El motor viejo mandaba un correo idéntico cada lunes.
    db = seed({
      quick_sales: [{ id: "s1", organization_id: ORG, amount_minor: 120_000, sold_at: "2026-06-20" }],
      invoices: [
        { id: "i1", organization_id: ORG, number: "F-1", total_minor: 1_500_000, issue_date: "2026-06-18", due_date: "2026-06-25", balance_minor: 1_500_000, status: "overdue", customer_id: null, payment_link: null },
        { id: "i2", organization_id: ORG, number: "F-2", total_minor: 1_788_300, issue_date: "2026-06-19", due_date: "2026-06-26", balance_minor: 1_788_300, status: "overdue", customer_id: null, payment_link: null },
      ],
    });
  });

  it("no manda ni un correo en diez semanas seguidas de inactividad", async () => {
    for (let semana = 0; semana < 10; semana++) {
      const lunes = new Date(Date.UTC(2026, 8, 7 + semana * 7, 13, 0, 0)).toISOString();
      await runCron(lunes);
    }
    expect(sent.filter((m) => m.subject.includes("Tu semana"))).toHaveLength(0);
  });

  it("pero deja registrado que sí revisó cada semana (no las re-evalúa)", async () => {
    await runCron("2026-09-07T13:00:00Z");
    const revisadas = weeklyLog();
    expect(revisadas.length).toBeGreaterThan(0);
    expect(revisadas.every((r) => r.endsWith("sin-envio"))).toBe(true);
  });
});

describe("el período resumido es el correcto", () => {
  beforeEach(() => {
    db = seed({
      quick_sales: [
        { id: "s1", organization_id: ORG, amount_minor: 50_000, sold_at: "2026-08-19" }, // semana W34
        { id: "s2", organization_id: ORG, amount_minor: 70_000, sold_at: "2026-08-26" }, // semana W35
      ],
      expenses: [{ id: "e1", organization_id: ORG, amount_minor: 20_000, expense_date: "2026-08-20" }],
    });
  });

  it("el lunes resume la semana que acaba de cerrar, no la que empieza", async () => {
    await runCron("2026-08-24T13:00:00Z"); // lunes
    const semana = sent.find((m) => m.subject.includes("Tu semana"));
    expect(semana).toBeDefined();
    expect(semana!.subject).toContain("17–23 ago");
    expect(semana!.html).toContain("2026-08-17");
    expect(semana!.html).toContain("2026-08-23");
    expect(db.tables.reminder_log.find((r) => r.kind === "weekly" && r.sent)!.period).toBe("2026-W34");
  });

  it("cada semana trae cifras distintas: no se repite el mismo contenido", async () => {
    await runCron("2026-08-24T13:00:00Z");
    await runCron("2026-08-31T13:00:00Z");
    const semanas = sent.filter((m) => m.subject.includes("Tu semana"));
    expect(semanas).toHaveLength(2);
    expect(semanas[0].subject).not.toBe(semanas[1].subject);
    expect(semanas[0].html).not.toBe(semanas[1].html);
    expect(semanas[1].subject).toContain("24–30 ago");
  });

  it("las ventas del lunes NO se cuentan en dos semanas seguidas", async () => {
    // El motor viejo usaba [ahora − 7 días, ∞) truncado a día: el lunes
    // anterior caía dentro de dos ventanas consecutivas.
    db = seed({
      quick_sales: [{ id: "s1", organization_id: ORG, amount_minor: 100_000, sold_at: "2026-08-24" }],
      expenses: [{ id: "e1", organization_id: ORG, amount_minor: 1, expense_date: "2026-08-19" }],
    });
    await runCron("2026-08-24T13:00:00Z"); // resume 17–23: la venta del 24 no va
    await runCron("2026-08-31T13:00:00Z"); // resume 24–30: aquí sí
    const semanas = sent.filter((m) => m.subject.includes("Tu semana"));
    expect(semanas[0].html).not.toContain("1,000.00");
    expect(semanas[1].html).toContain("1,000.00");
  });
});

describe("idempotencia", () => {
  beforeEach(() => {
    db = seed({ quick_sales: [{ id: "s1", organization_id: ORG, amount_minor: 50_000, sold_at: "2026-08-19" }] });
  });

  it("cinco corridas el mismo día = un solo correo", async () => {
    for (let i = 0; i < 5; i++) await runCron("2026-08-24T13:00:00Z");
    expect(sent.filter((m) => m.subject.includes("Tu semana"))).toHaveLength(1);
    expect(db.tables.reminder_log.filter((r) => r.kind === "weekly" && r.period === "2026-W34")).toHaveLength(1);
  });

  it("corre todos los días de la semana y sigue habiendo un solo correo", async () => {
    for (let d = 24; d <= 30; d++) await runCron(`2026-08-${d}T13:00:00Z`);
    expect(sent.filter((m) => m.subject.includes("Tu semana"))).toHaveLength(1);
  });
});

describe("recuperación ante fallos", () => {
  beforeEach(() => {
    db = seed({ quick_sales: [{ id: "s1", organization_id: ORG, amount_minor: 50_000, sold_at: "2026-08-19" }] });
  });

  it("si el lunes falla el envío, el martes sale el resumen de LA MISMA semana", async () => {
    mailWorks = false;
    const lunes = await runCron("2026-08-24T13:00:00Z");
    expect(lunes.errors).toBe(1);
    expect(sent).toHaveLength(0);
    // La reserva de la semana que falló queda liberada para reintentar.
    // Las semanas silenciosas sí conservan su marca de "revisada".
    expect(db.tables.reminder_log.filter((r) => r.kind === "weekly" && r.period === "2026-W34")).toHaveLength(0);
    expect(db.tables.reminder_log.every((r) => r.sent === false)).toBe(true);

    mailWorks = true;
    await runCron("2026-08-25T13:00:00Z");
    const semana = sent.find((m) => m.subject.includes("Tu semana"));
    expect(semana!.subject).toContain("17–23 ago"); // la semana perdida, no otra
  });

  it("si el cron no corre en toda una semana, recupera la semana saltada", async () => {
    db = seed({
      quick_sales: [
        { id: "s1", organization_id: ORG, amount_minor: 50_000, sold_at: "2026-08-19" },
        { id: "s2", organization_id: ORG, amount_minor: 90_000, sold_at: "2026-08-26" },
      ],
    });
    await runCron("2026-09-07T13:00:00Z"); // primera corrida tras dos semanas caído
    const asuntos = sent.filter((m) => m.subject.includes("Tu semana")).map((m) => m.subject);
    expect(asuntos.some((s) => s.includes("17–23 ago"))).toBe(true);
    expect(asuntos.some((s) => s.includes("24–30 ago"))).toBe(true);
  });

  it("no recupera indefinidamente hacia atrás", async () => {
    db = seed({ quick_sales: [{ id: "s1", organization_id: ORG, amount_minor: 50_000, sold_at: "2026-08-19" }] });
    await runCron("2026-11-02T13:00:00Z"); // dos meses después
    expect(sent.filter((m) => m.subject.includes("Tu semana"))).toHaveLength(0);
  });
});

describe("zona horaria del negocio", () => {
  it("a las 02:00 UTC del lunes, en México todavía es domingo: la semana no cerró", async () => {
    db = seed({ quick_sales: [{ id: "s1", organization_id: ORG, amount_minor: 50_000, sold_at: "2026-08-19" }] });
    await runCron("2026-08-24T02:00:00Z");
    expect(sent.filter((m) => m.subject.includes("Tu semana"))).toHaveLength(0);

    await runCron("2026-08-24T13:00:00Z"); // ya es lunes en México
    expect(sent.filter((m) => m.subject.includes("Tu semana"))).toHaveLength(1);
  });
});

describe("resumen mensual", () => {
  it("resume el mes cerrado y no repite si el mes no tuvo movimiento", async () => {
    db = seed({
      quick_sales: [{ id: "s1", organization_id: ORG, amount_minor: 400_000, sold_at: "2026-09-10" }],
    });
    await runCron("2026-10-01T13:00:00Z");
    const mes = sent.filter((m) => m.subject.includes("Tu mes"));
    expect(mes).toHaveLength(1);
    expect(mes[0].subject).toContain("septiembre de 2026");

    // Octubre no tuvo nada: el 1 de noviembre no debe llegar otro correo.
    sent.length = 0;
    await runCron("2026-11-01T13:00:00Z");
    expect(sent.filter((m) => m.subject.includes("Tu mes"))).toHaveLength(0);
  });
});

describe("consentimiento y aislamiento entre negocios", () => {
  it("respeta weekly_summary = false", async () => {
    db = seed({
      organizations: [
        { id: ORG, name: "N", base_currency: "CRC", timezone: "America/Mexico_City", weekly_summary: false, auto_reminders: true, created_at: "2026-06-21T00:00:00Z" },
      ],
      quick_sales: [{ id: "s1", organization_id: ORG, amount_minor: 50_000, sold_at: "2026-08-19" }],
    });
    await runCron("2026-08-24T13:00:00Z");
    expect(sent).toHaveLength(0);
  });

  it("con dos negocios, cada dueño recibe SOLO las cifras de su negocio", async () => {
    db = seed({
      organizations: [
        { id: "a", name: "Negocio A", base_currency: "CRC", timezone: "America/Mexico_City", weekly_summary: true, auto_reminders: true, created_at: "2026-06-01T00:00:00Z" },
        { id: "b", name: "Negocio B", base_currency: "CRC", timezone: "America/Mexico_City", weekly_summary: true, auto_reminders: true, created_at: "2026-06-01T00:00:00Z" },
      ],
      __owners: [
        { organization_id: "a", email: "a@x.com" },
        { organization_id: "b", email: "b@x.com" },
      ],
      quick_sales: [
        { id: "s1", organization_id: "a", amount_minor: 111_100, sold_at: "2026-08-19" },
        { id: "s2", organization_id: "b", amount_minor: 222_200, sold_at: "2026-08-19" },
      ],
    });
    await runCron("2026-08-24T13:00:00Z");
    const a = sent.find((m) => m.to === "a@x.com")!;
    const b = sent.find((m) => m.to === "b@x.com")!;
    expect(a.html).toContain("1,111.00");
    expect(a.html).not.toContain("2,222.00");
    expect(b.html).toContain("2,222.00");
    expect(b.html).not.toContain("1,111.00");
  });

  it("un negocio creado esta semana no recibe resúmenes de antes de existir", async () => {
    db = seed({
      organizations: [
        { id: ORG, name: "Nuevo", base_currency: "CRC", timezone: "America/Mexico_City", weekly_summary: true, auto_reminders: true, created_at: "2026-08-20T00:00:00Z" },
      ],
      quick_sales: [{ id: "s1", organization_id: ORG, amount_minor: 50_000, sold_at: "2026-08-04" }],
    });
    await runCron("2026-08-24T13:00:00Z");
    expect(sent.filter((m) => m.subject.includes("Tu semana"))).toHaveLength(0);
  });
});

describe("recordatorios de cobranza", () => {
  const CUST = { id: "c1", legal_name: "Ana López", email: "ana@cliente.com" };

  it("avisa al día 1 de atraso, no antes ni todos los días", async () => {
    db = seed({
      customers: [CUST],
      invoices: [
        { id: "i1", organization_id: ORG, number: "F-9", total_minor: 500_000, issue_date: "2026-08-10", due_date: "2026-08-23", balance_minor: 500_000, status: "issued", customer_id: "c1", payment_link: null },
      ],
    });
    await runCron("2026-08-23T13:00:00Z"); // vence hoy: nada
    expect(sent.filter((m) => m.subject.includes("Recordatorio"))).toHaveLength(0);

    await runCron("2026-08-24T13:00:00Z"); // 1 día de atraso
    expect(sent.filter((m) => m.subject.includes("Recordatorio"))).toHaveLength(1);

    await runCron("2026-08-25T13:00:00Z"); // 2 días: no toca
    await runCron("2026-08-26T13:00:00Z"); // 3 días: no toca
    expect(sent.filter((m) => m.subject.includes("Recordatorio"))).toHaveLength(1);

    await runCron("2026-08-28T13:00:00Z"); // 5 días
    expect(sent.filter((m) => m.subject.includes("Recordatorio"))).toHaveLength(2);
  });

  it("avisa la víspera del vencimiento una sola vez", async () => {
    db = seed({
      customers: [CUST],
      invoices: [
        { id: "i1", organization_id: ORG, number: "F-9", total_minor: 500_000, issue_date: "2026-08-10", due_date: "2026-08-25", balance_minor: 500_000, status: "issued", customer_id: "c1", payment_link: null },
      ],
    });
    for (let i = 0; i < 3; i++) await runCron("2026-08-24T13:00:00Z");
    expect(sent.filter((m) => m.subject.includes("vence mañana"))).toHaveLength(1);
  });
});

describe("volumen: no se queda con las primeras 1000 filas", () => {
  it("suma TODAS las ventas de la semana aunque pasen de una página", async () => {
    const ventas: Row[] = [];
    for (let i = 0; i < 1500; i++) {
      ventas.push({ id: `s${String(i).padStart(5, "0")}`, organization_id: ORG, amount_minor: 100, sold_at: "2026-08-19" });
    }
    db = seed({ quick_sales: ventas });
    await runCron("2026-08-24T13:00:00Z");
    const semana = sent.find((m) => m.subject.includes("Tu semana"))!;
    expect(semana.html).toContain("1,500.00"); // 1500 × ₡1.00
  });
});
