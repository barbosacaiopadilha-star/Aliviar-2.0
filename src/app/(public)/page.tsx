import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { FaqBookSection } from "@/components/landing/faq-book-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { PortalExperience } from "@/components/landing/portal-experience";
import { PORTAL_SCENES } from "@/components/landing/portal-scenes";

// LANDING — ARQUITETURA DO ACOLHIMENTO. PortalExperience é o ambiente
// único e permanente (Chegada → Respiro → Triagem → Análise → Curadoria,
// com Benefícios/Confiança/Seleção-Agendamento-Atendimento absorvidos
// como continuação da Curadoria) — cada parada existe para proteger uma
// emoção específica, nunca para demonstrar arquitetura. A direção de
// fotografia (portal-scenes.ts) é seis enquadramentos da mesma locação,
// resolvidos aqui em disco. O Vídeo Companheiro acompanha até o início
// da Curadoria e se despede aos poucos; o Fio Dourado atravessa a
// experiência inteira como presença discreta. FaqBookSection (Biblioteca)
// e FinalCtaSection (Convite) seguem como componentes próprios, com
// paleta alinhada ao mesmo ambiente acolhedor.
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

// Resolve cada cena de portal-scenes.ts em disco — se algum arquivo
// específico ainda não existir (ex.: uma cena da V1.1 ainda não
// fotografada), cai para a última cena que existir antes dela, nunca
// quebra e nunca mostra uma imagem ausente.
function resolvePortalScenes(): Array<{ id: string; src: string }> {
  const resolved: Array<{ id: string; src: string }> = [];
  let lastSrc: string | undefined;

  for (const scene of PORTAL_SCENES) {
    const filePath = path.join(process.cwd(), "public", scene.src);
    if (existsSync(filePath)) {
      lastSrc = scene.src;
      resolved.push({ id: scene.id, src: scene.src });
    } else if (lastSrc) {
      resolved.push({ id: scene.id, src: lastSrc });
    }
  }

  return resolved;
}

export default function HomePage() {
  const scenes = resolvePortalScenes();
  const institutionalVideo = resolveInstitutionalVideo();

  return (
    <>
      <PortalExperience scenes={scenes} videoSrc={institutionalVideo.src} videoPoster={institutionalVideo.poster} />
      <FaqBookSection />
      <FinalCtaSection />
    </>
  );
}
