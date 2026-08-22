import type { Metadata } from "next";

import {
  ConciergeSection,
  ConfiancaStripSection,
  ConviteSection,
  MetodoSection,
  NossoMetodoSection,
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
      {/* BLOCO 7 / D-1 · a ordem do contrato 34 §6. Os quatro blocos que a
          referência-mestra não mostra — Problema, Respiro, FAQ e Convite —
          PERMANECEM: a D-1 foi resolvida como "a referência é a espinha
          visual", e a prova não é um parecer, é o que a Track D fez ao
          blindar `landing/editorial/**` por escrito enquanto apagava 23
          arquivos de landing.

          `ConciergeSection` vem DEPOIS de `PrioridadesSection` de propósito:
          o Concierge entra quando já existe escolha a acompanhar (§4.1). */}
      <HeroEditorial />
      <RevealGroup>
        {/* ADR-078 · a faixa de confiança do mockup do Fundador — soma-se
            ENTRE o Hero e o Problema; nenhuma seção do contrato 34 sai, e a
            ordem relativa delas permanece intacta. */}
        <ConfiancaStripSection />
        <ProblemaSection />
        <RespiroSection />
        <NossoMetodoSection />
        <PrioridadesSection />
        <ConciergeSection />
        <MetodoSection />
        <QuemSomosSection />
        <FaqCompactSection />
        <ConviteSection />
      </RevealGroup>
    </>
  );
}
