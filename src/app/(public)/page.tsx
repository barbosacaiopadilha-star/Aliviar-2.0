import type { Metadata } from "next";

import { CapituloDoEdificio } from "@/components/landing/editorial/capitulo-do-edificio";
import {
  ConviteSection,
  EscolhaSection,
  MetodoSection,
  RespiroSection,
  VideoSection,
} from "@/components/landing/editorial/editorial-sections";
import { FaqCompactSection } from "@/components/landing/editorial/faq-compact";
import { HeroEditorial } from "@/components/landing/editorial/hero-editorial";
import { RevealGroup } from "@/components/landing/editorial/reveal";
import { VidroDinamico } from "@/components/landing/editorial/vidro-dinamico";

export const metadata: Metadata = {
  title: { absolute: "Aliviar Curadoria Médica — Uma decisão de saúde importante" },
  // A descrição (o que o Google mostra) prometia "o médico certo para
  // você" — a promessa de resultado que a L14/Linguagem §6 proíbe e que o
  // Hero já tinha corrigido em julho. A vitrine passa a dizer a mesma
  // verdade dentro e fora da tela.
  description: "Com você em cada etapa. Da sua história até uma decisão que é sua.",
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
      {/* ADR-080 · 3ª rodada (23/08, decisão do Fundador): a página são
          QUATRO capítulos do Edifício — todo o conteúdo dentro deles, na
          ordem canônica intocada (contrato 34 / ADR-078 §2). A dosagem
          aprovada: cada capítulo abre com a cena forte e amansa por dentro;
          o Respiro é a única pausa de linho — por ser única, significa.
          "O cenário atual" e "Nosso Método" seguem fora (decisões de 22/08,
          copy congelada nos componentes). */}
      {/* ADR-082 · O ROTEIRO DOS QUATRO ATOS (decisão do Fundador, 23/08):
          tudo na página existe para explicar Recepção → Curadoria →
          Escolha → Concierge — um ato por capítulo do Edifício.
          - RECEPÇÃO: o hero e o vídeo de apresentação (apresentação é
            chegada — ordem expressa do Fundador).
          - CURADORIA: o manifesto, a apresentação do Curador (copy dele) e
            os passos 01–03. O futuro vídeo do "como funciona" entra aqui.
          - ESCOLHA: os passos 04–05, no corredor dos três retratos.
          - CONCIERGE: dúvidas e a porta, na mesa de trabalho.
          A numeração da jornada atravessa os atos de propósito: a
          travessia É a jornada. Cortes anteriores (ADR-081 e emenda)
          seguem valendo — copies congeladas nos componentes. */}
      <CapituloDoEdificio
        scene="entrada"
        imagePosition="right center"
        backdropClassName="landing-hero-cenario"
      >
        {/* Ordem expressa do Fundador (23/08): o vídeo de apresentação é a
            PRIMEIRA coisa da Recepção — acima do Capítulo Zero. */}
        <VideoSection />
        <HeroEditorial />
      </CapituloDoEdificio>
      <RevealGroup>
        <CapituloDoEdificio scene="curadoria">
          <MetodoSection />
        </CapituloDoEdificio>
        {/* Capítulo curto pede cena NÍTIDA: o corredor dos três retratos é
            o ato da Escolha encenado — o gradiente de amansar não entra. */}
        <CapituloDoEdificio scene="corredor" variant="edificio-nitido">
          <EscolhaSection />
        </CapituloDoEdificio>
        <RespiroSection />
        <CapituloDoEdificio scene="mesa">
          <FaqCompactSection />
          <ConviteSection />
        </CapituloDoEdificio>
      </RevealGroup>
      {/* O motor do vidro dinâmico: os cards solidificam na zona de leitura
          e voltam a vidro ao sair (decisão do Fundador, 23/08). */}
      <VidroDinamico />
    </>
  );
}
