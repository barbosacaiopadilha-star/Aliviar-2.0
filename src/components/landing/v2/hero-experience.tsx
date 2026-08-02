"use client";

import { useEffect, useRef, useState } from "react";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";

import { LinkButton } from "@/components/landing/link-button";
import { cn } from "@/components/ui/cn";

// LANDING 2.0 — HERO EXPERIENCE (MISSÃO 201, ADR-033)
//
// Replica a dinâmica do vídeo-destaque de aliviar-temp.vercel.app, pedida
// explicitamente pelo responsável ("na mesma dinâmica e aplicação"): hero
// pinado por scroll (GSAP ScrollTrigger, mesmo padrão do faq-book-section),
// em cinco fases —
//   FASE 1 (0–25%):  o player nasce abaixo do título (top 75%) e sobe até o
//                    centro (50%), com o fundo em parallax.
//   FASE 2 (25–40%): player centralizado; o subtítulo aparece abaixo dele.
//   FASE 3 (40–55%): a capa faz crossfade para o vídeo, que começa a tocar.
//   FASE 4 (55–85%): o player faz zoom até o tamanho final; fundo e título
//                    desaparecem; o subtítulo acompanha.
//   FASE 5 (85–100%): pausa no tamanho máximo.
// Mobile (≤768px): pin mais curto (2×vh, só subida+zoom), mesmos ritmos do
// site de referência.
//
// A dinâmica é a da referência; a pele é a nossa — gradiente navy da marca no
// lugar da foto, moldura limpa no lugar do frame_player.png (a direção
// criativa veta copiar a estética; a ordem do responsável cobre a dinâmica e
// a aplicação do vídeo). O vídeo é o mesmo arquivo byte a byte (clinica.webm
// ≡ video-institucional-aliviar.webm, verificado por hash).
//
// prefers-reduced-motion: sem pin e sem fases — layout estático com o vídeo
// visível, mesma degradação já usada no resto da Landing.

// Largura do player por faixa de viewport — os mesmos números da referência.
function responsiveSizes(vw: number) {
  if (vw <= 400) return { initialWidth: 75, initialMax: 280, finalWidth: 98 };
  if (vw <= 768) return { initialWidth: 60, initialMax: 350, finalWidth: 95 };
  if (vw <= 991) return { initialWidth: 50, initialMax: 500, finalWidth: 85 };
  return { initialWidth: 20, initialMax: 320, finalWidth: 65 };
}

type HeroExperienceProps = {
  videoSrc?: string;
  videoPoster?: string;
};

