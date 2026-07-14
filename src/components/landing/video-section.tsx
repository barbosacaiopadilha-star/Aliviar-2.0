"use client";

import { Maximize2, Play, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GoldCornerAccent } from "@/components/landing/gold-corner-accent";
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
        onClick={(event) => {
          event.stopPropagation();
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

// Popup de vídeo em tela cheia — o "efeito popup" que faltava na
// experiência: fundo escurece (fade simples), cartão salta pra tela (leve
// overshoot via .animate-pop-in). Esc, clique fora, ou o X fecham; foco
// vai para o botão de fechar ao abrir e volta pro gatilho ao fechar
// (mesmo padrão do Dialog em src/components/ui/dialog.tsx).
function VideoModal({
  open,
  onClose,
  src,
  poster,
}: {
  open: boolean;
  onClose: () => void;
  src?: string;
  poster?: string;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal-overlay flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        aria-label="Fechar vídeo"
        className="animate-fade-in absolute inset-0 bg-ink/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Vídeo institucional Aliviar"
        className="animate-pop-in relative z-modal w-full max-w-3xl"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar vídeo"
          className="absolute -top-12 right-0 inline-flex size-10 items-center justify-center rounded-full border border-surface/25 bg-surface/10 text-surface backdrop-blur-sm transition-colors duration-fast ease-standard hover:bg-surface/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-surface/15">
          <VideoFrame src={src} poster={poster} />
        </div>
      </div>
    </div>
  );
}

export function VideoSection({ src, poster, variant = "section" }: VideoSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (variant === "window") {
    return (
      <>
        <div className="relative mx-auto w-full">
          <GoldCornerAccent className="-right-3 -top-3 size-20 lg:size-28" />
          <div
            role="button"
            tabIndex={0}
            onClick={() => setModalOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setModalOpen(true);
              }
            }}
            aria-label="Abrir vídeo institucional em tela cheia"
            className="group relative w-full cursor-pointer overflow-hidden rounded-2xl shadow-xl ring-1 ring-surface/15 transition-transform duration-base ease-standard hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <VideoFrame src={src} poster={poster} />
            <span
              aria-hidden="true"
              className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-ink/50 text-surface opacity-0 backdrop-blur-sm transition-opacity duration-base ease-standard group-hover:opacity-100"
            >
              <Maximize2 className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
        <VideoModal open={modalOpen} onClose={() => setModalOpen(false)} src={src} poster={poster} />
      </>
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
