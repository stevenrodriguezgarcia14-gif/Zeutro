import type { Metadata } from "next";
import { LegalLayout, H2, P, UL } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Zentro",
  description: "Las reglas para usar Zentro, en lenguaje claro.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Términos y Condiciones"
      updated="26 de junio de 2026"
      intro="Estas son las reglas para usar Zentro. Al crear una cuenta, aceptas estos términos."
    >
      <H2>1. El servicio</H2>
      <P>
        Zentro es una herramienta de gestión para emprendedores y pequeños negocios: centraliza
        clientes, ventas, cobros, compras, finanzas y organización. Mejoramos el producto de forma
        continua, por lo que algunas funciones pueden cambiar con el tiempo.
      </P>

      <H2>2. Tu cuenta</H2>
      <UL>
        <li>Debes ser mayor de edad y proporcionar información veraz al registrarte.</li>
        <li>Eres responsable de mantener segura tu contraseña y de la actividad de tu cuenta.</li>
        <li>Avísanos de inmediato si detectas un uso no autorizado.</li>
      </UL>

      <H2>3. Uso aceptable</H2>
      <P>Al usar Zentro te comprometes a no:</P>
      <UL>
        <li>Usarlo para actividades ilegales o para vulnerar derechos de terceros.</li>
        <li>Intentar acceder a datos de otros negocios o cuentas.</li>
        <li>Sobrecargar, atacar o intentar dañar el servicio o su infraestructura.</li>
        <li>Subir contenido malicioso o datos para los que no tengas base legal.</li>
      </UL>

      <H2>4. Tus datos son tuyos</H2>
      <P>
        Conservas la propiedad de toda la información que registras. Puedes exportarla cuando
        quieras. Nosotros solo la tratamos para prestarte el servicio, según el{" "}
        <a href="/privacidad" className="font-medium text-slate-900 hover:underline">
          Aviso de Privacidad
        </a>
        .
      </P>

      <H2>5. Planes y pagos</H2>
      <P>
        Zentro ofrece un plan gratuito y planes de pago. Los precios y beneficios se muestran en la
        página de precios. Cuando habilitemos el cobro de planes de pago, la suscripción se renovará
        según el periodo elegido y podrás cancelarla cuando quieras; al cancelar, conservas el
        acceso hasta el fin del periodo ya pagado. No hay permanencia obligatoria.
      </P>

      <H2>6. Aviso importante sobre temas fiscales y contables</H2>
      <P>
        Zentro es una herramienta de organización y gestión. <strong>No sustituye la asesoría
        contable, fiscal ni legal</strong> de un profesional. Los cálculos de impuestos (como el
        IVA) son una ayuda para tu gestión y <strong>no constituyen comprobantes fiscales válidos</strong>{" "}
        salvo que exista una integración de facturación electrónica certificada y así se indique.
        Verifica siempre tus obligaciones con un contador.
      </P>

      <H2>7. Disponibilidad</H2>
      <P>
        Trabajamos para que Zentro esté disponible de forma continua, pero el servicio se ofrece
        &quot;tal cual&quot; y puede tener interrupciones por mantenimiento o causas ajenas. El plan
        gratuito no incluye un nivel de servicio garantizado.
      </P>

      <H2>8. Limitación de responsabilidad</H2>
      <P>
        En la medida que la ley lo permita, Zentro no será responsable por daños indirectos,
        pérdida de ganancias o de datos derivados del uso o imposibilidad de uso del servicio. Eres
        responsable de mantener tus propios respaldos exportando tu información periódicamente.
      </P>

      <H2>9. Suspensión y terminación</H2>
      <P>
        Podemos suspender o cerrar cuentas que incumplan estos términos. Tú puedes cerrar tu cuenta
        en cualquier momento.
      </P>

      <H2>10. Cambios y ley aplicable</H2>
      <P>
        Podemos actualizar estos términos; te avisaremos de cambios relevantes. Estos términos se
        rigen por la legislación aplicable del país donde opera Zentro, sin perjuicio de los
        derechos que te correspondan como consumidor en tu país de residencia.
      </P>
    </LegalLayout>
  );
}
