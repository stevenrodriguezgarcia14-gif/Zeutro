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

// La redirección de usuarios con sesión a /dashboard la hace el proxy,
// así esta página es 100% estática (se sirve desde CDN, sin tocar auth).
export default function Home() {
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