export function HeroExperience({ videoSrc, videoPoster }: HeroExperienceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (!videoSrc) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Sem pin e sem fases — o layout estático assume (render abaixo).
      setReducedMotion(true);
      return;
    }

    let cancelled = false;
    let trigger: ScrollTriggerType | null = null;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const section = sectionRef.current;
      const bg = bgRef.current;
      const title = titleRef.current;
      const frame = frameRef.current;
      const cover = coverRef.current;
      const subtitle = subtitleRef.current;
      const video = videoRef.current;
      if (!section || !bg || !title || !frame || !cover || !subtitle || !video) return;

      const isMobile = window.innerWidth <= 768;
      const scrollDistance = window.innerHeight * (isMobile ? 2 : 4);
      const sizes = responsiveSizes(window.innerWidth);

      trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: `+=${scrollDistance}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.5,
        onUpdate: (self) => {
          const p = self.progress;

          let frameTop: number;
          let bgY: number;
          let bgOpacity = 1;
          let titleOpacity = 1;

          if (isMobile) {
            // Sobe 65% → 50% (0–30%), depois só zoom; parallax leve de 15vh.
            frameTop = p < 0.3 ? 65 - (p / 0.3) * 15 : 50;
            bgY = -(p * 15);
            if (p >= 0.35) titleOpacity = Math.max(0, 1 - (p - 0.35) / 0.2);
          } else {
            // FASE 1: tudo sobe junto (75% → 50%, fundo -25vh).
            if (p < 0.25) {
              frameTop = 75 - (p / 0.25) * 25;
              bgY = -((p / 0.25) * 25);
            } else {
              frameTop = 50;
              bgY = -25 - ((p - 0.25) / 0.75) * 20; // parallax contínuo
            }
            // FASE 4: fundo e título desaparecem durante o zoom.
            if (p >= 0.55) {
              const fade = (p - 0.55) / 0.2;
              bgOpacity = Math.max(0, 1 - fade);
              titleOpacity = Math.max(0, 1 - fade);
            }
          }

          // Zoom do player (FASE 4 desktop / a partir de 30% no mobile).
          const zoomStart = isMobile ? 0.3 : 0.55;
          const zoomEnd = 0.85;
          const zoom =
            p <= zoomStart ? 0 : p >= zoomEnd ? 1 : (p - zoomStart) / (zoomEnd - zoomStart);
          const width = sizes.initialWidth + (sizes.finalWidth - sizes.initialWidth) * zoom;

          // FASE 3: crossfade capa → vídeo, e o vídeo passa a tocar.
          const fadeStart = isMobile ? 0.32 : 0.4;
          const fadeEnd = isMobile ? 0.5 : 0.55;
          const videoOpacity =
            p <= fadeStart ? 0 : p >= fadeEnd ? 1 : (p - fadeStart) / (fadeEnd - fadeStart);

          bg.style.transform = `translateY(${bgY}vh)`;
          bg.style.opacity = String(bgOpacity);
          title.style.opacity = String(titleOpacity);
          title.style.pointerEvents = titleOpacity < 0.3 ? "none" : "";
          frame.style.top = `${frameTop}%`;
          frame.style.width = `${width}%`;
          frame.style.maxWidth = zoom > 0 ? "none" : `${sizes.initialMax}px`;
          cover.style.opacity = String(1 - videoOpacity);

          // FASE 2b: subtítulo aparece com o player centralizado e escala
          // discretamente junto do zoom.
          const subStart = isMobile ? 0.15 : 0.28;
          const subOpacity = p <= subStart ? 0 : Math.min(1, (p - subStart) / 0.1);
          subtitle.style.opacity = String(subOpacity);
          subtitle.style.transform = `translateX(-50%) scale(${1 + zoom * 0.06})`;

          if (videoOpacity > 0.05 && video.paused) {
            video.play().catch(() => {});
            setVideoVisible(true);
          } else if (videoOpacity <= 0.05 && !video.paused) {
            video.pause();
            setVideoVisible(false);
          }
        },
      });
    })();

    return () => {
      cancelled = true;
      trigger?.kill();
    };
  }, [videoSrc]);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = soundOn;
    setSoundOn(!soundOn);
  }

  // Sem vídeo no build (hero degrada sem moldura vazia) ou com
  // prefers-reduced-motion (sem pin, sem fases): layout estático.
  if (!videoSrc || reducedMotion) {
    return (
      <section className="bg-[linear-gradient(170deg,_var(--color-brand-primary-deep)_0%,_var(--color-brand-primary)_55%,_color-mix(in_srgb,_var(--color-brand-sage)_45%,_var(--color-brand-primary))_100%)]">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-content flex-col items-center justify-center gap-8 px-4 py-16 text-center lg:px-8">
          <HeroTitle />
          {videoSrc ? (
            <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--color-bg-surface)_25%,transparent)] shadow-lg">
              <video
                src={videoSrc}
                poster={videoPoster}
                muted
                loop
                playsInline
                controls
                preload="metadata"
                aria-label="Vídeo da Aliviar — o ambiente de cuidado da Curadoria"
                className="aspect-video w-full object-cover"
              />
            </div>
          ) : null}
          <HeroActions />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Apresentação"
      className="relative h-screen overflow-hidden"
    >
      {/* Fundo — gradiente da marca com parallax (a referência usa foto;
          nossa direção criativa mantém a pele da marca). */}
      <div
        ref={bgRef}
        aria-hidden="true"
        className="absolute inset-0 will-change-transform bg-[linear-gradient(170deg,_var(--color-brand-primary-deep)_0%,_var(--color-brand-primary)_55%,_color-mix(in_srgb,_var(--color-brand-sage)_45%,_var(--color-brand-primary))_130%)]"
      />

      {/* Título + ações — presentes desde o primeiro frame, somem no zoom. */}
      <div
        ref={titleRef}
        className="absolute inset-x-0 top-[14%] mx-auto flex max-w-content flex-col items-center gap-6 px-4 text-center lg:px-8"
      >
        <HeroTitle />
        <HeroActions />
      </div>

      {/* Player — nasce abaixo do título e cresce até quase a tela toda. */}
      <div
        ref={frameRef}
        className="absolute left-1/2 w-1/2 max-w-[500px] -translate-x-1/2 -translate-y-1/2 lg:w-1/5 lg:max-w-[320px]"
        style={{ top: "75%" }}
      >
        <div className="relative overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--color-bg-surface)_25%,transparent)] shadow-lg">
          <video
            ref={videoRef}
            src={videoSrc}
            poster={videoPoster}
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Vídeo da Aliviar — o ambiente de cuidado da Curadoria"
            className="aspect-video w-full object-cover"
          />
          {/* Capa — vivo desde o primeiro frame, nunca um retângulo preto.
              Faz crossfade para o vídeo na FASE 3. */}
          <div
            ref={coverRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[linear-gradient(150deg,_var(--color-brand-primary)_0%,_var(--color-brand-primary-deep)_100%)]"
          >
            <p className="font-serif text-2xl text-[color-mix(in_srgb,var(--color-bg-surface)_90%,transparent)]">Aliviar</p>
          </div>

          <button
            type="button"
            onClick={toggleSound}
            className={cn(
              "absolute bottom-3 right-3 inline-flex min-h-9 items-center gap-2 rounded-md bg-[color-mix(in_srgb,var(--color-ink)_60%,transparent)] px-3 py-1.5 text-xs font-medium text-surface backdrop-blur transition-opacity duration-base ease-standard",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
              videoVisible ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {soundOn ? "Silenciar" : "Ativar som"}
          </button>
        </div>
      </div>

      {/* Subtítulo — aparece com o player centralizado (FASE 2b). */}
      <div
        ref={subtitleRef}
        className="absolute left-1/2 top-[85%] w-full max-w-reading -translate-x-1/2 px-4 text-center opacity-0"
      >
        <p className="text-base leading-relaxed text-[color-mix(in_srgb,var(--color-bg-surface)_90%,transparent)] lg:text-lg">
          Com você em cada etapa — da sua história até a escolha do médico certo para você.
        </p>
      </div>
    </section>
  );
}

function HeroTitle() {
  return (
    <h1 className="max-w-reading font-serif text-4xl font-semibold leading-tight text-surface lg:text-5xl">
      Uma decisão de saúde importante.
      <br />
      <span className="text-brand-gold">Você não precisa tomá-la sozinho.</span>
    </h1>
  );
}

function HeroActions() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
      <LinkButton href="/sua-historia" variant="primary" className="w-full sm:w-auto">
        Contar minha história
      </LinkButton>
      {/* Aponta para /login enquanto a Jornada não tem autenticação: em
          produção, /portal-paciente é público e mostraria a jornada de
          demonstração a qualquer visitante. A ligação direta com a Jornada
          (MISSÃO 206) volta quando a autenticação real entrar. */}
      <LinkButton
        href="/login"
        variant="secondary"
        className="w-full border-[color-mix(in_srgb,var(--color-bg-surface)_40%,transparent)] bg-transparent text-surface hover:border-brand-gold sm:w-auto"
      >
        Acessar minha Jornada
      </LinkButton>
    </div>
  );
}
