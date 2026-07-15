"use client";

import { useEffect, useRef, useState } from "react";
import type { ScrollTrigger } from "gsap/ScrollTrigger";

import { CARDS } from "@/components/landing/faq-cards";
import {
  BOOK_SCROLL_VH,
  EXIT_DURATION_UNITS,
  FIRST_QUESTION_SETTLE_UNITS,
  getFaqCardTargetScroll,
  LAST_QUESTION_SETTLE_UNITS,
  TRANSITION_EMPHASIS,
  TURN_DURATION_UNITS,
  TURN_TO_EXIT_GAP_UNITS,
} from "@/components/landing/faq-book-turn";
import { GoldenThread } from "@/components/landing/golden-thread";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionReveal } from "@/components/landing/section-reveal";
import { cn } from "@/components/ui/cn";

// Livro físico de Dúvidas — mesmos 6 pares Dúvida/Solução do mecanismo
// anterior (DuvidasStackSection), agora com hinge real na lombada
// (transform-origin: left, não mais o centro), sombra dinâmica que
// aumenta no meio do giro (simulando a folha se levantando) e avanço por
// toque/teclado além da rolagem — nunca elástico (power2.inOut),
// respeitando docs/BRAND_GUIDELINES.md. Conteúdo das cartas em
// faq-cards.ts (Camada de Configuração); pesos, marcos e o cálculo de
// alvo de scroll agora em faq-book-turn.ts (Motor de Virada,
// docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §2, motor 9) — mesmos
// valores, mesma derivação, só relocados (Playbook, Etapa 7). Fonte
// única de verdade preservada: tanto a timeline (montada abaixo) quanto
// o avanço por clique/teclado (`advance`) derivam exatamente dos mesmos
// números do motor — nunca duplicados, nunca podem divergir um do outro.

