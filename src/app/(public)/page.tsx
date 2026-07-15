import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { FaqBookSection } from "@/components/landing/faq-book-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { PortalExperience } from "@/components/landing/portal-experience";

// LANDING — ARQUITETURA DO ACOLHIMENTO. PortalExperience é o ambiente
// único e permanente (Chegada → Respiro → Triagem → Análise → Curadoria,
// com Benefícios/Confiança/Seleção-Agendamento-Atendimento absorvidos
// como continuação da Curadoria) — cada parada existe para proteger uma
// emoção específica, nunca para demonstrar arquitetura. O Vídeo
// Companheiro acompanha até o início da Curadoria e se despede aos
// poucos; o Fio Dourado atravessa a experiência inteira como presença
// discreta. FaqBookSection (Biblioteca) e FinalCtaSection (Convite)
// seguem como componentes próprios, com paleta alinhada ao mesmo
// ambiente acolhedor.
export const metadata: Metadata = {
  title: { absolute: "Aliviar Curadoria Médica — Uma escolha de cuidado, nunca sozinho" },
  description:
    "Curadoria médica independente, com acompanhamento humano em cada etapa — do primeiro contato à conversa que importa.",
};

// Caminhos oficiais reservados para o vídeo institucional da Landing
// (docs/VIDEO_INSTITUCIONAL_LANDING.md) — checagem de existência em disco
// (build/render time) evita apontar para um arquivo inexistente enquanto
// o vídeo definitivo não for adicionado.
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
  const heroPhoto = resolveScenePhoto(HERO_PHOTO_SRC);
  const institutionalVideo = resolveInstitutionalVideo();

  return (
    <>
      <PortalExperience photoSrc={heroPhoto} videoSrc={institutionalVideo.src} videoPoster={institutionalVideo.poster} />
      <FaqBookSection />
      <FinalCtaSection />
    </>
  );
}
