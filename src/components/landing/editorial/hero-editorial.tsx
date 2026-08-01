import { existsSync } from "node:fs";
import path from "node:path";

import { LinkButton } from "@/components/landing/link-button";
import { ImmersiveBackdrop } from "@/components/shared/immersive-backdrop";

const VIDEO_SRC = "/videos/video-institucional-aliviar.webm";
const VIDEO_POSTER = "/images/video-institucional-poster.webp";

function resolveVideo(): { src?: string; poster?: string } {
  const videoPath = path.join(process.cwd(), "public", VIDEO_SRC);
  if (!existsSync(videoPath)) return {};
  const posterPath = path.join(process.cwd(), "public", VIDEO_POSTER);
  return {
    src: VIDEO_SRC,
    poster: existsSync(posterPath) ? VIDEO_POSTER : undefined,
  };
}

type HeroEditorialProps = {
  videoSrc?: string;
  videoPoster?: string;
};

export function HeroEditorial({ videoSrc, videoPoster }: HeroEditorialProps = {}) {
  const video = videoSrc !== undefined ? { src: videoSrc, poster: videoPoster } : resolveVideo();

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
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <LinkButton href="/sua-historia" variant="primary" className="w-full sm:w-auto">
              Contar minha história
            </LinkButton>
            <LinkButton href="/login" variant="secondary" className="w-full sm:w-auto">
              Entrar na minha Jornada
            </LinkButton>
          </div>
        </div>

        {video.src ? (
          <div className="landing-approach mx-auto mt-20 max-w-4xl" style={{ animationDelay: "160ms" }}>
            <div className="landing-video-cinema">
              <video
                src={video.src}
                poster={video.poster}
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                aria-label="Vídeo institucional da Aliviar — ambiente de acolhimento"
                className="aspect-video w-full object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
