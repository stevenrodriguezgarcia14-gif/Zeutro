import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Páginas y layouts de servidor: se renderizan una vez por request, leer el
    // reloj (new Date) ahí es intencional. La regla de pureza del React Compiler
    // está pensada para componentes de cliente que re-renderizan.
    files: ["src/app/**/page.tsx", "src/app/**/layout.tsx"],
    ignores: ["src/app/admin/academy/page.tsx"], // esta página es "use client"
    rules: { "react-hooks/purity": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
