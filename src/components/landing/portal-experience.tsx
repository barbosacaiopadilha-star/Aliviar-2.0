"use client";

import { BookUser, Clock, HeartHandshake, ScanSearch, ShieldCheck, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";

import { LinkButton } from "@/components/landing/link-button";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { cn } from "@/components/ui/cn";

type PortalExperienceProps = {
  photoSrc?: string;
};

// ETAPA 1 (arquitetura) + ETAPA 2 (Motor da Caminhada). O ambiente nunca
// nasce, nunca desaparece, nunca troca de cenário — a mesma fotografia do
// início ao fim. A sensação de deslocamento nasce da combinação de oito
// sinais discretos (luz, sombra↔parede, atmosfera, percepção espacial,
// ritmo de leitura, comportamento do conteúdo, cadência de transição,
// periferia-estável/centro-nítido) mais três princípios físicos — inércia
// (nada reage instantaneamente), memória (nada reinicia, tudo evolui por
// acúmulo contínuo) e respiração (o ambiente nunca fica congelado, mesmo
// parado). Nenhum sinal, isolado, deveria denunciar movimento — a soma é
// que produz a percepção. Ainda sem fio dourado, vídeo ou GSAP.
const BENEFITS: Array<{ icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; title: string; description: string }> = [
  { icon: ScanSearch, title: "Curadoria criteriosa", description: "O caminho mais adequado ao seu caso, com critério." },
  { icon: Clock, title: "Agilidade no processo", description: "Menos espera, menos burocracia, em cada etapa." },
  {
    icon: HeartHandshake,
    title: "Cuidado completo",
    description: "Alguém dedicado, do primeiro contato à conversa que importa.",
  },
];

const CRITERIA: Array<{ icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; title: string; description: string }> = [
  {
    icon: BookUser,
    title: "Currículo profissional",
    description: "Formação, especialização e trajetória de cada profissional na Rede Aliviar.",
  },
  {
    icon: ShieldCheck,
    title: "Ética e conduta",
    description: "Histórico profissional e conduta ética no cuidado ao paciente.",
  },
  {
    icon: TrendingUp,
    title: "Compatibilidade com o caso",
    description: "Experiência e abordagem compatíveis com a sua situação específica — nunca genérica.",
  },
];

const CONTINUACAO = ["Seleção dos profissionais", "Agendamento", "Atendimento"] as const;

type Frame = {
  id: string;
  /** Altura da parada — não é uniforme de propósito (sinal V: ritmo de
   *  leitura). Entrada/Triagem/Análise são passagens breves; Curadoria/
   *  Benefícios/Confiança sustentam mais permanência (a "exposição"). */
  heightVh: number;
  content: ReactNode | null;
  /** Origem da luz nesta parada (0-100, percentual do palco) — números,
   *  não strings, porque o Motor da Caminhada interpola continuamente
   *  entre paradas vizinhas (sinal I), nunca salta de uma para outra. */
  lightX: number;
  lightY: number;
  /** Profundidade (0-1) — rege vinheta e presença das paredes (sinal II). */
  depth: number;
  /** Temperatura da atmosfera (-1 fria a 1 quente) — canal independente da
   *  luz, com sua própria inércia, propositalmente dessincronizado dela
   *  (sinal III). */
  warmth: number;
  /** Compactação espacial (0-1) — quanto mais fundo, mais intimista fica a
   *  composição do conteúdo (sinal IV). */
  compact: number;
};

const FRAMES: Frame[] = [
  {
    id: "hero",
    heightVh: 100,
    lightX: 50,
    lightY: 28,
    depth: 0,
    warmth: 0.25,
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
  // Entrada no Portal — respiro de transição, sem copy própria (decisão
  // confirmada): o conteúdo desse momento é a própria formação contínua
  // do ambiente ao redor, nunca uma ausência.
  { id: "entrada", heightVh: 50, content: null, lightX: 45, lightY: 32, depth: 0.42, warmth: 0.12, compact: 0.12 },
  {
    id: "triagem",
    heightVh: 85,
    lightX: 40,
    lightY: 35,
    depth: 0.52,
    warmth: 0.05,
    compact: 0.18,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Triagem</p>,
  },
  {
    id: "analise",
    heightVh: 85,
    lightX: 60,
    lightY: 36,
    depth: 0.6,
    warmth: -0.05,
    compact: 0.24,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Análise do caso</p>,
  },
  {
    id: "curadoria",
    heightVh: 115,
    lightX: 50,
    lightY: 38,
    depth: 0.68,
    warmth: -0.1,
    compact: 0.32,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Curadoria técnica</p>,
  },
  {
    id: "beneficios",
    heightVh: 115,
    lightX: 38,
    lightY: 40,
    depth: 0.78,
    warmth: 0.08,
    compact: 0.42,
    content: (
      <div className="flex flex-col gap-4 text-left">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-sage/15 text-brand-sage"
            >
              <benefit.icon className="size-4" aria-hidden={true} />
            </span>
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
    heightVh: 115,
    lightX: 62,
    lightY: 42,
    depth: 0.87,
    warmth: -0.18,
    compact: 0.5,
    content: (
      <div className="flex flex-col gap-4 text-left">
        {CRITERIA.map((criterion) => (
          <div key={criterion.title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-brand-gold bg-brand-gold/10 text-brand-gold"
            >
              <criterion.icon className="size-4" aria-hidden={true} />
            </span>
            <div>
              <p className="font-serif text-base font-semibold text-ink">{criterion.title}</p>
              <p className="text-sm text-ink-muted">{criterion.description}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "continuacao",
    heightVh: 90,
    lightX: 50,
    lightY: 45,
    depth: 1,
    warmth: -0.22,
    compact: 0.46,
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

// Fração acumulada (0 a 1) de onde cada parada começa, dentro da altura
// total — usado pelo Motor da Caminhada para saber entre quais duas
// paradas interpolar em cada instante do scroll. offsets[FRAMES.length] é
// sempre 1 (fim da última parada).
const FRAME_OFFSETS: number[] = (() => {
  const offsets: number[] = [0];
  let acc = 0;
  for (const f of FRAMES) {
    acc += f.heightVh;
    offsets.push(acc / TOTAL_HEIGHT_VH);
  }
  return offsets;
})();

// Princípio 9 (Inércia): cada canal persegue seu alvo numa velocidade
// própria — nunca 1 (resposta instantânea). Constantes diferentes entre
// canais é o que garante que eles nunca se movam sincronizados (reforça a
// leitura de "percepção", não "efeito"): a atmosfera é a mais lenta de
// todas (a temperatura de uma sala muda por último), a compactação
// espacial é a mais ágil (acompanha de perto a troca de conteúdo).
const DAMPING = {
  light: 0.045,
  lightOpacity: 0.06,
  depth: 0.035,
  walls: 0.05,
  warmth: 0.02,
  compact: 0.08,
};

// Princípio 11 (Respiração): uma oscilação lenta e mínima, independente do
// scroll, que nunca para — só para o ambiente nunca parecer congelado.
const BREATH_PERIOD_MS = 9000;
const BREATH_AMPLITUDE = 0.025;

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

export function PortalExperience({ photoSrc }: PortalExperienceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const sentinelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lightGlowRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<HTMLDivElement>(null);
  const leftWallRef = useRef<HTMLDivElement>(null);
  const rightWallRef = useRef<HTMLDivElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const [activeFrame, setActiveFrame] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  // Canal de foco: qual parada está ativa. Discreto e nítido de propósito
  // (sinal VIII — periferia lenta/ambígua, foco claro), gerido pela mesma
  // técnica de sentinela + IntersectionObserver já validada nas rodadas
  // anteriores da Landing.
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

  // Motor da Caminhada — canal de periferia. Lê a posição de scroll a
  // cada quadro (requestAnimationFrame, nunca um listener de scroll
  // reagindo 1:1) e persegue os alvos interpolados entre paradas vizinhas
  // com inércia própria por sinal — o ambiente "responde à presença" do
  // visitante em vez de "reagir ao scroll". Escreve direto no DOM via
  // refs (nunca via state) para não gerar 60 re-renders por segundo.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const state = {
      lightX: FRAMES[0].lightX,
      lightY: FRAMES[0].lightY,
      lightOpacity: 0.32,
      depth: FRAMES[0].depth,
      warmth: FRAMES[0].warmth,
      compact: FRAMES[0].compact,
    };

    // O Portal pausa o motor quando sai de vista (rolou muito abaixo, ou
    // ainda não chegou) — mesma disciplina de performance já usada no
    // GoldenThread (pausar fora da viewport).
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
      const targetDepth = lerp(a.depth, b.depth, localT);
      const targetWarmth = lerp(a.warmth, b.warmth, localT);
      const targetCompact = lerp(a.compact, b.compact, localT);
      const targetLightOpacity = 0.3 + targetDepth * 0.3;

      // Princípio 9 (Inércia) + 10 (Memória): cada canal persegue seu alvo
      // com sua própria velocidade — nunca salta, nunca reinicia, só
      // acumula continuamente na direção do novo alvo.
      state.lightX += (targetLightX - state.lightX) * DAMPING.light;
      state.lightY += (targetLightY - state.lightY) * DAMPING.light;
      state.depth += (targetDepth - state.depth) * DAMPING.depth;
      state.warmth += (targetWarmth - state.warmth) * DAMPING.warmth;
      state.compact += (targetCompact - state.compact) * DAMPING.compact;
      state.lightOpacity += (targetLightOpacity - state.lightOpacity) * DAMPING.lightOpacity;

      // Princípio 11 (Respiração): nunca para, mesmo com o scroll parado.
      const breath = Math.sin((now / BREATH_PERIOD_MS) * Math.PI * 2) * BREATH_AMPLITUDE;

      if (lightGlowRef.current) {
        lightGlowRef.current.style.left = `${state.lightX}%`;
        lightGlowRef.current.style.top = `${state.lightY}%`;
        lightGlowRef.current.style.opacity = String(Math.max(state.lightOpacity + breath, 0));
      }
      if (vignetteRef.current) {
        vignetteRef.current.style.opacity = String(state.depth * 0.42);
      }
      if (atmosphereRef.current) {
        const warmthPercent = ((state.warmth + 1) / 2) * 100;
        atmosphereRef.current.style.backgroundColor =
          `color-mix(in srgb, var(--color-brand-gold) ${warmthPercent}%, var(--color-brand-sage) ${100 - warmthPercent}%)`;
        atmosphereRef.current.style.opacity = String(0.05 + state.depth * 0.06);
      }
      // Sinal II — relação luz↔sombra: a parede do lado oposto à luz fica
      // discretamente mais presente (a sombra cai longe da fonte).
      const lightOffset = (state.lightX - 50) / 50;
      const baseWall = 0.5 + state.depth * 0.35;
      if (leftWallRef.current) {
        leftWallRef.current.style.opacity = String(Math.max(baseWall * (1 - lightOffset * 0.25), 0));
      }
      if (rightWallRef.current) {
        rightWallRef.current.style.opacity = String(Math.max(baseWall * (1 + lightOffset * 0.25), 0));
      }
      // Sinal IV — percepção espacial: o ambiente fica sutilmente mais
      // intimista (cartão mais estreito) conforme o visitante avança.
      if (cardWrapRef.current) {
        cardWrapRef.current.style.maxWidth = `${40 - state.compact * 7}rem`;
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
  const isThreshold = activeFrame === 0; // Hero — ainda do lado de fora.

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

      {/* O palco — cenário permanente. Nunca nasce, nunca desaparece,
          nunca troca de cenário: a mesma fotografia do início ao fim. */}
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {photoSrc && <Image src={photoSrc} alt="" fill priority className="object-cover" sizes="100vw" />}

        {/* Sinal I — luz com origem própria, reagindo à foto por baixo
            (mix-blend-mode), nunca um filtro plano. Posição/opacidade
            escritas pelo Motor da Caminhada a cada quadro. */}
        <div
          ref={lightGlowRef}
          aria-hidden="true"
          className="pointer-events-none absolute size-[85vmax] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${FRAMES[0].lightX}%`,
            top: `${FRAMES[0].lightY}%`,
            opacity: 0.32,
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-brand-gold) 30%, white) 0%, transparent 68%)",
            mixBlendMode: "soft-light",
          }}
        />

        {/* Profundidade — vinheta de centro fixo, só a intensidade muda. */}
        <div
          ref={vignetteRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_110%_at_50%_40%,_transparent_0%,_rgba(0,0,0,0.45)_100%)]"
          style={{ opacity: 0 }}
        />

        {/* Sinal III — atmosfera: temperatura de cor, canal independente
            da luz e da vinheta, com a própria inércia (a mais lenta de
            todas — "o ar" é o que mais demora a mudar numa sala real). */}
        <div ref={atmosphereRef} aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity: 0.05 }} />

        {/* Sinal II — paredes, reagindo à mesma leitura de profundidade e
            à posição da luz (a sombra cai do lado oposto à fonte). */}
        <div
          ref={leftWallRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-6 lg:w-16"
          style={{ background: "linear-gradient(to right, rgba(0,0,0,0.4), transparent)", opacity: 0 }}
        />
        <div
          ref={rightWallRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-6 lg:w-16"
          style={{ background: "linear-gradient(to left, rgba(0,0,0,0.4), transparent)", opacity: 0 }}
        />

        {/* Hero como limiar — sem chrome de cartão, sem paredes, sem
            vinheta: o visitante está do lado de fora, olhando pra dentro,
            antes de atravessar. */}
        <div
          aria-hidden={!isThreshold}
          className={cn(
            "absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 text-center transition-opacity duration-700 ease-standard",
            isThreshold ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {FRAMES[0].content}
        </div>

        {/* Dentro do Portal — cartão translúcido, mesma posição para
            todas as paradas depois do limiar. A Entrada não tem cartão —
            seu conteúdo é a própria formação contínua do ambiente. */}
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
                    <div className="mx-auto inline-flex flex-col items-center gap-3 rounded-3xl bg-surface/60 px-6 py-5 backdrop-blur-md">
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
