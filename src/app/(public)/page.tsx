import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { FaqBookSection } from "@/components/landing/faq-book-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { HeroExperience } from "@/components/landing/v2/hero-experience";
import {
  ComoDecidimosSection,
  ComoFuncionaSection,
  MetodoSection,
  ProblemaSection,
} from "@/components/landing/v2/metodo-sections";
import {
  CompartilhadaSection,
  PrioridadesSection,
  RelatorioSection,
} from "@/components/landing/v2/curadoria-sections";
import {
  PortalPacienteSection,
  QuemSomosSection,
} from "@/components/landing/v2/presenca-sections";

// LANDING 2.0 (MISSÃO 201, ADR-033) — a porta de entrada do Método Aliviar.
//
// Estrutura exata da missão: Hero → Problema → Método → Como funciona →
// [Como tomamos decisões, seção inédita] → Perfil de Prioridades → Curadoria
// Compartilhada → Relatório → Portal do Paciente → Quem somos → FAQ → Contato.
//
// O vídeo é o protagonista (ADR-033, supersede o papel ambiente da ADR-026);
// a comunicação abandona qualquer discurso de IA — a mensagem é Método,
// Curadoria, Critério, Decisão Compartilhada. FAQ (Biblioteca) e Contato
// (Convite final) permanecem os componentes já aprovados — a 2.0 é evolução
// da Landing atual, nunca outro produto.
//
// O PortalExperience anterior permanece no repositório como histórico até a
// revisão decidir seu destino (ADR-033).
export const metadata: Metadata = {
  title: { absolute: "Aliviar Curadoria Médica — Uma escolha de cuidado, nunca sozinho" },
  description:
    "Um método claro para decidir sobre sua saúde: você define o que importa, um Curador conduz, e você escolhe entre três opções explicadas com calma.",
};

const VIDEO_SRC = "/videos/video-institucional-aliviar.webm";
const VIDEO_POSTER = "/images/video-institucional-poster.webp";

// Resolvido em disco no build/render — se o vídeo não existir, o Hero degrada
// para mensagem + ações, sem moldura vazia e sem parecer carregando.
function resolveVideo(): { src?: string; poster?: string } {
  const videoPath = path.join(process.cwd(), "public", VIDEO_SRC);
  if (!existsSync(videoPath)) return {};

  const posterPath = path.join(process.cwd(), "public", VIDEO_POSTER);
  return {
    src: VIDEO_SRC,
    poster: existsSync(posterPath) ? VIDEO_POSTER : undefined,
  };
}

export default function HomePage() {
  const video = resolveVideo();

  return (
    <>
      {/* Hero pinado com a dinâmica do vídeo de aliviar-temp (ADR-033):
          sobe → centraliza → crossfade para o vídeo → zoom → pausa. */}
      <HeroExperience videoSrc={video.src} videoPoster={video.poster} />
      <ProblemaSection />
      <MetodoSection />
      <ComoFuncionaSection />
      <ComoDecidimosSection />
      <PrioridadesSection />
      <CompartilhadaSection />
      <RelatorioSection />
      <PortalPacienteSection />
      <QuemSomosSection />
      <FaqBookSection />
      <FinalCtaSection />
    </>
  );
}
