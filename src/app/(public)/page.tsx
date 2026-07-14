import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { BenefitsSection } from "@/components/landing/benefits-section";
import { DuvidasStackSection } from "@/components/landing/duvidas-stack-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { Hero } from "@/components/landing/hero";
import { StageRevealSection } from "@/components/landing/stage-reveal-section";
import { WhyTrustSection } from "@/components/landing/why-trust-section";

// LANDING V4 — estrutura e dinâmicas de rolagem próximas da referência
// (aliviar-temp.vercel.app, produto irmão da mesma empresa), com a
// identidade da Aliviar Curadoria Médica (navy/sage/gold, nunca a paleta
// teal/coral do produto irmão): Hero (foto full-bleed + vídeo
// institucional embutido) → Benefits (3 cards) → StageRevealSection
// (texto fixado na tela trocando de etapa conforme rolagem, com linha de
// progresso — GSAP ScrollTrigger) → DuvidasStackSection (pilha de cards
// com flip 3D Dúvida/Solução, fixada durante a rolagem — mesma técnica)
// → critérios de avaliação → CTA final.
export const metadata: Metadata = {
  title: { absolute: "Aliviar Curadoria Médica — Uma escolha de cuidado, nunca sozinho" },
  description:
    "Curadoria médica independente, com acompanhamento humano em cada etapa — do primeiro contato à conversa que importa.",
};

// Caminhos oficiais reservados para o vídeo institucional da Landing
// (docs/VIDEO_INSTITUCIONAL_LANDING.md) — a VideoSection já sabe renderizar
// o player real quando recebe src/poster, e o estado "em produção" quando
// não recebe nada. Checagem de existência em disco (build/render time, só
// aqui, nunca em runtime do cliente) evita apontar para um arquivo
// inexistente enquanto o vídeo definitivo não for adicionado.
const VIDEO_INSTITUCIONAL_SRC = "/videos/video-institucional-aliviar.mp4";
const VIDEO_INSTITUCIONAL_POSTER = "/images/video-institucional-poster.webp";

function resolveInstitutionalVideo(): { src?: string; poster?: string } {
  const videoPath = path.join(process.cwd(), "public", VIDEO_INSTITUCIONAL_SRC);
  if (!existsSync(videoPath)) return {};

  const posterPath = path.join(process.cwd(), "public", VIDEO_INSTITUCIONAL_POSTER);
  return {
    src: VIDEO_INSTITUCIONAL_SRC,
    poster: existsSync(posterPath) ? VIDEO_INSTITUCIONAL_POSTER : undefined,
  };
}

// Foto do hero (public/scenes/) — mesmo padrão de checagem em disco: cai
// no gradiente de fallback do Hero até a fotografia editorial real da
// Aliviar existir.
const HERO_PHOTO_SRC = "/scenes/recepcao.jpg";

function resolveScenePhoto(relativeSrc: string): string | undefined {
  const filePath = path.join(process.cwd(), "public", relativeSrc);
  return existsSync(filePath) ? relativeSrc : undefined;
}

export default function HomePage() {
  const institutionalVideo = resolveInstitutionalVideo();
  const heroPhoto = resolveScenePhoto(HERO_PHOTO_SRC);

  return (
    <>
      <Hero photoSrc={heroPhoto} videoSrc={institutionalVideo.src} videoPoster={institutionalVideo.poster} />
      <BenefitsSection />
      <StageRevealSection />
      <DuvidasStackSection />
      <WhyTrustSection />
      <FinalCtaSection />
    </>
  );
}
