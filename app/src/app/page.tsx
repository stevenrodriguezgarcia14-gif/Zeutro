import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/landing/Navbar";
import { UseCases } from "@/components/landing/UseCases";
import { Faq } from "@/components/landing/Faq";
import {
  Hero,
  TrustStrip,
  Problem,
  Solution,
  ProductShowcase,
  Priorities,
  Modules,
  UseCasesSection,
  Comparison,
  Trust,
  Pricing,
  FaqSection,
  FinalCta,
  Footer,
  MobileStickyCta,
} from "@/components/landing/Sections";

export default async function Home() {
  // Si el usuario ya tiene sesión, va directo a su panel.
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  } catch {
    // Sin Supabase configurado mostramos la landing igualmente.
  }
  if (isLoggedIn) redirect("/dashboard");

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <Hero />
        <TrustStrip />
        <Problem />
        <Solution />
        <ProductShowcase />
        <Priorities />
        <Modules />
        <UseCasesSection>
          <UseCases />
        </UseCasesSection>
        <Comparison />
        <Trust />
        <Pricing />
        <FaqSection>
          <Faq />
        </FaqSection>
        <FinalCta />
      </main>
      <Footer />
      <MobileStickyCta />
    </>
  );
}