export function FaqBookSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const innerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setReduced(reduceMotion);
    setReady(true);
    if (reduceMotion) return;

    // `cancelled` fecha a mesma corrida registrada em portal-experience.tsx
    // (Etapa 9): sem ela, desmontar antes de `import("gsap")` resolver
    // deixaria este pin/timeline (e o ScrollTrigger da Biblioteca inteira)
    // vivo para sempre, nunca revertido.
    let cancelled = false;
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${BOOK_SCROLL_VH}%`,
            scrub: 1,
            pin: true,
          },
        });

        // Assentamento inicial (Fase 4, Correção 1): região estática
        // dentro da MESMA timeline — anima um objeto vazio, sem efeito
        // visual, só consumindo distância de scroll. Nenhum temporizador,
        // nenhum ScrollTrigger novo: a primeira dúvida permanece parada
        // até o visitante rolar através desta região, e ele controla
        // inteiramente quando isso acontece.
        timeline.to({}, { duration: FIRST_QUESTION_SETTLE_UNITS });

        CARDS.forEach((_, index) => {
          const inner = innerRefs.current[index];
          const card = cardRefs.current[index];
          if (!inner || !card || index === CARDS.length - 1) return;

          const emphasis = TRANSITION_EMPHASIS[index];

          timeline
            .to(inner, {
              rotateY: 180,
              duration: TURN_DURATION_UNITS * emphasis,
              ease: "power2.inOut",
              onStart: () => setCurrentIndex(index),
              onReverseComplete: () => setCurrentIndex(index),
              onUpdate: function onUpdate() {
                // Sombra "de folha se levantando" — mesma lógica de
                // sempre (Capítulo 3), inalterada por esta fase.
                const lift = Math.sin(this.progress() * Math.PI);
                card.style.boxShadow = `${4 + lift * 10}px ${8 + lift * 14}px ${18 + lift * 24}px rgba(27, 39, 51, ${0.12 + lift * 0.18})`;
              },
            })
            .to(
              card,
              {
                y: "-120%",
                opacity: 0,
                duration: EXIT_DURATION_UNITS * emphasis,
                ease: "power1.in",
                onStart: () => setCurrentIndex(index + 1),
              },
              `+=${TURN_TO_EXIT_GAP_UNITS * emphasis}`,
            );
        });

        // Assentamento final (Fase 4, Correção 1): mesma técnica, depois
        // da última transição real — a sexta dúvida permanece visível e
        // imóvel antes de o pin liberar naturalmente.
        timeline.to({}, { duration: LAST_QUESTION_SETTLE_UNITS });

        scrollTriggerRef.current = timeline.scrollTrigger ?? null;
      }, sectionRef);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
      scrollTriggerRef.current = null;
    };
  }, []);

  const advance = (direction: 1 | -1) => {
    const st = scrollTriggerRef.current;
    if (!st) {
      // ScrollTrigger ainda não inicializado (import dinâmico em
      // andamento) — degrada com segurança para o comportamento
      // anterior, nunca trava a interação.
      window.scrollBy({
        top: direction * window.innerHeight,
        behavior: "smooth",
      });
      return;
    }
    // Fase 4, Correção 2: avança/volta até o marco lógico real da carta
    // vizinha (posição absoluta, lida ao vivo do ScrollTrigger — nunca um
    // estado duplicado que possa divergir do progresso real do scroll),
    // não mais uma distância fixa em pixels. Cálculo delegado ao Motor de
    // Virada (faq-book-turn.ts) — mesma fórmula, agora testada isolada.
    const { targetScrollY } = getFaqCardTargetScroll(
      currentIndex,
      direction,
      st.start,
      st.end,
      CARDS.length,
    );
    window.scrollTo({ top: targetScrollY, behavior: "smooth" });
  };

  if (ready && reduced) {
    return (
      <section className="bg-canvas px-4 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-reading text-center lg:text-left">
          <SectionEyebrow align="left">Suas dúvidas</SectionEyebrow>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink lg:text-3xl">
            Perguntas que costumam vir antes do primeiro passo
          </h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-content gap-6 lg:grid-cols-2">
          {CARDS.map((card) => (
            <div
              key={card.duvidaTitle.join()}
              className="rounded-2xl border border-border bg-[linear-gradient(160deg,_var(--color-bg-surface)_0%,_color-mix(in_srgb,_var(--color-brand-sage)_25%,_var(--color-bg-surface))_100%)] p-6"
            >
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
                Dúvida
              </span>
              <p className="mt-2 font-serif text-lg italic text-ink">
                {card.duvidaTitle[0]} {card.duvidaTitle[1]}
              </p>
              <p className="mt-2 text-sm text-ink-muted">{card.duvidaText}</p>
              <span className="mt-4 block text-xs font-medium uppercase tracking-[0.14em] text-brand-primary-deep/70">
                Solução
              </span>
              <p className="mt-2 font-serif text-lg italic text-brand-primary-deep">
                {card.solucaoTitle[0]} {card.solucaoTitle[1]}
              </p>
              <p className="mt-2 text-sm text-ink-muted">{card.solucaoText}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div ref={sectionRef} id="duvidas" className="relative bg-canvas">
      {/* Luz de leitura assentada (Capítulo 5) — presença estável, nunca
          animada: ao contrário do Portal, aqui a luz não conduz mais o
          olhar, só confirma que o livro existe dentro de um ambiente, não
          sobre um painel de cor plano. Puramente estática (nenhum relógio,
          nenhum loop) — o silêncio dela é o próprio sinal de assentamento. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[70%] opacity-60"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 15%, color-mix(in srgb, var(--color-brand-gold) 14%, transparent) 0%, transparent 70%)",
        }}
      />
      {/* Presença Residual (Fase 2): ponto de entrada realinhado a partir
          de x=150 (antes 340) e ancoragem à esquerda em 18% (antes
          centralizada) — mesma referência horizontal usada pelo Fio do
          Portal (left-[18%]), para que o traço pareça o mesmo fio
          chegando, não um segundo traço nascendo do zero. O restante da
          curva (mesmo gesto de concha, escala cheia) permanece intacto. */}
      <GoldenThread
        d="M150 0 C 100 120, 100 420, 300 560 C 400 630, 340 720, 180 800"
        className="left-[18%] top-0 h-full w-40 opacity-70 lg:w-64"
      />
      <div
        role="group"
        aria-roledescription="livro de perguntas frequentes"
        tabIndex={0}
        onClick={() => advance(1)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " " ||
            event.key === "ArrowRight"
          ) {
            event.preventDefault();
            advance(1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            advance(-1);
          }
        }}
        className="group relative flex min-h-screen cursor-pointer flex-col items-center justify-center overflow-hidden px-4 py-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:px-8"
      >
        {/* Presença Residual (Fase 2): o preâmbulo (eyebrow + heading)
            nasce em SectionReveal — o mesmo fade-up já usado no CTA e no
            Rodapé — para que ele já esteja surgindo enquanto o Portal
            ainda termina de esmaecer, em vez de aparecer pronto e
            instantâneo. Estado de repouso do SectionReveal é sempre
            visível (nunca há dependência de JS para ler o conteúdo). O
            livro (abaixo) fica deliberadamente fora deste wrapper. */}
        <SectionReveal className="mb-10 max-w-reading text-center">
          <SectionEyebrow>Suas dúvidas</SectionEyebrow>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink lg:text-3xl">
            Perguntas que costumam vir antes do primeiro passo
          </h2>
        </SectionReveal>

        <div
          className="relative h-[22rem] w-full max-w-xs"
          style={{ perspective: "2000px" }}
        >
          {CARDS.map((card, index) => (
            <div
              key={card.duvidaTitle.join()}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={cn(
                "absolute inset-0 shadow-lg transition-shadow duration-fast ease-standard",
                // Convite Prévio (Fase 5): só a carta ativa reage — mesma
                // fonte de estado já usada pelo aria-live, nenhum estado
                // novo. A sombra pode viver neste elemento com segurança:
                // o GSAP só escreve boxShadow inline aqui durante a
                // virada em si (onUpdate da própria virada), nunca em
                // repouso — quando o convite realmente importa.
                index === currentIndex &&
                  "hover:shadow-2xl group-focus-visible:shadow-2xl",
              )}
              style={{
                zIndex: CARDS.length - index,
                transform: `translate(${index * 3}px, ${index * 4}px)`,
              }}
            >
              {/* Elevação isolada num wrapper que o GSAP nunca toca. O
                  `card` acima carrega o transform de empilhamento — lido
                  pelo GSAP como referência fixa no momento em que a
                  timeline é montada — e, durante a saída, seu próprio
                  transform (`y: "-120%"`) escrito pelo GSAP. Compor a
                  elevação no mesmo elemento arriscaria a saída "esquecer"
                  o deslocamento de hover (o GSAP fixa essa referência uma
                  única vez, na montagem, não a cada quadro). Este wrapper
                  isola a elevação num transform que o GSAP nunca escreve,
                  então nunca há conflito nem resíduo. */}
              <div
                className={cn(
                  "relative size-full transition-transform duration-fast ease-standard",
                  index === currentIndex &&
                    "hover:-translate-y-1 group-focus-visible:-translate-y-1",
                )}
              >
                <div
                  ref={(el) => {
                    innerRefs.current[index] = el;
                  }}
                  className="relative size-full"
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "left center",
                  }}
                >
                  <div
                    className="absolute inset-0 flex flex-col justify-start rounded-r-2xl rounded-l-sm border border-border bg-[linear-gradient(160deg,_var(--color-bg-surface)_0%,_color-mix(in_srgb,_var(--color-brand-sage)_35%,_var(--color-bg-surface))_100%)] p-6 pl-7 pt-7"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-2 rounded-l-sm bg-gradient-to-r from-ink/15 to-transparent"
                    />
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">
                      Dúvida
                    </span>
                    <p className="mt-3 font-serif text-2xl italic leading-tight text-ink">
                      {card.duvidaTitle[0]}
                      <br />
                      {card.duvidaTitle[1]}
                    </p>
                    <p className="mt-3 text-sm text-ink-muted">
                      {card.duvidaText}
                    </p>
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col justify-start rounded-r-2xl rounded-l-sm border border-border bg-[linear-gradient(160deg,_var(--color-bg-surface)_0%,_var(--color-brand-sage)_100%)] p-6 pl-7 pt-7"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-2 rounded-l-sm bg-gradient-to-r from-ink/15 to-transparent"
                    />
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-brand-primary-deep/70">
                      Solução
                    </span>
                    <p className="mt-3 font-serif text-2xl italic leading-tight text-brand-primary-deep">
                      {card.solucaoTitle[0]}
                      <br />
                      {card.solucaoTitle[1]}
                    </p>
                    <p className="mt-3 text-sm text-brand-primary-deep/80">
                      {card.solucaoText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p
          aria-hidden="true"
          className="mt-8 text-xs uppercase tracking-[0.14em] text-ink-muted"
        >
          Toque ou role para virar a página
        </p>
        <p aria-live="polite" className="sr-only">
          Pergunta {Math.min(currentIndex + 1, CARDS.length)} de {CARDS.length}
        </p>
      </div>
    </div>
  );
}
