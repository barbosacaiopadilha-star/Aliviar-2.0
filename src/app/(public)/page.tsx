import type { Metadata } from "next";

import {
  ConviteSection,
  MetodoSection,
  PrioridadesSection,
  ProblemaSection,
  QuemSomosSection,
  RespiroSection,
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
      {/* Quatro movimentos percebidos (NOTA_EXECUCAO_LANDING_2_3):
          1 Você chegou (Hero) · 2 Nós ouvimos (Espelho + Respiro) ·
          3 Existe um caminho (Método denso) · 4 Você não fará isso sozinho
          (entrega → sala verde → dúvidas → convite). Os dois únicos CTAs
          reais: a porta do Hero e o convite final. */}
      <HeroEditorial />
      <RevealGroup>
        <ProblemaSection />
        <RespiroSection />
        <MetodoSection />
        <PrioridadesSection />
        <QuemSomosSection />
        <FaqCompactSection />
        <ConviteSection />
      </RevealGroup>
    </>
  );
}
