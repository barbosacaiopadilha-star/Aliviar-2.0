import { existsSync } from "node:fs";
import path from "node:path";

import { HeroVideo } from "@/components/landing/editorial/hero-video";
import { LinkButton } from "@/components/landing/link-button";
import { ImmersiveBackdrop } from "@/components/shared/immersive-backdrop";
import { ALIVIAR_SCENES } from "@/lib/aliviar-environments";

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
      <ImmersiveBackdrop scene="landingHero" variant="landing-hero" imageOpacity={62} priority />

      <div className="relative z-10 mx-auto w-full max-w-content px-5 lg:px-10">
        <div className="landing-fade-in mx-auto max-w-3xl text-center">
          <p className="landing-eyebrow">Curadoria médica independente</p>
          <h1 className="landing-hero-title text-4xl sm:text-[2.75rem] lg:text-[3.5rem]">
            Uma decisão de saúde importante.
            <br />
            Você não precisa tomá-la sozinho.
          </h1>
          {/* Sem "o médico certo para você": prometer o certo é prometer
              resultado, e a Fachada nunca promete mais do que o interior
              entrega (L14; Linguagem §6 — família de "ideal"). A decisão é
              dela; a companhia é nossa. */}
          <p className="landing-body mx-auto mt-8 max-w-2xl text-lg text-[var(--color-ink-muted)]">
            Com você em cada etapa — da sua história até uma decisão que é sua.
          </p>
          {/* UMA porta (CRITICA_LANDING_2_2 §5): o primeiro gesto de quem
              chegou com medo não pode ser descartar uma opção que não era
              para ela. Quem já mora aqui entra pelo "Entrar" do cabeçalho —
              reconhecimento mora na moldura, não no palco. A `landing-porta`
              é o gesto da marca: a soleira dourada que se revela devagar. */}
          <div className="mt-12 flex justify-center">
            <LinkButton
              href="/sua-historia"
              variant="primary"
              className="landing-porta w-full sm:w-auto"
            >
              Contar minha história
            </LinkButton>
          </div>
        </div>

        {video.src ? (
          <div className="landing-approach mx-auto mt-20 max-w-4xl" style={{ animationDelay: "160ms" }}>
            <HeroVideo src={video.src} posterScene={ALIVIAR_SCENES.landingHero} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
