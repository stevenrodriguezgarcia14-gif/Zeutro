import type { Metadata } from "next";
import { LegalLayout, H2, P, UL } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Seguridad — Zentro",
  description: "Cómo protegemos tu información y la de tu negocio en Zentro.",
};

export default function SecurityPage() {
  return (
    <LegalLayout
      title="Seguridad"
      updated="26 de junio de 2026"
      intro="Manejas el dinero y los datos de tu negocio. Aquí te explicamos, con honestidad, cómo los protegemos."
    >
      <H2>Cifrado</H2>
      <P>
        Toda la información viaja cifrada entre tu dispositivo y nuestros servidores mediante TLS
        (HTTPS), y se almacena cifrada en reposo en la base de datos. Tus contraseñas se guardan con
        funciones de hashing seguras: nunca se almacenan ni se ven en texto plano.
      </P>

      <H2>Aislamiento por negocio</H2>
      <P>
        Cada negocio solo puede ver y modificar su propia información. Aplicamos seguridad a nivel de
        base de datos (Row Level Security), de modo que el aislamiento no depende solo de la
        aplicación, sino que está garantizado en la capa más profunda: ningún negocio puede acceder
        a los datos de otro.
      </P>

      <H2>Autenticación de cuentas</H2>
      <UL>
        <li>Contraseñas con un mínimo de 12 caracteres.</li>
        <li>Verificación de correo electrónico al registrarse.</li>
        <li>Bloqueo de contraseñas presentes en filtraciones públicas conocidas.</li>
        <li>
          Al cambiar tu contraseña, se cierran todas las sesiones abiertas en otros dispositivos.
        </li>
      </UL>

      <H2>Integridad de tus finanzas</H2>
      <P>
        Las operaciones de dinero (cobros, ventas, gastos) se procesan de forma atómica: o se
        completan por entero o no se aplican, evitando saldos a medias. Los importes se manejan como
        enteros en su unidad mínima (centavos) para que nunca haya errores de redondeo.
      </P>

      <H2>Infraestructura y respaldos</H2>
      <P>
        Zentro se apoya en infraestructura de proveedores líderes: <strong>Supabase</strong> para la
        base de datos y autenticación, y <strong>Vercel</strong> para el alojamiento. La base de
        datos cuenta con respaldos gestionados por la infraestructura. Además, tú puedes{" "}
        <strong>exportar tu información cuando quieras</strong> para tener tu propia copia.
      </P>

      <H2>Tu parte</H2>
      <UL>
        <li>Usa una contraseña única y no la compartas.</li>
        <li>Cierra sesión en dispositivos que no controles.</li>
        <li>Exporta tus datos periódicamente como respaldo propio.</li>
      </UL>

      <H2>Reportar una vulnerabilidad</H2>
      <P>
        Si crees que encontraste un problema de seguridad, te lo agradeceremos: escríbenos a{" "}
        <a href="mailto:zeutro.notificaciones@gmail.com" className="font-medium text-slate-900 hover:underline">
          zeutro.notificaciones@gmail.com
        </a>{" "}
        y lo revisaremos lo antes posible. Te pedimos no divulgarlo públicamente hasta que lo
        hayamos corregido.
      </P>

      <P>
        Mejoramos nuestra seguridad de forma continua. Si quieres saber qué datos tratamos y por
        qué, consulta el{" "}
        <a href="/privacidad" className="font-medium text-slate-900 hover:underline">
          Aviso de Privacidad
        </a>
        .
      </P>
    </LegalLayout>
  );
}
