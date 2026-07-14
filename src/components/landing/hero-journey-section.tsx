"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { GoldenThread } from "@/components/landing/golden-thread";
import { LinkButton } from "@/components/landing/link-button";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { VideoSection } from "@/components/landing/video-section";

type HeroJourneySectionProps = {
  photoSrc?: string;
  videoSrc?: string;
  videoPoster?: string;
};

// O vídeo representa o paciente: começa em destaque assim que a seção de
// jornada é alcançada (primeiro quadro do pin) e permanece visível
// enquanto as 3 primeiras etapas passam — na metade (índice 3 de 6),
// desaparece (fade + leve redução de escala, nunca elástico) porque "o
// paciente já entrou no fluxo". As etapas continuam sozinhas até o fim.
const STAGES = [
  "Triagem",
  "Análise do caso",
  "Curadoria técnica",
  "Seleção dos profissionais",
  "Agendamento",
  "Atendimento",
] as const;

const RELEASE_AT_INDEX = 3;

export function HeroJourneySection({ photoSrc, videoSrc, videoPoster }: HeroJourneySectionProps) {
  const heroMomentRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduceMotion);
    setReady(true);
    if (reduceMotion) return;

    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // Parallax discreto: a foto se desloca um pouco mais devagar que o
        // texto durante o momento do Hero — profundidade sutil, amplitude
        // pequena o bastante para nunca revelar as bordas da imagem (que já
        // tem folga extra via .animate-slow-zoom).
        if (photoRef.current && heroMomentRef.current) {
          gsap.to(photoRef.current, {
            yPercent: 10,
            ease: "none",
            scrollTrigger: {
              trigger: heroMomentRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }

        gsap.set(
          stageRefs.current.filter((_, i) => i > 0),
          { opacity: 0 },
        );

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: journeyRef.current,
            start: "top top",
            end: `+=${STAGES.length * 100}%`,
            scrub: 1,
            pin: true,
          },
        });

        STAGES.forEach((_, index) => {
          if (index > 0) {
            timeline.to(stageRefs.current[index - 1], { opacity: 0, duration: 0.3 }, index);
            timeline.to(stageRefs.current[index], { opacity: 1, duration: 0.3 }, index);
          }
          timeline.to(
            progressRef.current,
            { height: `${((index + 1) / STAGES.length) * 100}%`, duration: 0.3 },
            index,
          );
          timeline.to(dotRef.current, { top: `${((index + 1) / STAGES.length) * 100}%`, duration: 0.3 }, index);
        });

        timeline.to(
          videoWrapRef.current,
          { opacity: 0, scale: 0.94, pointerEvents: "none", duration: 0.6, ease: "power2.out" },
          RELEASE_AT_INDEX,
        );
      }, journeyRef);
    })();

    return () => ctx?.revert();
  }, []);

  return (
    <section className="relative">
      {/* Momento do Hero — texto de abertura, nunca pinado, rolagem normal. */}
      <div
        ref={heroMomentRef}
        className="relative flex min-h-[80svh] items-center overflow-hidden bg-[color-mix(in_srgb,_var(--color-brand-sage)_70%,_var(--color-ink))] px-4 pb-16 pt-28 lg:px-8 lg:pt-32"
      >
        {photoSrc && (
          <div ref={photoRef} className="absolute inset-0">
            <Image src={photoSrc} alt="" fill priority className="animate-slow-zoom object-cover" sizes="100vw" />
          </div>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(120deg,_color-mix(in_srgb,_var(--color-brand-sage)_75%,_var(--color-ink))_0%,_color-mix(in_srgb,_var(--color-brand-sage)_75%,_var(--color-ink))_42%,_color-mix(in_srgb,_var(--color-brand-sage)_60%,_transparent)_70%,_color-mix(in_srgb,_var(--color-brand-sage)_40%,_transparent)_100%)]"
        />
        <div className="relative mx-auto max-w-reading text-center">
          <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
            <SectionEyebrow tone="dark">Curadoria médica independente</SectionEyebrow>
          </div>
          <h1
            className="animate-fade-up mt-4 font-serif text-4xl font-semibold leading-[1.08] text-surface lg:text-5xl"
            style={{ animationDelay: "90ms" }}
          >
            Uma escolha de cuidado, <span className="text-brand-gold">nunca sozinho</span>.
          </h1>
          <div
            aria-hidden="true"
            className="gold-divider animate-fade-up mx-auto mt-5"
            style={{ animationDelay: "180ms" }}
          />
          <p className="animate-fade-up mt-5 text-lg text-surface/85" style={{ animationDelay: "240ms" }}>
            Você conta sua história no seu tempo. Alguém da nossa equipe organiza um caminho
            claro, com critério — e caminha ao seu lado até a conversa que importa.
          </p>
          <div
            className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
            style={{ animationDelay: "320ms" }}
          >
            <LinkButton href="/sua-historia" variant="primary">
              Contar minha história
            </LinkButton>
          </div>
        </div>
      </div>

      <GoldenThread
        d="M60 0 C 180 140, -20 340, 140 480 C 260 590, 40 700, 180 800"
        className="left-1/2 top-0 h-full w-40 -translate-x-1/2 opacity-70 lg:w-64"
        glow
      />

      {/* Jornada acompanhada — vídeo em destaque, sticky visual via pin
          GSAP (toda a seção fica presa à viewport durante o scroll das 6
          etapas, então o vídeo já está "grudado" por definição; some na
          metade). Fallback sem motion: vídeo estático + lista simples. */}
      {ready && reduced ? (
        <div className="bg-[color-mix(in_srgb,_var(--color-brand-sage)_45%,_var(--color-bg-canvas))] px-4 py-16 lg:px-8">
          <div className="mx-auto w-full max-w-xs">
            <VideoSection variant="window" src={videoSrc} poster={videoPoster} />
          </div>
          <ul className="mx-auto mt-10 flex max-w-content flex-col gap-4 text-center sm:flex-row sm:flex-wrap sm:justify-center">
            {STAGES.map((stage, index) => (
              <li key={stage} className="font-serif text-xl text-ink-muted">
                <span className="mr-2 text-xs font-medium tabular-nums text-brand-gold">
                  0{index + 1}
                </span>
                {stage}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div
          ref={journeyRef}
          className="relative bg-[color-mix(in_srgb,_var(--color-brand-sage)_45%,_var(--color-bg-canvas))]"
        >
          <div className="relative flex min-h-screen flex-col items-center justify-center gap-10 overflow-hidden px-4 py-16 lg:px-8">
            <div ref={videoWrapRef} className="mx-auto w-full max-w-[15rem]">
              <VideoSection variant="window" src={videoSrc} poster={videoPoster} />
            </div>

            <div className="relative text-center">
              <div className="grid">
                {STAGES.map((stage, index) => (
                  <div
                    key={stage}
                    ref={(el) => {
                      stageRefs.current[index] = el;
                    }}
                    className="col-start-1 row-start-1"
                  >
                    <span className="block text-xs font-medium uppercase tracking-[0.16em] tabular-nums text-brand-gold">
                      Etapa 0{index + 1} de 0{STAGES.length}
                    </span>
                    <p className="mt-2 font-serif text-3xl font-medium leading-tight text-ink lg:text-5xl">
                      {stage}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex h-32 w-px flex-col items-center bg-border">
              <div ref={progressRef} className="w-px bg-brand-gold" style={{ height: "0%" }} />
              <div
                ref={dotRef}
                className="absolute left-1/2 size-3 -translate-x-1/2 rounded-full bg-brand-gold shadow-[0_0_0_4px_rgba(176,141,87,0.2)]"
                style={{ top: "0%" }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
