"use client";

import { Play, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";

import { SectionContainer } from "@/components/landing/section-container";
import { SectionReveal } from "@/components/landing/section-reveal";
import { cn } from "@/components/ui/cn";

type VideoSectionProps = {
  src?: string;
  poster?: string;
  /** "section" (padrão): bloco full-bleed com heading, como seção própria.
   *  "window": cartão contido, usado dentro do Hero (ao lado do título,
   *  nunca position:fixed). Mesma lógica vídeo-ou-placeholder, sem
   *  duplicar código. */
  variant?: "section" | "window";
};

// Reprodução em loop, muda por padrão, com um botão próprio de "Ativar
// Som" sobreposto — a mesma apresentação do vídeo institucional no site
// de referência (autoplay silencioso, nunca barra de controles nativa
// competindo com o resto do hero). Sem `src`, cai no selo de marca
// (placeholder honesto, nunca fabricado).
function VideoFrame({ src, poster, compact }: { src?: string; poster?: string; compact?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  if (!src) {
    return (
      <div
        className={cn(
          "relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[inherit] bg-[radial-gradient(120%_140%_at_50%_0%,_var(--color-brand-primary)_0%,_var(--color-brand-primary-deep)_55%,_#0a2544_100%)] text-center",
          compact ? "px-2" : "flex-col gap-4 px-6",
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay [background-image:radial-gradient(circle_at_1px_1px,_var(--color-brand-sage-light)_1px,_transparent_0)] [background-size:22px_22px]"
        />
        <span
          aria-hidden="true"
          className={cn(
            "relative inline-flex items-center justify-center rounded-full border border-surface/25 bg-surface/10 backdrop-blur-sm",
            compact ? "size-8" : "size-16",
          )}
        >
          <Play className={cn("translate-x-0.5 text-surface", compact ? "size-3.5" : "size-6")} aria-hidden="true" />
        </span>
        {!compact && (
          <div className="relative space-y-1">
            <p className="font-serif text-lg font-medium text-surface lg:text-xl">
              Conheça a Curadoria Médica Aliviar
            </p>
            <p className="text-sm text-brand-sage-light">Vídeo institucional em breve.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[inherit] bg-brand-primary-deep">
      <video
        ref={videoRef}
        className="size-full object-cover"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
      >
        Seu navegador não é compatível com a reprodução deste vídeo.
      </video>
      <button
        type="button"
        onClick={() => {
          const video = videoRef.current;
          if (!video) return;
          video.muted = !video.muted;
          setMuted(video.muted);
        }}
        className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink/60 px-3 py-1.5 text-xs font-medium text-surface backdrop-blur-sm transition-colors duration-fast ease-standard hover:bg-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        {muted ? <Volume2 className="size-3.5" aria-hidden="true" /> : <VolumeX className="size-3.5" aria-hidden="true" />}
        {muted ? "Ativar som" : "Silenciar"}
      </button>
    </div>
  );
}

export function VideoSection({ src, poster, variant = "section" }: VideoSectionProps) {
  if (variant === "window") {
    return (
      <div className="mx-auto w-full overflow-hidden rounded-2xl shadow-xl ring-1 ring-surface/15">
        <VideoFrame src={src} poster={poster} />
      </div>
    );
  }

  return (
    <SectionContainer
      id="video-institucional"
      className="scroll-mt-20 bg-brand-primary-deep py-16 lg:py-24"
    >
      <SectionReveal className="mx-auto max-w-reading text-center">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-brand-sage-light">
          Cerca de 10 minutos
        </span>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-surface lg:text-4xl">
          Entenda a Aliviar antes de dar o próximo passo
        </h2>
        <p className="mt-3 text-base text-surface/80">
          O porquê, o como, e quem estará com você — em um só lugar, no seu tempo.
        </p>
      </SectionReveal>

      <div className="mx-auto mt-10 max-w-content overflow-hidden rounded-lg border border-brand-primary shadow-lg">
        <VideoFrame src={src} poster={poster} />
      </div>
    </SectionContainer>
  );
}
