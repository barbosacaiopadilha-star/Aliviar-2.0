import { existsSync } from "node:fs";
import path from "node:path";

import type { Metadata } from "next";

import { FaqBookSection } from "@/components/landing/faq-book-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { PortalExperience } from "@/components/landing/portal-experience";

// LANDING — PORTAL, ETAPA 1 (arquitetura base). PortalExperience é o
// ambiente único e permanente (Hero → Entrada → Triagem → Análise →
// Curadoria, com Benefícios/Confiança/Seleção/Agendamento/Atendimento
// absorvidos dentro da parada Curadoria) — sem fio dourado, sem vídeo,
// sem GSAP ainda: só a arquitetura do lugar (paredes, profundidade,
// iluminação, crossfade). FaqBookSection e FinalCtaSection seguem como
// estão até as Etapas 5 e 6 do plano do Portal reconstruírem a Biblioteca
// e a coreografia de Convite/Saída.
export const metadata: Metadata = {
  title: { absolute: "Aliviar Curadoria Médica — Uma escolha de cuidado, nunca sozinho" },
  description:
    "Curadoria médica independente, com acompanhamento humano em cada etapa — do primeiro contato à conversa que importa.",
};

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

  return (
    <>
      <PortalExperience photoSrc={heroPhoto} />
      <FaqBookSection />
      <FinalCtaSection />
    </>
  );
}
