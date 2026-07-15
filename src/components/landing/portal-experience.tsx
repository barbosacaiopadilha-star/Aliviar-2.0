"use client";

import { Clock, HeartHandshake, ScanSearch } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";

import { GoldenThread } from "@/components/landing/golden-thread";
import { LinkButton } from "@/components/landing/link-button";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { VideoSection } from "@/components/landing/video-section";
import { cn } from "@/components/ui/cn";

type PortalExperienceProps = {
  photoSrc?: string;
  videoSrc?: string;
  videoPoster?: string;
};

// Vídeo Companheiro — acompanha o visitante durante Triagem, Análise e o
// início da Curadoria (frames 2-4). Começa a se despedir ao entrar na
// Curadoria plena (frame 4) e termina de sair ao longo de Benefícios
// (frame 5) — nunca um corte, sempre conduzido pelo progresso real do
// scroll. Nunca é tutorial, apresentador ou vendedor: só companhia.
const VIDEO_EXIT_AT_FRAME = 5;

// PORTAL DA ALIVIAR — a arquitetura do acolhimento, não de um edifício.
// Cada elemento existe para proteger uma emoção específica (Regra Zero):
// Chegada → Alívio · Respiro → Permissão para desacelerar · Triagem →
// Segurança para falar · Análise → Confiança · Curadoria → Companhia e
// cuidado · (Biblioteca e Convite vivem em componentes próprios, adiante
// na página). O cenário nunca troca de figura — é a mesma fotografia do
// início ao fim — e nunca se comporta como "foto com efeitos por cima":
// a luz é calor ambiente, nunca um holofote; as bordas são um
// esmaecimento orgânico e morno, nunca uma barra de interface.
const BENEFITS: Array<{ icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; title: string; description: string }> = [
  { icon: ScanSearch, title: "Curadoria criteriosa", description: "O caminho mais adequado ao seu caso, com critério." },
  { icon: Clock, title: "Agilidade no processo", description: "Menos espera, menos burocracia, em cada etapa." },
  {
    icon: HeartHandshake,
    title: "Cuidado completo",
    description: "Alguém dedicado, do primeiro contato à conversa que importa.",
  },
];

const CRITERIA: Array<{ title: string; description: string }> = [
  {
    title: "Currículo profissional",
    description: "Formação, especialização e trajetória de cada profissional na Rede Aliviar.",
  },
  {
    title: "Ética e conduta",
    description: "Histórico profissional e conduta ética no cuidado ao paciente.",
  },
  {
    title: "Compatibilidade com o caso",
    description: "Experiência e abordagem compatíveis com a sua situação específica — nunca genérica.",
  },
];

const CONTINUACAO = ["Seleção dos profissionais", "Agendamento", "Atendimento"] as const;

type Frame = {
  id: string;
  /** Emoção protegida por esta parada (documentação — Regra Zero). */
  emocao: string;
  /** Altura da parada — nunca uniforme: paradas de passagem (Respiro) são
   *  breves; paradas de permanência (Curadoria) sustentam mais tempo. */
  heightVh: number;
  content: ReactNode | null;
  /** Origem do calor ambiente (0-100%, percentual do palco) — interpolada
   *  continuamente pelo Motor da Caminhada, nunca salta entre paradas. */
  lightX: number;
  lightY: number;
  /** Intensidade da presença/cuidado (0-1) — cresce conforme a jornada se
   *  aprofunda emocionalmente, não geometricamente. */
  intensidade: number;
  /** Temperatura do ambiente (-1 fria a 1 quente) — canal independente,
   *  com a própria inércia, propositalmente dessincronizado da luz. */
  warmth: number;
  /** Compactação espacial (0-1) — o quanto o ambiente se torna mais
   *  íntimo e próximo conforme o cuidado se aprofunda. */
  compact: number;
};

