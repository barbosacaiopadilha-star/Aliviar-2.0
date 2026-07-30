import type { Metadata } from "next";

import {
  ComoFuncionaSection,
  MetodoSection,
  PrioridadesSection,
  ProblemaSection,
  QuemSomosSection,
  RelatorioJornadaSection,
} from "@/components/landing/editorial/editorial-sections";
import { FaqCompactSection } from "@/components/landing/editorial/faq-compact";
import { HeroEditorial } from "@/components/landing/editorial/hero-editorial";
import { RevealGroup } from "@/components/landing/editorial/reveal";

export const metadata: Metadata = {
  title: { absolute: "Aliviar Curadoria Médica — Uma decisão de saúde importante" },
  description:
    "Com você em cada etapa — da sua história até a escolha do médico certo para você.",
};

export default function HomePage() {
  return (
    <>
      <HeroEditorial />
      <RevealGroup>
        <ProblemaSection />
        <MetodoSection />
        <ComoFuncionaSection />
        <PrioridadesSection />
        <RelatorioJornadaSection />
        <QuemSomosSection />
        <FaqCompactSection />
      </RevealGroup>
    </>
  );
}
