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

// ETAPA 1 — Arquitetura Base do Portal. Só o ambiente: paredes, profundidade,
// iluminação evoluindo por parada, e a troca de conteúdo por crossfade. Sem
// fio dourado, sem vídeo, sem GSAP — isso é "o lugar"; "a vida" (fio, vídeo,
// motion fino) entra nas etapas seguintes, por decisão explícita do
// processo (ver plano). O mecanismo de sentinela + IntersectionObserver é a
// mesma técnica já validada em rodadas anteriores desta Landing.
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
  heightVh: number;
  content: ReactNode | null;
  /** Posição da origem da luz nesta parada (percentuais do palco) — a luz
   *  se desloca pelo ambiente conforme o visitante avança, no lugar de
   *  mover a fotografia. Ver nota "REPROJEÇÃO DA LUZ" abaixo. */
  lightX: string;
  lightY: string;
  /** Profundidade da parada (0 a 1) — quanto mais fundo na Curadoria, mais
   *  presentes ficam a vinheta e as paredes. Hero fica em 0 (ainda do lado
   *  de fora, sem ambiente formado ao redor). */
  depth: number;
};

const FRAMES: Frame[] = [
  {
    id: "hero",
    heightVh: 100,
    lightX: "50%",
    lightY: "28%",
    depth: 0,
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
  // confirmada): o visitante segue no mesmo ambiente, só sem legenda. O
  // momento em si é a formação do ambiente ao redor (paredes fechando,
  // vinheta aprofundando, luz se assentando) — nunca uma ausência.
  { id: "entrada", heightVh: 50, content: null, lightX: "45%", lightY: "32%", depth: 0.5 },
  {
    id: "triagem",
    heightVh: 100,
    lightX: "40%",
    lightY: "35%",
    depth: 0.6,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Triagem</p>,
  },
  {
    id: "analise",
    heightVh: 100,
    lightX: "60%",
    lightY: "36%",
    depth: 0.68,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Análise do caso</p>,
  },
  {
    id: "curadoria",
    heightVh: 100,
    lightX: "50%",
    lightY: "38%",
    depth: 0.76,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Curadoria técnica</p>,
  },
  {
    id: "beneficios",
    heightVh: 100,
    lightX: "38%",
    lightY: "40%",
    depth: 0.85,
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
    heightVh: 100,
    lightX: "62%",
    lightY: "42%",
    depth: 0.92,
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
    heightVh: 100,
    lightX: "50%",
    lightY: "45%",
    depth: 1,
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

// Curva de easing padrão da marca (nunca elástico/bounce) — mesma usada em
// todo o resto da Landing, aqui como constante porque as transições da luz
// e das paredes são escritas via style inline (não Tailwind), então não
// herdam a variável CSS automaticamente num contexto de string JS.
const PORTAL_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export function PortalExperience({ photoSrc }: PortalExperienceProps) {
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
  const frame = FRAMES[activeFrame] ?? FRAMES[0];
  const isThreshold = activeFrame === 0; // Hero — ainda do lado de fora.
  const wallsIn = !isThreshold;

  return (
    <section className="relative bg-canvas" style={{ height: `${TOTAL_HEIGHT_VH}svh` }}>
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
          nunca troca de cenário: a mesma fotografia do início ao fim. O
          que muda é a luz que incide sobre ela (posição, não a foto em
          si) e o quanto o ambiente ao redor (paredes, profundidade) está
          formado — nunca um corte, sempre transição. */}
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {photoSrc && <Image src={photoSrc} alt="" fill priority className="object-cover" sizes="100vw" />}

        {/* REPROJEÇÃO DA LUZ (ajuste 1) — não é mais um véu plano cobrindo
            a tela. É uma fonte com origem e posição própria (lightX/lightY
            de cada parada), aplicada via mix-blend-mode "soft-light" para
            que reaja à luminância da própria fotografia por baixo — uma
            luz incidindo na cena, não um filtro de cor sobreposto. A
            posição se desloca lentamente entre paradas: é o deslocamento
            da luz, não da câmera, que sugere que o visitante andou. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute size-[85vmax] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: frame.lightX,
            top: frame.lightY,
            opacity: isThreshold ? 0.35 : 0.55 + frame.depth * 0.25,
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-brand-gold) 30%, white) 0%, transparent 68%)",
            mixBlendMode: "soft-light",
            transition: `left 1600ms ${PORTAL_EASE}, top 1600ms ${PORTAL_EASE}, opacity 1200ms ${PORTAL_EASE}`,
          }}
        />

        {/* Profundidade — vinheta de centro fixo (só a intensidade muda;
            coordenadas dentro de um radial-gradient() não interpolam via
            CSS transition, então quem se desloca é só o glow de luz
            acima, via left/top de verdade). Cresce conforme o visitante
            avança na Curadoria — a escuridão nas bordas é a ausência da
            mesma luz, não uma camada à parte. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_110%_at_50%_40%,_transparent_0%,_rgba(0,0,0,0.45)_100%)] transition-opacity"
          style={{
            opacity: frame.depth * 0.42,
            transitionDuration: "1200ms",
            transitionTimingFunction: PORTAL_EASE,
          }}
        />

        {/* PAREDES (ajuste 2) — pertencem ao mesmo sistema de luz: no
            Hero (limiar) ainda não existem — o ambiente ainda não se
            formou ao redor do visitante. Assim que ele cruza para dentro
            (Entrada), elas se formam junto com a profundidade, e seguem
            reagindo à mesma leitura de profundidade da parada atual. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-6 lg:w-16"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.4), transparent)",
            opacity: wallsIn ? 0.5 + frame.depth * 0.35 : 0,
            transition: `opacity 1400ms ${PORTAL_EASE}`,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-6 lg:w-16"
          style={{
            background: "linear-gradient(to left, rgba(0,0,0,0.4), transparent)",
            opacity: wallsIn ? 0.5 + frame.depth * 0.35 : 0,
            transition: `opacity 1400ms ${PORTAL_EASE}`,
          }}
        />

        {/* HERO COMO LIMIAR (ajuste 3) — nunca o "frame 0" com o mesmo
            invólucro de cartão das paradas seguintes. Sem chrome, sem
            vinheta, sem paredes: o visitante está do lado de fora,
            olhando para dentro, antes de atravessar. */}
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
            todas as paradas depois do limiar (Entrada em diante). A
            Entrada (ajuste 4) não tem cartão — seu conteúdo é a própria
            formação do ambiente acontecendo acima (paredes fechando,
            vinheta se aprofundando, luz se assentando), não uma
            ausência. */}
        <div className="absolute inset-x-0 bottom-[10%] px-4">
          <div className="relative mx-auto flex min-h-[9rem] max-w-reading items-end justify-center">
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