const FRAMES: Frame[] = [
  {
    id: "chegada",
    emocao: "Alívio — nada aqui exige justificativa, cadastro ou decisão imediata.",
    heightVh: 100,
    lightX: 50,
    lightY: 30,
    intensidade: 0.12,
    warmth: 0.35,
    compact: 0,
    content: (
      <div className="flex flex-col items-center gap-4">
        <SectionEyebrow>Curadoria médica independente</SectionEyebrow>
        <h1 className="max-w-reading font-serif text-4xl font-semibold leading-[1.1] text-ink lg:text-5xl">
          Uma escolha de cuidado, <span className="text-brand-gold">nunca sozinho</span>.
        </h1>
        <LinkButton href="/sua-historia" variant="primary">
          Contar minha história
        </LinkButton>
      </div>
    ),
  },
  // Respiro — sem copy própria: a emoção protegida aqui é a permissão de
  // desacelerar. Para nunca ler como vazio, é o próprio calor ambiente que
  // se aprofunda de forma perceptível (ainda que lenta) nesta parada — o
  // conteúdo do momento é essa transformação sutil, não uma ausência.
  {
    id: "respiro",
    emocao: "Permissão para desacelerar — sem pressa, sem vazio, sem travamento.",
    heightVh: 55,
    content: null,
    lightX: 46,
    lightY: 34,
    intensidade: 0.34,
    warmth: 0.4,
    compact: 0.08,
  },
  {
    id: "triagem",
    emocao: "Segurança para falar — nunca formulário, entrevista ou avaliação.",
    heightVh: 85,
    lightX: 42,
    lightY: 36,
    intensidade: 0.42,
    warmth: 0.32,
    compact: 0.14,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Triagem</p>,
  },
  {
    id: "analise",
    emocao: "Confiança — nunca processo automático, frio ou genérico.",
    heightVh: 90,
    lightX: 58,
    lightY: 37,
    intensidade: 0.52,
    warmth: 0.22,
    compact: 0.2,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Análise do caso</p>,
  },
  {
    id: "curadoria",
    emocao: "Companhia e cuidado — nunca catálogo, comparação comercial ou automação impessoal.",
    heightVh: 110,
    lightX: 50,
    lightY: 38,
    intensidade: 0.6,
    warmth: 0.28,
    compact: 0.26,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Curadoria técnica</p>,
  },
  {
    id: "beneficios",
    emocao: "Companhia e cuidado (continuação) — o que a curadoria concretamente oferece.",
    heightVh: 110,
    lightX: 40,
    lightY: 40,
    intensidade: 0.68,
    warmth: 0.34,
    compact: 0.32,
    content: (
      <div className="flex flex-col gap-4 text-left">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="flex items-start gap-3">
            <benefit.icon className="mt-1 size-4 shrink-0 text-brand-sage" aria-hidden={true} />
            <div>
              <p className="font-serif text-base font-semibold text-ink">{benefit.title}</p>
              <p className="text-sm text-ink-muted">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "confianca",
    emocao: "Companhia e cuidado (continuação) — o critério por trás da curadoria, sem parecer avaliação fria.",
    heightVh: 110,
    lightX: 60,
    lightY: 41,
    intensidade: 0.76,
    warmth: 0.2,
    compact: 0.38,
    content: (
      <div className="flex flex-col gap-4 text-left">
        {CRITERIA.map((criterion) => (
          <div key={criterion.title}>
            <p className="font-serif text-base font-semibold text-ink">{criterion.title}</p>
            <p className="text-sm text-ink-muted">{criterion.description}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "continuacao",
    emocao: "Companhia e cuidado (continuação) — o que acontece depois de escolhido o caminho.",
    heightVh: 85,
    lightX: 50,
    lightY: 43,
    intensidade: 0.82,
    warmth: 0.3,
    compact: 0.34,
    content: (
      <ul className="flex flex-col gap-2 text-center">
        {CONTINUACAO.map((stage) => (
          <li key={stage} className="font-serif text-xl text-ink">
            {stage}
          </li>
        ))}
      </ul>
    ),
  },
];

const TOTAL_HEIGHT_VH = FRAMES.reduce((sum, frame) => sum + frame.heightVh, 0);

// Fração acumulada (0 a 1) de onde cada parada começa — usada pelo Motor
// da Caminhada para interpolar entre as duas paradas vizinhas a cada
// instante do scroll.
const FRAME_OFFSETS: number[] = (() => {
  const offsets: number[] = [0];
  let acc = 0;
  for (const f of FRAMES) {
    acc += f.heightVh;
    offsets.push(acc / TOTAL_HEIGHT_VH);
  }
  return offsets;
})();

// Inércia (nada reage instantaneamente) com constantes diferentes por
// canal — nunca sincronizados entre si, para nunca "denunciar" um efeito.
const DAMPING = {
  light: 0.045,
  intensidade: 0.035,
  warmth: 0.02,
  compact: 0.08,
};

// Respiração — uma oscilação lentíssima e mínima, independente do scroll,
// que impede o ambiente de parecer congelado mesmo parado.
const BREATH_PERIOD_MS = 9000;
const BREATH_AMPLITUDE = 0.015;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

export function PortalExperience({ photoSrc, videoSrc, videoPoster }: PortalExperienceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const sentinelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const warmthGlowRef = useRef<HTMLDivElement>(null);
  const leftEdgeRef = useRef<HTMLDivElement>(null);
  const rightEdgeRef = useRef<HTMLDivElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const videoInnerRef = useRef<HTMLDivElement>(null);
  const [activeFrame, setActiveFrame] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  // Canal de foco: qual parada está ativa. Discreto e nítido de propósito
  // — é o conteúdo que protagoniza, o ambiente ao redor é sempre mais
  // lento e mais discreto que ele.
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

  // Despedida do vídeo companheiro — conduzida pelo progresso real do
  // scroll (nunca uma animação de duração fixa desconectada do gesto):
  // opacidade, escala e blur avançam e recuam junto com o visitante ao
  // longo do trecho Curadoria → Benefícios.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !videoSrc) return;

    const exitStart = sentinelRefs.current[VIDEO_EXIT_AT_FRAME - 1];
    const exitEnd = sentinelRefs.current[VIDEO_EXIT_AT_FRAME];
    const videoEl = videoInnerRef.current;
    if (!exitStart || !exitEnd || !videoEl) return;

    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: exitStart,
              start: "top bottom",
              endTrigger: exitEnd,
              end: "bottom top",
              scrub: true,
            },
          })
          .to(videoEl, { opacity: 0.8, ease: "none", duration: 1 })
          .to(videoEl, { opacity: 0, scale: 0.93, filter: "blur(6px)", ease: "none", duration: 1 });
      });
    })();

    return () => ctx?.revert();
  }, [videoSrc]);

  // Motor da Caminhada — traduz a posição de scroll num alvo interpolado
  // entre as duas paradas vizinhas, e três canais (calor/luz, intensidade
  // da presença, temperatura do ambiente) perseguem esse alvo cada um com
  // sua própria inércia. Escreve direto no DOM via refs a cada quadro
  // (nunca via state) para não gerar dezenas de renderizações por
  // segundo. Pausa quando o Portal sai da viewport.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const state = {
      lightX: FRAMES[0].lightX,
      lightY: FRAMES[0].lightY,
      intensidade: FRAMES[0].intensidade,
      warmth: FRAMES[0].warmth,
      compact: FRAMES[0].compact,
    };

    const activeRef = { current: true };
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    if (sectionRef.current) visibilityObserver.observe(sectionRef.current);

    let rafId = 0;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (!activeRef.current || !sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const scrollable = Math.max(rect.height - window.innerHeight, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      const overall = scrolled / scrollable;

      let i0 = 0;
      while (i0 < FRAME_OFFSETS.length - 2 && FRAME_OFFSETS[i0 + 1] <= overall) i0++;
      const i1 = Math.min(i0 + 1, FRAMES.length - 1);
      const span = FRAME_OFFSETS[i0 + 1] - FRAME_OFFSETS[i0] || 1;
      const localT = Math.min(Math.max((overall - FRAME_OFFSETS[i0]) / span, 0), 1);

      const a = FRAMES[i0];
      const b = FRAMES[i1];
      const targetLightX = lerp(a.lightX, b.lightX, localT);
      const targetLightY = lerp(a.lightY, b.lightY, localT);
      const targetIntensidade = lerp(a.intensidade, b.intensidade, localT);
      const targetWarmth = lerp(a.warmth, b.warmth, localT);
      const targetCompact = lerp(a.compact, b.compact, localT);

      state.lightX += (targetLightX - state.lightX) * DAMPING.light;
      state.lightY += (targetLightY - state.lightY) * DAMPING.light;
      state.intensidade += (targetIntensidade - state.intensidade) * DAMPING.intensidade;
      state.warmth += (targetWarmth - state.warmth) * DAMPING.warmth;
      state.compact += (targetCompact - state.compact) * DAMPING.compact;

      const breath = Math.sin((now / BREATH_PERIOD_MS) * Math.PI * 2) * BREATH_AMPLITUDE;

      if (warmthGlowRef.current) {
        const warmthPercent = ((state.warmth + 1) / 2) * 100;
        warmthGlowRef.current.style.background = `radial-gradient(60% 55% at ${state.lightX}% ${state.lightY}%, color-mix(in srgb, var(--color-brand-gold) ${warmthPercent * 0.35}%, var(--color-brand-sage) ${100 - warmthPercent * 0.35}%) 0%, transparent 72%)`;
        warmthGlowRef.current.style.opacity = String(Math.max(state.intensidade * 0.55 + breath, 0));
      }
      // Bordas — esmaecimento orgânico e morno, nunca uma barra: formas
      // suaves, muito desfocadas, em tons da própria paleta (nunca preto).
      const edgeOpacity = 0.28 + state.intensidade * 0.32;
      if (leftEdgeRef.current) leftEdgeRef.current.style.opacity = String(edgeOpacity);
      if (rightEdgeRef.current) rightEdgeRef.current.style.opacity = String(edgeOpacity);
      if (cardWrapRef.current) {
        cardWrapRef.current.style.maxWidth = `${40 - state.compact * 6}rem`;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      visibilityObserver.disconnect();
    };
  }, []);

  if (ready && reduced) {
    return (
      <section className="relative overflow-hidden bg-canvas px-4 py-16 lg:px-8">
        {photoSrc && <Image src={photoSrc} alt="" fill className="object-cover" sizes="100vw" />}
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
  const isVideoExiting = activeFrame >= VIDEO_EXIT_AT_FRAME;

  return (
    <section ref={sectionRef} className="relative bg-canvas" style={{ height: `${TOTAL_HEIGHT_VH}svh` }}>
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

      {/* O ambiente — permanente, nunca troca de cenário: a mesma
          fotografia do início ao fim. */}
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {photoSrc && <Image src={photoSrc} alt="" fill priority className="object-cover" sizes="100vw" />}

        {/* Calor ambiente — nunca um holofote: um brilho morno, muito
            desfocado, que se desloca devagar e muda de temperatura
            conforme a jornada avança. Escrito pelo Motor da Caminhada. */}
        <div ref={warmthGlowRef} aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity: 0.1 }} />

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
              <VideoSection variant="window" src={videoSrc} poster={videoPoster} />
            </div>
          </div>
        )}

        {/* Fio Dourado — único, contínuo, integrado à arquitetura: não
            representa progresso, etapas nem carregamento. É presença e
            continuidade — passa perto do lugar onde o conteúdo se apoia,
            como um filete discreto de acabamento, nunca um indicador. */}
        <GoldenThread
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
          <div ref={cardWrapRef} className="relative mx-auto flex min-h-[9rem] max-w-reading items-end justify-center">
            {FRAMES.slice(1).map((frameDef, offset) => {
              const index = offset + 1;
              return (
                <div
                  key={frameDef.id}
                  aria-hidden={activeFrame !== index}
                  className={cn(
                    "absolute inset-x-0 bottom-0 text-center transition-opacity duration-700 ease-standard",
                    activeFrame === index ? "opacity-100" : "pointer-events-none opacity-0",
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
