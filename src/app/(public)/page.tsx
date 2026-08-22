import type { Metadata } from "next";

import {
  ConciergeSection,
  ConviteSection,
  MetodoSection,
  NossoMetodoSection,
  PrioridadesSection,
  ProblemaSection,
  QuemSomosSection,
  RespiroSection,
  VideoSection,
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
        {/* Decisão do Fundador (22/08, sobre a tela): o "Como funciona" — a
            jornada em cartões com as fotografias — assume o lugar da faixa
            de pilares, logo após o vídeo. A faixa saiu da página (o
            componente fica, se um dia voltar); as demais seções do contrato
            34 mantêm a ordem relativa entre si. */}
        <VideoSection />
        <MetodoSection />
        <ProblemaSection />
        <RespiroSection />
        <NossoMetodoSection />
        <PrioridadesSection />
        <ConciergeSection />
        <QuemSomosSection />
        <FaqCompactSection />
        <ConviteSection />
      </RevealGroup>
    </>
  );
}
