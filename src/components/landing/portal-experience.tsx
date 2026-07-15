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
};

const FRAMES: Frame[] = [
  {
    id: "hero",
    heightVh: 100,
    content: (
      <div className="flex flex-col items-center gap-4">
        <SectionEyebrow>Curadoria médica independente</SectionEyebrow>
        <h1 className="max-w-reading font-serif text-3xl font-semibold leading-[1.1] text-ink lg:text-4xl">
          Uma escolha de cuidado, <span className="text-brand-gold">nunca sozinho</span>.
        </h1>
        <LinkButton href="/sua-historia" variant="primary">
          Contar minha história
        </LinkButton>
      </div>
    ),
  },
  // Entrada no Portal — respiro de transição, sem copy própria (decisão
  // confirmada): o visitante segue no mesmo ambiente, só sem legenda.
  { id: "entrada", heightVh: 50, content: null },
  {
    id: "triagem",
    heightVh: 100,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Triagem</p>,
  },
  {
    id: "analise",
    heightVh: 100,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Análise do caso</p>,
  },
  {
    id: "curadoria",
    heightVh: 100,
    content: <p className="font-serif text-2xl font-medium leading-tight text-ink lg:text-4xl">Curadoria técnica</p>,
  },
  {
    id: "beneficios",
    heightVh: 100,
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

// Opacidade da luz de profundidade por parada — evolui sutilmente ao longo
// da caminhada (nunca com corte, a troca é sempre por crossfade junto com o
// conteúdo). Não é scroll-scrubbed ainda: nesta etapa a base do ambiente é
// só CSS + IntersectionObserver, sem GSAP — a continuidade contínua ligada
// ao gesto do scroll fica para a Etapa 2 (Walking Engine).
const LIGHT_OPACITY_BY_FRAME = [0, 0.04, 0.08, 0.13, 0.18, 0.23, 0.28, 0.32];

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

  return (
    <section className="relative bg-canvas" style={{ height: `${TOTAL_HEIGHT_VH}svh` }}>
      {FRAMES.map((frame, index) => {
        const top = cumulativeVh;
        cumulativeVh += frame.heightVh;
        return (
          <div
            key={frame.id}
            ref={(el) => {
              sentinelRefs.current[index] = el;
            }}
            aria-hidden="true"
            className="absolute inset-x-0"
            style={{ top: `${top}svh`, height: `${frame.heightVh}svh` }}
          />
        );
      })}

      {/* O palco — cenário permanente. Nunca nasce, nunca desaparece,
          nunca troca de cenário: a mesma fotografia do início ao fim,
          com paredes laterais e luz de profundidade sempre presentes. */}
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {photoSrc && <Image src={photoSrc} alt="" fill priority className="object-cover" sizes="100vw" />}

        {/* Profundidade — vinheta permanente, nunca reage ao scroll. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(130%_110%_at_50%_38%,_transparent_0%,_rgba(0,0,0,0.32)_100%)]"
        />

        {/* Luz de profundidade — evolui sutilmente por parada (crossfade
            junto com o conteúdo, nunca um corte). */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[color-mix(in_srgb,_var(--color-brand-primary-deep)_60%,_transparent)] transition-opacity duration-1000 ease-standard"
          style={{ opacity: LIGHT_OPACITY_BY_FRAME[activeFrame] ?? 0 }}
        />

        {/* Paredes laterais — arquitetônicas, permanentes, nunca recebem
            conteúdo, nunca competem visualmente: só vinheta discreta nas
            bordas, largura mínima no mobile. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/25 to-transparent lg:w-16"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/25 to-transparent lg:w-16"
        />

        {/* Conteúdo da parada ativa — crossfade no mesmo lugar, nunca
            deslizando, nunca entrando de lado. */}
        <div className="absolute inset-x-0 bottom-[10%] px-4">
          <div className="relative mx-auto flex min-h-[9rem] max-w-reading items-end justify-center">
            {FRAMES.map((frame, index) => (
              <div
                key={frame.id}
                aria-hidden={activeFrame !== index}
                className={cn(
                  "absolute inset-x-0 bottom-0 text-center transition-opacity duration-700 ease-standard",
                  activeFrame === index ? "opacity-100" : "pointer-events-none opacity-0",
                )}
              >
                {frame.content && (
                  <div className="mx-auto inline-flex flex-col items-center gap-3 rounded-3xl bg-surface/60 px-6 py-5 backdrop-blur-md">
                    {frame.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
