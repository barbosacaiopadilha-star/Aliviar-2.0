import type { Metadata } from "next";

import { BenefitsSection } from "@/components/landing/benefits-section";
import { ConciergeSection } from "@/components/landing/concierge-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { Hero } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PrimaryCtaBand } from "@/components/landing/primary-cta-band";
import { ProcessSection } from "@/components/landing/process-section";
import { VideoSection } from "@/components/landing/video-section";
import { WhyTrustSection } from "@/components/landing/why-trust-section";

export const metadata: Metadata = {
  title: { absolute: "Aliviar Curadoria Médica — Você não precisa enfrentar isso sozinho" },
  description:
    "Curadoria médica independente, com acompanhamento humano em cada etapa — do primeiro contato à conversa que importa.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <PrimaryCtaBand />
      <VideoSection />
      <HowItWorksSection />
      <BenefitsSection />
      <ProcessSection />
      <WhyTrustSection />
      <ConciergeSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
