import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { ConnectionZone } from "@/components/landing/connection-zone";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalSection } from "@/components/landing/final-section";
import { PersistentVideo } from "@/components/landing/persistent-video";
import { ReceptionSection } from "@/components/landing/reception-section";

// LANDING V3 (revisão 5 — vídeo persistente): o vídeo institucional é
// renderizado por PersistentVideo (position: fixed, nunca remontado — som
// nunca reinicia), permanece visível durante toda a visita e encolhe para
// um "companheiro" no canto assim que a Recepção sai da viewport.
// ReceptionSection (cor como protagonista) → ConnectionZone (travessia só
// de luz/tipografia) → FinalSection (encerramento) → FaqSection. Hero,
// PrimaryCtaBand, HowItWorksSection, BenefitsSection, WhyTrustSection,
// ConciergeSection e FinalCtaSection permanecem no repositório (código
// reutilizável), só não são mais importados.
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

// Fotos dos dois ambientes (public/scenes/) — mesmo padrão de checagem em
// disco: cai no gradiente de fallback de cada seção até a fotografia
// editorial real da Aliviar existir. Ver docs/LANDING_V3_SCENES.md.
const RECEPTION_PHOTO_SRC = "/scenes/recepcao.jpg";
const FINAL_PHOTO_SRC = "/scenes/grand-finale.jpg";

function resolveScenePhoto(relativeSrc: string): string | undefined {
  const filePath = path.join(process.cwd(), "public", relativeSrc);
  return existsSync(filePath) ? relativeSrc : undefined;
}

export default function HomePage() {
  const institutionalVideo = resolveInstitutionalVideo();
  const receptionPhoto = resolveScenePhoto(RECEPTION_PHOTO_SRC);
  const finalPhoto = resolveScenePhoto(FINAL_PHOTO_SRC);

  return (
    <>
      <ReceptionSection photoSrc={receptionPhoto} />
      <PersistentVideo videoSrc={institutionalVideo.src} videoPoster={institutionalVideo.poster} />
      <ConnectionZone />
      <FinalSection photoSrc={finalPhoto} />
      <FaqSection />
    </>
  );
}
