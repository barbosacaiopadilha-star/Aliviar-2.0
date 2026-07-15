"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  GoldenThread,
  type GoldenThreadHandle,
} from "@/components/landing/golden-thread";
import {
  COMPANION_VIDEO_EXIT_TIMELINE,
  getCompanionVideoExitFrameRange,
  isCompanionVideoExiting,
} from "@/components/landing/portal-companion-video";
import { computeContinuousPresence } from "@/components/landing/portal-continuous-presence";
import {
  createEnvironmentEngine,
  type EnvironmentEngine,
} from "@/components/landing/portal-environment";
import { computePortalExitState } from "@/components/landing/portal-exit-transition";
import { FRAMES } from "@/components/landing/portal-frames";
import {
  computeNarrativeFrame,
  TOTAL_HEIGHT_VH,
} from "@/components/landing/portal-narrative";
import { computePhotographyFrame } from "@/components/landing/portal-photography";
import { usePortalMotionPreference } from "@/components/landing/use-portal-motion-preference";
import { usePortalRawProgress } from "@/components/landing/use-portal-raw-progress";
import { VideoSection } from "@/components/landing/video-section";
import { cn } from "@/components/ui/cn";

type PortalExperienceProps = {
  /** Direção de fotografia já resolvida em disco (page.tsx) — sempre um
   *  array não vazio, na mesma ordem de PORTAL_SCENES. Trocar fotografias
   *  no futuro é editar portal-scenes.ts, nunca este componente. */
  scenes: Array<{ id: string; src: string }>;
  videoSrc?: string;
  videoPoster?: string;
};

// Física + conteúdo de cada parada agora vivem em portal-frames.tsx
// (Camada de Configuração, docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md
// §1) — este componente é o motor que as interpreta, nunca a fonte delas.
// TOTAL_HEIGHT_VH e FRAME_OFFSETS agora vivem em portal-narrative.ts
// (Motor Narrativo) — mesmo valor, mesma derivação, só relocados.

// HANDOFF_START (Transição de Saída) e BREATH_PERIOD_MS/BREATH_AMPLITUDE
// (Presença Contínua) agora vivem em portal-exit-transition.ts e
// portal-continuous-presence.ts — mesmos valores, mesma derivação, só
// relocados (Playbook, Etapa 6).

