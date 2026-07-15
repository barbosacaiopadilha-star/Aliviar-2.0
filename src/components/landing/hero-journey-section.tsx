"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { GoldenThread } from "@/components/landing/golden-thread";
import { LinkButton } from "@/components/landing/link-button";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { VideoSection } from "@/components/landing/video-section";
import { cn } from "@/components/ui/cn";

type HeroJourneySectionProps = {
  photoSrc?: string;
  videoSrc?: string;
  videoPoster?: string;
};

// A Landing inteira é a recepção da Aliviar. O vídeo é o palco: fica
// sempre no mesmo lugar, no mesmo tamanho — nunca escala, nunca some,
// nunca faz parallax, como uma tela instalada na sala (nunca
// position:sticky/fixed nele mesmo — é o CENÁRIO ao redor que gruda via
// sticky, o vídeo só nunca se move dentro dele). Quem se move é a
// legenda ao redor: cada etapa troca por crossfade no mesmo lugar
// conforme a rolagem avança — o visitante sente que a experiência
// acontece, não que ele "desceu a página".
const STAGES = [
  "Triagem",
  "Análise do caso",
  "Curadoria técnica",
  "Seleção dos profissionais",
  "Agendamento",
  "Atendimento",
] as const;

const FRAME_COUNT = STAGES.length + 1;

export function HeroJourneySection({ photoSrc, videoSrc, videoPoster }: HeroJourneySectionProps) {
  const sentinelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeFrame, setActiveFrame] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduceMotion);
    setReady(true);
    if (reduceMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = sentinelRefs.current.findIndex((el) => el === entry.target);
          if (index !== -1) setActiveFrame(index);
        });
      },
      { threshold: 0.5 },
    );

    sentinelRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const introFrame = (
    <div className="flex flex-col items-center gap-4">
      <SectionEyebrow>Curadoria médica independente</SectionEyebrow>
      <h1 className="max-w-reading font-serif text-3xl font-semibold leading-[1.1] text-ink lg:text-4xl">
        Uma escolha de cuidado, <span className="text-brand-gold">nunca sozinho</span>.
      </h1>
      <LinkButton href="/sua-historia" variant="primary">
        Contar minha história
      </LinkButton>
    </div>
  );

  const stageFrames = STAGES.map((stage, index) => (
    <div key={stage} className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.16em] tabular-nums text-brand-gold">
        Etapa 0{index + 1} de 0{STAGES.length}
      </span>
      <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">{stage}</p>
    </div>
  ));

  const captionFrames = [introFrame, ...stageFrames];

  if (ready && reduced) {
    return (
      <section className="relative overflow-hidden px-4 py-16 lg:px-8">
        {photoSrc && <Image src={photoSrc} alt="" fill className="object-cover" sizes="100vw" />}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_30%,_transparent_0%,_color-mix(in_srgb,_var(--color-bg-canvas)_55%,_transparent)_100%)]"
        />

        <div className="relative mx-auto max-w-reading text-center">
          <SectionEyebrow>Curadoria médica independente</SectionEyebrow>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.08] text-ink lg:text-5xl">
            Uma escolha de cuidado, <span className="text-brand-gold">nunca sozinho</span>.
          </h1>
          <div className="mt-8 flex justify-center">
            <LinkButton href="/sua-historia" variant="primary">
              Contar minha história
            </LinkButton>
          </div>
        </div>
        <div className="relative mx-auto mt-10 w-full max-w-[15rem]">
          <VideoSection variant="window" src={videoSrc} poster={videoPoster} />
        </div>
        <ul className="relative mx-auto mt-10 flex max-w-content flex-col gap-3 text-center sm:flex-row sm:flex-wrap sm:justify-center">
          {STAGES.map((stage, index) => (
            <li key={stage} className="font-serif text-lg text-ink-muted">
              <span className="mr-2 text-xs font-medium tabular-nums text-brand-gold">0{index + 1}</span>
              {stage}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="relative bg-canvas" style={{ height: `${FRAME_COUNT * 100}svh` }}>
      {/* Sentinelas invisíveis — só para a IntersectionObserver saber em
          qual "sala" da recepção o visitante está; não têm papel visual. */}
      {Array.from({ length: FRAME_COUNT }).map((_, index) => (
        <div
          key={index}
          ref={(el) => {
            sentinelRefs.current[index] = el;
          }}
          aria-hidden="true"
          className="absolute inset-x-0 h-svh"
          style={{ top: `${index * 100}svh` }}
        />
      ))}

      {/* O cenário: gruda na tela (sticky) enquanto o visitante rola por
          dentro da recepção — nunca desliza, nunca dá zoom, nunca faz
          parallax. Libera sozinho, sem fade nem escala, ao fim das 6
          etapas (mecânica nativa do sticky, nenhum JS de saída). */}
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {photoSrc && <Image src={photoSrc} alt="" fill priority className="object-cover" sizes="100vw" />}

        <GoldenThread
          d="M340 0 C 100 130, 100 460, 300 620 C 400 700, 340 800, 200 900"
          viewBox="0 0 400 900"
          className="left-1/2 top-0 h-full w-40 -translate-x-1/2 opacity-60 lg:w-64"
          glow
        />

        {/* O palco — vídeo, sempre no mesmo lugar, no mesmo tamanho. */}
        <div className="absolute left-1/2 top-[38%] w-full max-w-[15rem] -translate-x-1/2 -translate-y-1/2 px-4">
          <VideoSection variant="window" src={videoSrc} poster={videoPoster} />
        </div>

        {/* A legenda — único elemento que "acontece": crossfade no mesmo
            lugar, nunca deslizando, nunca entrando de lado. */}
        <div className="absolute inset-x-0 bottom-[10%] px-4">
          <div className="relative mx-auto flex min-h-[9rem] max-w-reading items-end justify-center">
            {captionFrames.map((frame, index) => (
              <div
                key={index}
                className={cn(
                  "absolute inset-x-0 bottom-0 text-center transition-opacity duration-700 ease-standard",
                  activeFrame === index ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                <div className="mx-auto inline-flex flex-col items-center gap-3 rounded-3xl bg-surface/60 px-6 py-5 backdrop-blur-md">
                  {frame}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
