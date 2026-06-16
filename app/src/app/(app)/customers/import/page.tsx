import Link from "next/link";
import CustomerImporter from "@/components/CustomerImporter";

export default function ImportCustomersPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Importar clientes</h1>
          <p className="mt-1 text-sm text-slate-500">Sube tus clientes desde un archivo CSV (exportado de Excel).</p>
        </div>
        <Link href="/customers" className="text-sm text-slate-600 hover:underline">← Volver</Link>
      </div>
      <div className="mt-6">
        <CustomerImporter />
      </div>
    </div>
  );
}
