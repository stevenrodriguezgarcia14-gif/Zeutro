// =====================================================================
// Respaldo de la base de datos de Zentro (Supabase Free no tiene backups).
//
// Exporta TODAS las tablas de `public` + los usuarios de `auth` a archivos
// JSON en una carpeta con fecha, dentro de `respaldos-zentro/` en la raíz
// del proyecto (OneDrive la sube a la nube sola = copia fuera de Supabase).
//
// Uso (doble clic en RESPALDAR-ZENTRO.bat, o):
//   node zentro/scripts/backup-zentro.mjs
//
// El PAT de Supabase se lee de la variable SUPABASE_PAT o, si no existe,
// del archivo zentro-credenciales-PRIVADO.txt (fuera del repo).
//
// Límites conocidos (suficiente hoy; ver Roadmap §5):
//  - No incluye los archivos de Storage (logos/documents).
//  - El esquema NO se respalda aquí: vive en zentro/supabase/migrations.
//  - Si una tabla crece a cientos de miles de filas, migrar a pg_dump/PITR
//    (Supabase Pro), que es el plan al primer cliente de pago.
// =====================================================================
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REF = "ofklhcfqauqohgwlizrc";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function getPat() {
  if (process.env.SUPABASE_PAT) return process.env.SUPABASE_PAT;
  const cred = readFileSync(join(ROOT, "zentro-credenciales-PRIVADO.txt"), "utf8");
  const m = cred.match(/sbp_[0-9a-f]{40}/);
  if (!m) throw new Error("No encontré el PAT (sbp_...) en zentro-credenciales-PRIVADO.txt");
  return m[0];
}

async function query(pat, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return res.json();
}

const pat = getPat();
const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "");
const outDir = join(ROOT, "respaldos-zentro", stamp);
mkdirSync(outDir, { recursive: true });

console.log(`Respaldo Zentro → ${outDir}`);

const tables = await query(
  pat,
  "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name",
);

const resumen = { fecha: new Date().toISOString(), proyecto: REF, tablas: {} };
let totalFilas = 0;

for (const { table_name } of tables) {
  const rows = await query(pat, `select coalesce(json_agg(t), '[]'::json) as data from public."${table_name}" t`);
  const data = rows[0]?.data ?? [];
  writeFileSync(join(outDir, `${table_name}.json`), JSON.stringify(data, null, 1), "utf8");
  resumen.tablas[table_name] = data.length;
  totalFilas += data.length;
  console.log(`  ${table_name}: ${data.length} filas`);
}

// Usuarios de auth (incluye hash de contraseña: el archivo es privado, fuera del repo).
const users = await query(pat, "select coalesce(json_agg(u), '[]'::json) as data from auth.users u");
writeFileSync(join(outDir, "auth_users.json"), JSON.stringify(users[0]?.data ?? [], null, 1), "utf8");
resumen.tablas["auth.users"] = (users[0]?.data ?? []).length;
console.log(`  auth.users: ${resumen.tablas["auth.users"]} filas`);

writeFileSync(join(outDir, "_resumen.json"), JSON.stringify(resumen, null, 2), "utf8");
console.log(`\nListo: ${Object.keys(resumen.tablas).length} tablas, ${totalFilas + resumen.tablas["auth.users"]} filas.`);
console.log("Recuerda: los archivos de Storage (logos/documentos) no van aquí; el esquema vive en las migraciones.");
