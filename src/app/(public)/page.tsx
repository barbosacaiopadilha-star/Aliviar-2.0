import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { FaqSection } from "@/components/landing/faq-section";
import { ScrollStory } from "@/components/landing/scroll-story/scroll-story";
import { SCROLL_STORY_SCENES } from "@/components/landing/scroll-story/scenes-data";

// LANDING V3: a Landing deixou de ser uma pilha de seções e passou a ser
// uma experiência de rolagem contínua (ScrollStory) — ver
// docs/LANDING_V3_SCENES.md e o conceito aprovado. Hero, PrimaryCtaBand,
// VideoSection, HowItWorksSection, BenefitsSection, WhyTrustSection,
// ConciergeSection e FinalCtaSection deixaram de ser renderizados aqui;
// os arquivos permanecem no repositório (código reutilizável), só não
// são mais importados.
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

// Loop ambiente (mudo, decorativo) para a cena 0 enquanto o vídeo
// institucional real não existe — ver comentário em scene-background.tsx.
const AMBIENT_VIDEO_SRC = "/scenes/recepcao-ambient.webm";

function resolveAmbientVideo(): string | undefined {
  const ambientPath = path.join(process.cwd(), "public", AMBIENT_VIDEO_SRC);
  return existsSync(ambientPath) ? AMBIENT_VIDEO_SRC : undefined;
}

// Checagem de existência em disco (build/render time, servidor) por cena —
// mesmo padrão do vídeo institucional: nunca aponta para um arquivo que não
// existe, cai no gradiente de fallback até a foto real ser adicionada.
function resolveScenePhotos(): Record<string, string | undefined> {
  const resolved: Record<string, string | undefined> = {};
  for (const scene of SCROLL_STORY_SCENES) {
    if (!scene.photoSrc) continue;
    const filePath = path.join(process.cwd(), "public", scene.photoSrc);
    resolved[scene.id] = existsSync(filePath) ? scene.photoSrc : undefined;
  }
  return resolved;
}

export default function HomePage() {
  const institutionalVideo = resolveInstitutionalVideo();
  const ambientVideoSrc = resolveAmbientVideo();
  const resolvedPhotos = resolveScenePhotos();

  return (
    <>
      <ScrollStory
        videoSrc={institutionalVideo.src}
        videoPoster={institutionalVideo.poster}
        ambientVideoSrc={ambientVideoSrc}
        resolvedPhotos={resolvedPhotos}
      />
      <FaqSection />
    </>
  );
}
