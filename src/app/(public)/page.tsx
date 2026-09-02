import type { Metadata } from "next";

import { metadataPublica } from "@/lib/metadata-publica";

import {
  AmbienteConcierge,
  AmbienteCuradoria,
  AmbienteEscolha,
  AmbienteRecepcao,
} from "@/components/landing/editorial/ambientes-responsivos";
import { FioDeCuidado } from "@/components/landing/editorial/fio-de-cuidado";
import { VidroDinamico } from "@/components/landing/editorial/vidro-dinamico";

export const metadata: Metadata = {
  title: { absolute: "Aliviar Curadoria Médica — Uma decisão de saúde importante" },
  description: "Com você em cada etapa. Da sua história até uma decisão que é sua.",
  // Canônico + Open Graph vêm juntos, de uma fonte só: escrever só a `url`
  // aqui trocaria o objeto `openGraph` inteiro herdado do layout e a página
  // perderia a imagem do link. Ver src/lib/metadata-publica.ts.
  ...metadataPublica({
    rota: "/",
    titulo: "Aliviar Curadoria Médica — Uma decisão de saúde importante",
    descricao: "Com você em cada etapa. Da sua história até uma decisão que é sua.",
  }),
};

/**
 * A LANDING RESPONSIVA (Dossiê da Landing Responsiva, decisão do Fundador,
 * 23/08) — mobile first, quatro ambientes fotográficos e nenhum a mais:
 *
 *   Recepção → Curadoria → Escolha médica → Concierge
 *
 * Cada seção ocupa uma tela (`100svh`), a fotografia é servida na versão
 * certa para o aparelho (`<picture>`), e o conteúdo vive num card de vidro
 * sobre a área livre planejada da cena. O Fio de Cuidado costura as
 * passagens: muitos caminhos se organizam em três, e os três convergem em
 * um quando a decisão é tomada.
 *
 * O EFEITO TRANSLÚCIDO permanece (decisão do Fundador sobre a spec): o
 * card nasce vidro quase incolor, clareia com a rolagem e fica branco na
 * zona de leitura — em vez do vidro fixo que o dossiê propunha.
 *
 * O que saiu da página por esta decisão, com a copy CONGELADA nos
 * componentes: os cinco passos da jornada, os fatos 3/29/1/0, "o que não
 * fazemos", o Respiro e as Dúvidas frequentes. As duas últimas eram
 * protegidas pela D-1 — a remoção é o rito em voz alta, não silêncio.
 */
export default function HomePage() {
  return (
    <>
      <AmbienteRecepcao />
      <FioDeCuidado forma="ramifica" />
      <AmbienteCuradoria />
      <FioDeCuidado forma="tres" />
      <AmbienteEscolha />
      <FioDeCuidado forma="converge" />
      <AmbienteConcierge />
      <VidroDinamico />
    </>
  );
}
