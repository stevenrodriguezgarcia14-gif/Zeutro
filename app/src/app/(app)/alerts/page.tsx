import { redirect } from "next/navigation";

// Alertas se fusionó con el Centro de Prioridades (una sola pantalla de "qué
// atender hoy"). Se conserva la ruta para no romper enlaces guardados.
export default function AlertsPage() {
  redirect("/priorities");
}
