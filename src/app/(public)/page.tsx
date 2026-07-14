import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { BenefitsSection } from "@/components/landing/benefits-section";
import { FaqBookSection } from "@/components/landing/faq-book-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { HeroJourneySection } from "@/components/landing/hero-journey-section";
import { WhyTrustSection } from "@/components/landing/why-trust-section";

// LANDING V5 — experiência narrativa imersiva: HeroJourneySection (texto
// de abertura + vídeo institucional "em destaque" que acompanha a
// jornada em 6 etapas via GSAP pin, some na metade) → Benefits (3 cards)
// → FaqBookSection (livro físico de Dúvidas/Soluções, vira página ao
// tocar/rolar) → critérios de avaliação → CTA final. O "fio de ouro"
// (GoldenThread) atravessa as seções que mais precisam de continuidade
// visual entre si.
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
