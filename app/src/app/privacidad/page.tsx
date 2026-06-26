import type { Metadata } from "next";
import { LegalLayout, H2, P, UL } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Aviso de Privacidad — Zentro",
  description: "Cómo Zentro recoge, usa y protege tus datos y los de tu negocio.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Aviso de Privacidad"
      updated="26 de junio de 2026"
      intro="Tu información y la de tu negocio son tuyas. Este aviso explica, en lenguaje claro, qué datos tratamos, para qué y qué derechos tienes."
    >
      <H2>1. Quién es responsable</H2>
      <P>
        Zentro (&quot;nosotros&quot;) es responsable del tratamiento de los datos de tu cuenta. Para
        cualquier asunto de privacidad puedes escribirnos a{" "}
        <a href="mailto:zeutro.notificaciones@gmail.com" className="font-medium text-slate-900 hover:underline">
          zeutro.notificaciones@gmail.com
        </a>
        .
      </P>

      <H2>2. Qué datos tratamos</H2>
      <UL>
        <li>
          <strong>Datos de tu cuenta:</strong> nombre, correo electrónico y la contraseña (que se
          almacena cifrada; nunca la vemos en texto plano).
        </li>
        <li>
          <strong>Datos de tu negocio:</strong> la información que tú registras — clientes, ventas,
          cotizaciones, facturas, cobros, compras, productos, proyectos, tareas y movimientos
          financieros.
        </li>
        <li>
          <strong>Datos técnicos:</strong> registros básicos de uso y seguridad (dirección IP,
          fecha y tipo de acción) necesarios para operar y proteger el servicio.
        </li>
      </UL>

      <H2>3. Datos de TUS clientes (rol de encargado)</H2>
      <P>
        Cuando guardas información de tus propios clientes (nombre, contacto, deudas), <strong>tú
        eres el responsable</strong> de esos datos y Zentro actúa como <strong>encargado</strong>:
        los tratamos únicamente para prestarte el servicio, siguiendo tus instrucciones. Eres
        responsable de tener una base legal para registrarlos y de informar a tus clientes cuando
        corresponda.
      </P>

      <H2>4. Para qué usamos los datos y base legal</H2>
      <UL>
        <li>Prestar y mantener el servicio (ejecución del contrato).</li>
        <li>Seguridad, prevención de fraude y soporte (interés legítimo).</li>
        <li>Comunicaciones operativas sobre tu cuenta (ejecución del contrato).</li>
        <li>Mejoras del producto a partir de datos agregados o anonimizados (interés legítimo).</li>
      </UL>
      <P>No vendemos tus datos ni los de tu negocio. No los usamos para publicidad de terceros.</P>

      <H2>5. Con quién los compartimos</H2>
      <P>
        No vendemos ni cedemos tus datos. Para operar, nos apoyamos en proveedores tecnológicos de
        confianza —infraestructura en la nube, base de datos y envío de correos— que tratan los
        datos por nuestra cuenta y únicamente para que el servicio funcione. Les exigimos garantías
        de seguridad y confidencialidad adecuadas.
      </P>
      <P>
        Algunos proveedores pueden alojar datos fuera de tu país. En esos casos aplican garantías
        contractuales adecuadas para su protección.
      </P>

      <H2>6. Cuánto tiempo los conservamos</H2>
      <P>
        Conservamos tus datos mientras tu cuenta esté activa. Si la eliminas, borramos o
        anonimizamos tu información en un plazo razonable, salvo lo que debamos conservar por
        obligaciones legales o de seguridad.
      </P>

      <H2>7. Tus derechos</H2>
      <P>
        Puedes acceder, rectificar, exportar o eliminar tus datos. La app te permite{" "}
        <strong>exportar tu información cuando quieras</strong>; para borrar tu cuenta o ejercer
        cualquier otro derecho (incluida oposición o limitación del tratamiento), escríbenos a{" "}
        <a href="mailto:zeutro.notificaciones@gmail.com" className="font-medium text-slate-900 hover:underline">
          zeutro.notificaciones@gmail.com
        </a>
        .
      </P>

      <H2>8. Seguridad</H2>
      <P>
        Aplicamos cifrado en tránsito (TLS) y en reposo, aislamiento de datos por negocio y
        controles de acceso. Encontrarás más detalle en nuestra{" "}
        <a href="/seguridad" className="font-medium text-slate-900 hover:underline">
          página de Seguridad
        </a>
        . Ningún sistema es 100% infalible, pero trabajamos para protegerlo de forma continua.
      </P>

      <H2>9. Menores</H2>
      <P>
        Zentro está dirigido a personas mayores de edad que gestionan un negocio. No está pensado
        para menores.
      </P>

      <H2>10. Cambios a este aviso</H2>
      <P>
        Si actualizamos este aviso, cambiaremos la fecha de arriba y, cuando el cambio sea
        relevante, te avisaremos dentro de la app o por correo.
      </P>
    </LegalLayout>
  );
}