export function PortalExperience({
  scenes,
  videoSrc,
  videoPoster,
}: PortalExperienceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const sentinelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const warmthGlowRef = useRef<HTMLDivElement>(null);
  const leftEdgeRef = useRef<HTMLDivElement>(null);
  const rightEdgeRef = useRef<HTMLDivElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const videoInnerRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<Array<HTMLDivElement | null>>([]);
  const goldenThreadRef = useRef<GoldenThreadHandle>(null);
  const [activeFrame, setActiveFrame] = useState(0);
  const { prefersReducedMotion, ready } = usePortalMotionPreference();
  // Nenhum motor contínuo do Portal começa antes de a preferência real ser
  // conhecida — evita que um motor chegue a agendar um quadro só para ser
  // cancelado no instante seguinte (mesmo valor consumido pela ramificação
  // final de render, abaixo).
  const motorsEnabled = ready && !prefersReducedMotion;

  // Canal de foco: qual parada está ativa. Discreto e nítido de propósito
  // — é o conteúdo que protagoniza, o ambiente ao redor é sempre mais
  // lento e mais discreto que ele.
  useEffect(() => {
    if (!motorsEnabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = sentinelRefs.current.findIndex(
            (el) => el === entry.target,
          );
          if (index !== -1) setActiveFrame(index);
        });
      },
      { threshold: 0.5 },
    );

    sentinelRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [motorsEnabled]);

  // Despedida do vídeo companheiro — conduzida pelo progresso real do
  // scroll (nunca uma animação de duração fixa desconectada do gesto):
  // opacidade, escala e blur avançam e recuam junto com o visitante ao
  // longo do trecho Curadoria → Benefícios. A montagem do GSAP continua
  // aqui (é imperativa, ligada a DOM/refs/elemento de vídeo) — só os
  // valores de configuração (índices de sentinela, keyframes do tween)
  // vêm agora do Motor de Vídeo Companheiro (portal-companion-video.ts).
  // Achado registrado ali, não corrigido aqui: este efeito nunca leu o
  // Progresso Bruto — o ScrollTrigger do GSAP tem seu próprio mecanismo
  // de observação de scroll, independente do nosso.
  useEffect(() => {
    if (!motorsEnabled || !videoSrc) return;

    const { startFrameIndex, endFrameIndex } =
      getCompanionVideoExitFrameRange();
    const exitStart = sentinelRefs.current[startFrameIndex];
    const exitEnd = sentinelRefs.current[endFrameIndex];
    const videoEl = videoInnerRef.current;
    if (!exitStart || !exitEnd || !videoEl) return;

    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: exitStart,
            start: "top bottom",
            endTrigger: exitEnd,
            end: "bottom top",
            scrub: true,
          },
        });
        for (const step of COMPANION_VIDEO_EXIT_TIMELINE) {
          timeline.to(videoEl, step);
        }
      });
    })();

    return () => ctx?.revert();
  }, [motorsEnabled, videoSrc]);

  // Motor da Caminhada — traduz a posição de scroll (Motor de Progresso
  // Bruto, use-portal-raw-progress.ts) num alvo interpolado entre as duas
  // paradas vizinhas, e três canais (calor/luz, intensidade da presença,
  // temperatura do ambiente) perseguem esse alvo cada um com sua própria
  // inércia. Escreve direto no DOM via refs a cada quadro (nunca via
  // state) para não gerar dezenas de renderizações por segundo. Pausa
  // quando o Portal sai da viewport (responsabilidade do motor de
  // progresso, não deste efeito).
  const environmentEngineRef = useRef<EnvironmentEngine>(
    createEnvironmentEngine({
      lightX: FRAMES[0].lightX,
      lightY: FRAMES[0].lightY,
      intensidade: FRAMES[0].intensidade,
      warmth: FRAMES[0].warmth,
      compact: FRAMES[0].compact,
    }),
  );

  usePortalRawProgress(sectionRef, motorsEnabled, (overall, now) => {
    // Onde estou narrativamente (Motor Narrativo) → parâmetros
    // atmosféricos contínuos (Motor de Ambiente, portal-environment.ts)
    // — mesma matemática de sempre (lerp por canal + amortecimento
    // independente), agora testada isoladamente nos dois motores.
    const narrative = computeNarrativeFrame(overall);
    const state = environmentEngineRef.current.step(narrative);

    // Presença Contínua (Fio Dourado) e Transição de Saída (aproximação
    // da Biblioteca) — dois motores de acabamento independentes um do
    // outro (Playbook, Etapa 6): o primeiro só de `now`, o segundo só de
    // `overall`. Nenhum dos dois conhece o outro nem o Ambiente.
    const { breath, threadOpacity } = computeContinuousPresence(now);
    const { portalPresence: presence } = computePortalExitState(overall);

    // Fio Dourado — deliberadamente NÃO multiplicado por `presence`: é o
    // único elemento que atravessa a costura Portal→Biblioteca sem
    // desvanecer (decisão já registrada antes desta etapa) — só o pulso
    // muda, a presença do traço em si permanece contínua.
    goldenThreadRef.current?.setPulse(threadOpacity);

    // Direção de fotografia — crossfade entre cenas (Motor de
    // Fotografia, portal-photography.ts), numa linha do tempo própria,
    // independente dos frames de conteúdo. Nunca um corte: as duas cenas
    // vizinhas se sobrepõem suavemente. `scenes.length` (a prop já
    // resolvida em disco) substitui a antiga leitura de
    // `sceneRefs.current.length` — mesmo número, por construção (um ref
    // por cena renderizada), sem o motor precisar tocar em ref.
    const {
      fromIndex: s0,
      toIndex: s1,
      localProgress: sceneT,
    } = computePhotographyFrame(overall, scenes.length);
    sceneRefs.current.forEach((el, index) => {
      if (!el) return;
      const opacity = index === s0 ? 1 - sceneT : index === s1 ? sceneT : 0;
      el.style.opacity = String(opacity * presence);
    });

    if (warmthGlowRef.current) {
      const warmthPercent = ((state.warmth + 1) / 2) * 100;
      warmthGlowRef.current.style.background = `radial-gradient(60% 55% at ${state.lightX}% ${state.lightY}%, color-mix(in srgb, var(--color-brand-gold) ${warmthPercent * 0.35}%, var(--color-brand-sage) ${100 - warmthPercent * 0.35}%) 0%, transparent 72%)`;
      warmthGlowRef.current.style.opacity = String(
        Math.max((state.intensidade * 0.55 + breath) * presence, 0),
      );
    }
    // Bordas — esmaecimento orgânico e morno, nunca uma barra: formas
    // suaves, muito desfocadas, em tons da própria paleta (nunca preto).
    const edgeOpacity = (0.28 + state.intensidade * 0.32) * presence;
    if (leftEdgeRef.current)
      leftEdgeRef.current.style.opacity = String(edgeOpacity);
    if (rightEdgeRef.current)
      rightEdgeRef.current.style.opacity = String(edgeOpacity);
    if (cardWrapRef.current) {
      cardWrapRef.current.style.maxWidth = `${40 - state.compact * 6}rem`;
      cardWrapRef.current.style.opacity = String(presence);
    }
  });

  if (ready && prefersReducedMotion) {
    return (
      <section className="relative overflow-hidden bg-canvas px-4 py-16 lg:px-8">
        {scenes[0] && (
          <Image
            src={scenes[0].src}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_30%,_transparent_0%,_color-mix(in_srgb,_var(--color-bg-canvas)_55%,_transparent)_100%)]"
        />
        <div className="relative mx-auto flex max-w-reading flex-col items-center gap-16">
          {FRAMES.filter((frame) => frame.content).map((frame) => (
            <div key={frame.id} className="w-full text-center">
              {frame.content}
            </div>
          ))}
        </div>
      </section>
    );
  }

  let cumulativeVh = 0;
  const isThreshold = activeFrame === 0;
  const isVideoExiting = isCompanionVideoExiting(activeFrame);

  return (
    <section
      ref={sectionRef}
      className="relative bg-canvas"
      style={{ height: `${TOTAL_HEIGHT_VH}svh` }}
    >
      {FRAMES.map((frameDef, index) => {
        const top = cumulativeVh;
        cumulativeVh += frameDef.heightVh;
        return (
          <div
            key={frameDef.id}
            ref={(el) => {
              sentinelRefs.current[index] = el;
            }}
            aria-hidden="true"
            className="absolute inset-x-0"
            style={{ top: `${top}svh`, height: `${frameDef.heightVh}svh` }}
          />
        );
      })}

      {/* O ambiente — permanente, nunca troca de cenário abrupto: seis
          enquadramentos da MESMA locação (portal-scenes.ts), em crossfade
          contínuo conforme o visitante avança — como olhar para o mesmo
          lugar de ângulos diferentes, nunca fotografias independentes.
          Dissolve-se no marfim da Biblioteca só nos últimos instantes (ver
          "handoff" no Motor da Caminhada). */}
      <div className="sticky top-0 h-svh w-full overflow-hidden bg-canvas">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            ref={(el) => {
              sceneRefs.current[index] = el;
            }}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ opacity: index === 0 ? 1 : 0 }}
          >
            <Image
              src={scene.src}
              alt=""
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}

        {/* Calor ambiente — nunca um holofote: um brilho morno, muito
            desfocado, que se desloca devagar e muda de temperatura
            conforme a jornada avança. Escrito pelo Motor da Caminhada. */}
        <div
          ref={warmthGlowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ opacity: 0.1 }}
        />

        {/* Bordas — esmaecimento orgânico e morno (nunca preto, nunca
            barra reta): formas elípticas, muito desfocadas, ancoradas
            fora da tela, só a franja mais suave é visível. */}
        <div
          ref={leftEdgeRef}
          aria-hidden="true"
          className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in srgb, var(--color-brand-primary-deep) 55%, transparent), transparent)",
            opacity: 0,
          }}
        />
        <div
          ref={rightEdgeRef}
          aria-hidden="true"
          className="pointer-events-none absolute -right-1/4 top-0 h-full w-1/2 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in srgb, var(--color-brand-primary-deep) 55%, transparent), transparent)",
            opacity: 0,
          }}
        />

        {/* Vídeo Companheiro — presença, nunca apresentador. Acompanha o
            visitante desde a Chegada até o início da Curadoria, depois se
            despede devagar (ver useEffect da saída, conduzido pelo
            scroll). Nunca maior que o espaço que ocupa, nunca competindo
            com o cartão de conteúdo. */}
        {videoSrc && (
          <div
            className="absolute left-1/2 top-[26%] w-full max-w-[13rem] -translate-x-1/2 -translate-y-1/2 px-4"
            style={{ pointerEvents: isVideoExiting ? "none" : "auto" }}
          >
            <div ref={videoInnerRef}>
              <VideoSection
                variant="window"
                src={videoSrc}
                poster={videoPoster}
              />
            </div>
          </div>
        )}

        {/* Fio Dourado — único, contínuo, integrado à arquitetura: não
            representa progresso, etapas nem carregamento. É presença e
            continuidade — passa perto do lugar onde o conteúdo se apoia,
            como um filete discreto de acabamento, nunca um indicador. */}
        <GoldenThread
          ref={goldenThreadRef}
          d="M260 0 C 120 100, 120 300, 240 380 C 340 440, 300 560, 180 640 C 100 690, 140 720, 220 745"
          viewBox={`0 0 400 ${TOTAL_HEIGHT_VH}`}
          className="left-[18%] top-0 h-full w-32 opacity-45 lg:w-48"
        />

        {/* Chegada — sem chrome de cartão: o visitante está sendo
            recebido, ainda não "dentro" de uma conversa. */}
        <div
          aria-hidden={!isThreshold}
          className={cn(
            "absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 text-center transition-opacity duration-700 ease-standard",
            isThreshold ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {FRAMES[0].content}
        </div>

        {/* Conteúdo das paradas seguintes — cartão translúcido no mesmo
            lugar, crossfade nítido (o foco), contrastando com o ambiente
            lento ao redor (a periferia). */}
        <div className="absolute inset-x-0 bottom-[10%] px-4">
          <div
            ref={cardWrapRef}
            className="relative mx-auto flex min-h-[9rem] max-w-reading items-end justify-center"
          >
            {FRAMES.slice(1).map((frameDef, offset) => {
              const index = offset + 1;
              return (
                <div
                  key={frameDef.id}
                  aria-hidden={activeFrame !== index}
                  className={cn(
                    "absolute inset-x-0 bottom-0 text-center transition-opacity duration-700 ease-standard",
                    activeFrame === index
                      ? "opacity-100"
                      : "pointer-events-none opacity-0",
                  )}
                >
                  {frameDef.content && (
                    <div className="mx-auto inline-flex flex-col items-center gap-3 rounded-3xl bg-surface/65 px-6 py-5 backdrop-blur-md">
                      {frameDef.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
