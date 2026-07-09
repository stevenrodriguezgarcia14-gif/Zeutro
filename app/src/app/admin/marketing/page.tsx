import { redirect } from "next/navigation";

// El Marketing OS se movió a su propio espacio (v2). Este stub conserva los
// enlaces/bookmarks viejos de /admin/marketing.
export default function LegacyMarketingRedirect() {
  redirect("/marketing-os");
}
