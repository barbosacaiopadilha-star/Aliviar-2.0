import { existsSync } from "node:fs";
import path from "node:path";

import { LinkButton } from "@/components/landing/link-button";

const VIDEO_SRC = "/videos/video-institucional-aliviar.webm";

function resolveVideo(): { src?: string } {
  const videoPath = path.join(process.cwd(), "public", VIDEO_SRC);
  return existsSync(videoPath) ? { src: VIDEO_SRC } : {};
}

type HeroEditorialProps = {
  videoSrc?: string;
};

export function HeroEditorial({ videoSrc }: HeroEditorialProps = {}) {
  const video = videoSrc !== undefined ? { src: videoSrc } : resolveVideo();

  return (
    <section className="landing-hero-immersive">
      {/* Fidelidade ao mockup do Fundador (2ª rodada de anotações, 22/08):
          o Hero é chão de linho LIMPO, título à esquerda, e a fotografia da
          conversa como peça GRANDE à direita — não fundo, não cartão
          pequeno. É a distribuição do mockup, pixel a pixel. */}

      {/* BLOCO 7 · duas colunas a partir de 1024px. Abaixo disso empilha
          título → corpo → vídeo → CTA, com o vídeo em largura total: em
          mobile o vídeo antes do gesto é o que dá contexto ao gesto. */}
      <div className="relative z-10 mx-auto w-full max-w-content px-5 lg:px-10">
        <div className="landing-hero-grid">
          <div className="landing-fade-in landing-hero-col">
            {/* A frase que estava aqui — "Curadoria médica independente" — não
                se perdeu: virou o primeiro diferencial do bloco
                institucional, onde é verificável em vez de decorativa. */}
            <p className="landing-eyebrow">Capítulo Zero</p>
            <h1 className="landing-hero-title text-4xl sm:text-[2.75rem] lg:text-[3.5rem]">
              Uma decisão de saúde importante.
              <br />
              Você não precisa tomá-la sozinho.
            </h1>
            {/* Sem "o médico certo para você": prometer o certo é prometer
                resultado, e a Fachada nunca promete mais do que o interior
                entrega (L14; Linguagem §6 — família de "ideal"). A decisão é
                dela; a companhia é nossa. */}
            <p className="landing-body mt-8 max-w-2xl text-lg text-[var(--color-ink-muted)]">
              Com você em cada etapa — da sua história até uma decisão que é sua.
            </p>

            {/* A porta continua sendo UMA (CRITICA_LANDING_2_2 §5): o segundo
                botão não é outra porta, é o mesmo conteúdo que já estava na
                página — o vídeo — agora alcançável por teclado em vez de só
                por rolagem. A `landing-porta` é o gesto da marca. */}
            <div className="landing-hero-ctas mt-12">
              <LinkButton
                href="/solicitar-atendimento"
                variant="primary"
                className="landing-porta w-full sm:w-auto"
              >
                Solicitar atendimento
              </LinkButton>
              {video.src ? (
                <a href="#video-institucional" className="landing-hero-cta-secundario">
                  Assistir ao vídeo
                </a>
              ) : null}
            </div>
          </div>

          <div
            className="landing-approach landing-hero-col overflow-hidden rounded-3xl shadow-xl"
            style={{ animationDelay: "160ms" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- cena
                estática de public/landing, mesmo uso das demais. */}
            <img
              src="/landing/hero-conversa-recepcao.jpg"
              alt="Uma conversa na recepção da Aliviar — duas pessoas sentadas, uma escuta a outra"
              className="aspect-[4/3] h-full w-full object-cover lg:aspect-auto lg:min-h-[30rem]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
