import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { BenefitsSection } from "@/components/landing/benefits-section";
import { ConciergeSection } from "@/components/landing/concierge-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { Hero } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PrimaryCtaBand } from "@/components/landing/primary-cta-band";
import { ProcessSection } from "@/components/landing/process-section";
import { VideoSection } from "@/components/landing/video-section";
import { WhyTrustSection } from "@/components/landing/why-trust-section";

export const metadata: Metadata = {
  title: { absolute: "Aliviar Curadoria Médica — Você não precisa enfrentar isso sozinho" },
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

export default function HomePage() {
  const institutionalVideo = resolveInstitutionalVideo();

  return (
    <>
      <Hero />
      <PrimaryCtaBand />
      <VideoSection src={institutionalVideo.src} poster={institutionalVideo.poster} />
      <HowItWorksSection />
      <BenefitsSection />
      <ProcessSection />
      <WhyTrustSection />
      <ConciergeSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
