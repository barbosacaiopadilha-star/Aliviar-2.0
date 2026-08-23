import { existsSync } from "node:fs";
import path from "node:path";

import { LinkButton } from "@/components/landing/link-button";
import { ImmersiveBackdrop } from "@/components/shared/immersive-backdrop";

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
      {/* ADR-080 · O Edifício Aliviar: o hero é a ENTRADA — o ambiente mais
          nítido e expressivo da página, em tela cheia. A família chega, a
          curadora recebe (sem jaleco), o letreiro "Curadoria Médica
          Independente" está gravado na cena. O texto senta num véu marfim
          translúcido à esquerda — a camada de contraste protege só a região
          do texto, nunca a foto inteira (spec do Fundador, 22/08). */}
      <ImmersiveBackdrop
        scene="entrada"
        variant="edificio-nitido"
        imageOpacity={100}
        imagePosition="right center"
        priority
      />

      <div className="relative z-10 mx-auto w-full max-w-content px-5 lg:px-10">
        <div className="landing-hero-grid">
          <div className="landing-fade-in landing-hero-col landing-veu p-7 sm:p-10 lg:p-12">
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

          {/* ADR-080: a coluna direita fica LIVRE de propósito — é onde a
              cena mostra a família no balcão. A foto deixou de ser cartão
              para ser o próprio ambiente da seção. */}
        </div>
      </div>
    </section>
  );
}
