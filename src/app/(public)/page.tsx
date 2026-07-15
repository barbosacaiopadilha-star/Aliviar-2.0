import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { BenefitsSection } from "@/components/landing/benefits-section";
import { FaqBookSection } from "@/components/landing/faq-book-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { HeroJourneySection } from "@/components/landing/hero-journey-section";
import { WhyTrustSection } from "@/components/landing/why-trust-section";

// LANDING V6 — a página inteira é a recepção da Aliviar: HeroJourneySection
// é o cenário (foto + vídeo, ambos parados — position:sticky, nunca pin/
// scale/fade) com a legenda trocando por crossfade conforme a rolagem
// passa pelas 6 etapas → Benefits (3 cards) → FaqBookSection (livro
// físico de Dúvidas/Soluções, vira página ao tocar/rolar) → critérios de
// avaliação → CTA final. O "fio de ouro" (GoldenThread) atravessa as
// seções com a curvatura do símbolo da marca (mãos em concha).
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
const VIDEO_INSTITUCIONAL_SRC = "/videos/video-institucional-aliviar.webm";
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

// Foto do hero (public/scenes/) — versão com luz reforçada
// (recepcao-bright.jpg, tratada a partir do original via sharp: exposição
// e temperatura de cor levemente realçadas, mesma foto, nunca substituída
// por banco de imagens). Mesmo padrão de checagem em disco: cai no
// gradiente de fallback do Hero até a fotografia editorial real existir.
const HERO_PHOTO_SRC = "/scenes/recepcao-bright.jpg";

function resolveScenePhoto(relativeSrc: string): string | undefined {
  const filePath = path.join(process.cwd(), "public", relativeSrc);
  return existsSync(filePath) ? relativeSrc : undefined;
}

export default function HomePage() {
  const institutionalVideo = resolveInstitutionalVideo();
  const heroPhoto = resolveScenePhoto(HERO_PHOTO_SRC);

  return (
    <>
      <HeroJourneySection
        photoSrc={heroPhoto}
        videoSrc={institutionalVideo.src}
        videoPoster={institutionalVideo.poster}
      />
      <BenefitsSection />
      <FaqBookSection />
      <WhyTrustSection />
      <FinalCtaSection />
    </>
  );
}
