import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Convierte centavos a unidades mayores con 2 decimales (para Excel).
function money(minor: number | null | undefined): string {
  return ((minor ?? 0) / 100).toFixed(2);
}

// Escapa un campo CSV (comillas, comas, saltos de línea).
function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCSV(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.map(cell).join(",")];
  for (const r of rows) lines.push(r.map(cell).join(","));
  // BOM para que Excel reconozca UTF-8 (acentos).
  return "﻿" + lines.join("\r\n");
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  let csv = "";
  let filename = "export.csv";

  if (type === "customers") {
    const { data } = await supabase
      .from("customers")
      .select("legal_name, type, email, phone, tax_id, status, payment_terms")
      .order("legal_name");
    csv = toCSV(
      ["Nombre", "Tipo", "Correo", "Teléfono", "RFC/ID", "Estado", "Términos"],
      (data ?? []).map((c) => [
        c.legal_name,
        c.type === "person" ? "Persona" : "Empresa",
        c.email,
        c.phone,
        c.tax_id,
        c.status,
        c.payment_terms,
      ]),
    );
    filename = "clientes.csv";
  } else if (type === "invoices") {
    const { data } = await supabase
      .from("invoices")
      .select("number, issue_date, due_date, total_minor, paid_minor, balance_minor, status, customers(legal_name)")
      .order("issue_date", { ascending: false });
    csv = toCSV(
      ["Número", "Cliente", "Fecha", "Vence", "Total", "Pagado", "Saldo", "Estado"],
      (data ?? []).map((i) => {
        const cust = (i.customers as unknown as { legal_name: string } | null)?.legal_name ?? "";
        return [i.number, cust, i.issue_date, i.due_date, money(i.total_minor), money(i.paid_minor), money(i.balance_minor), i.status];
      }),
    );
    filename = "facturas.csv";
  } else if (type === "payments") {
    const { data } = await supabase
      .from("payments")
      .select("paid_at, amount_minor, method, reference, customers(legal_name)")
      .order("paid_at", { ascending: false });
    csv = toCSV(
      ["Fecha", "Cliente", "Monto", "Método", "Referencia"],
      (data ?? []).map((p) => {
        const cust = (p.customers as unknown as { legal_name: string } | null)?.legal_name ?? "";
        return [p.paid_at, cust, money(p.amount_minor), p.method, p.reference];
      }),
    );
    filename = "pagos.csv";
  } else if (type === "expenses") {
    const { data } = await supabase
      .from("expenses")
      .select("expense_date, description, category, amount_minor, payment_status")
      .order("expense_date", { ascending: false });
    csv = toCSV(
      ["Fecha", "Descripción", "Categoría", "Monto", "Estado"],
      (data ?? []).map((e) => [e.expense_date, e.description, e.category, money(e.amount_minor), e.payment_status]),
    );
    filename = "gastos.csv";
  } else {
    return new NextResponse("Tipo de exportación no válido", { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
