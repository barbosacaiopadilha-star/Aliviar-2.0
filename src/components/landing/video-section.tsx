import { Play } from "lucide-react";

import { SectionContainer } from "@/components/landing/section-container";

type VideoSectionProps = {
  src?: string;
  poster?: string;
};

export function VideoSection({ src, poster }: VideoSectionProps) {
  return (
    <SectionContainer
      id="video-institucional"
      className="scroll-mt-20 bg-brand-primary-deep py-16 lg:py-24"
    >
      <div className="mx-auto max-w-reading text-center">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-brand-sage-light">
          Cerca de 10 minutos
        </span>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-surface lg:text-4xl">
          Entenda a Aliviar antes de dar o próximo passo
        </h2>
        <p className="mt-3 text-base text-surface/80">
          O porquê, o como, e quem estará com você — em um só lugar, no seu tempo.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-content">
        {src ? (
          <video
            className="aspect-video w-full rounded-lg border border-brand-primary shadow-lg"
            src={src}
            poster={poster}
            controls
            preload="none"
          >
            Seu navegador não é compatível com a reprodução deste vídeo.
          </video>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-brand-sage/40 bg-brand-primary px-6 text-center shadow-lg">
            <span
              aria-hidden="true"
              className="inline-flex size-14 items-center justify-center rounded-full bg-surface/10"
            >
              <Play className="size-6 text-surface" aria-hidden="true" />
            </span>
            <p className="text-sm text-surface/80">Vídeo institucional em produção.</p>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
