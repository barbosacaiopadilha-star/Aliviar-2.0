"use client";

import { useEffect, useRef, useState } from "react";

import { GoldenThread } from "@/components/landing/golden-thread";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionReveal } from "@/components/landing/section-reveal";

// Livro físico de Dúvidas — mesmos 6 pares Dúvida/Solução do mecanismo
// anterior (DuvidasStackSection), agora com hinge real na lombada
// (transform-origin: left, não mais o centro), sombra dinâmica que
// aumenta no meio do giro (simulando a folha se levantando) e avanço por
// toque/teclado além da rolagem — nunca elástico (power2.inOut),
// respeitando docs/BRAND_GUIDELINES.md.
type DuvidaCard = {
  duvidaTitle: [string, string];
  duvidaText: string;
  solucaoTitle: [string, string];
  solucaoText: string;
};

const CARDS: DuvidaCard[] = [
  {
    duvidaTitle: ["Não sei", "por onde começar"],
    duvidaText: "Você tem uma situação de saúde, mas não sabe como organizar os próximos passos.",
    solucaoTitle: ["Curadoria", "organizada"],
    solucaoText: "Uma pessoa da nossa equipe entende sua história e organiza um caminho claro para você.",
  },
  {
    duvidaTitle: ["Tenho medo de", "ficar sem suporte"],
    duvidaText: "A conversa migra para o WhatsApp e você teme ficar sozinho depois disso.",
    solucaoTitle: ["Acompanhamento", "em tempo real"],
    solucaoText: "A equipe Aliviar segue com você no WhatsApp, do mesmo jeito que aqui no site.",
  },
  {
    duvidaTitle: ["Não sei qual", "caminho escolher"],
    duvidaText: "Busca Direta ou Concierge de Saúde parecem opções diferentes e você não sabe qual seguir.",
    solucaoTitle: ["É a mesma", "curadoria Aliviar"],
    solucaoText: "Escolha só a forma mais confortável para você começar — o cuidado é o mesmo.",
  },
  {
    duvidaTitle: ["Preocupado com", "meus dados"],
    duvidaText: "Contar sua história com uma empresa exige confiança sobre o que acontece com essa informação.",
    solucaoTitle: ["Uso restrito", "e consentido"],
    solucaoText: "Suas informações organizam seu atendimento e nunca são compartilhadas sem sua autorização.",
  },
  {
    duvidaTitle: ["Quanto tempo", "vou esperar"],
    duvidaText: "A incerteza sobre prazos é uma das partes mais difíceis de buscar cuidado.",
    solucaoTitle: ["Clareza sobre", "o próximo passo"],
    solucaoText: "O tempo varia conforme sua situação, mas você nunca fica sem saber o que vem a seguir.",
  },
  {
    duvidaTitle: ["A Aliviar", "substitui um médico?"],
    duvidaText: "É natural se perguntar se a curadoria troca o acompanhamento profissional de saúde.",
    solucaoTitle: ["Conectamos você", "a quem cuida"],
    solucaoText: "O cuidado em si é sempre humano — nós organizamos o caminho até ele.",
  },
];

export function FaqBookSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const innerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${CARDS.length * 100}%`,
            scrub: 1,
            pin: true,
          },
        });

        CARDS.forEach((_, index) => {
          const inner = innerRefs.current[index];
          const card = cardRefs.current[index];
          if (!inner || !card || index === CARDS.length - 1) return;

          timeline
            .to(inner, {
              rotateY: 180,
              duration: 1,
              ease: "power2.inOut",
              onStart: () => setCurrentIndex(index),
              onReverseComplete: () => setCurrentIndex(index),
              onUpdate: function onUpdate() {
                // Sombra "de folha se levantando" — mais forte no meio do
                // giro, praticamente ausente no início/fim (nunca um
                // bounce, só profundidade física plausível). Calculada e
                // aplicada direto via JS (mais simples e confiável do que
                // depender de calc() com custom property em classe
                // arbitrária do Tailwind).
                const lift = Math.sin(this.progress() * Math.PI);
                card.style.boxShadow = `${4 + lift * 10}px ${8 + lift * 14}px ${18 + lift * 24}px rgba(27, 39, 51, ${0.12 + lift * 0.18})`;
              },
            })
            .to(card, { y: "-120%", opacity: 0, duration: 0.6, ease: "power1.in", onStart: () => setCurrentIndex(index + 1) }, "+=0.15");
        });
      }, sectionRef);
    })();

    return () => ctx?.revert();
  }, []);

  const advance = (direction: 1 | -1) => {
    window.scrollBy({ top: direction * window.innerHeight, behavior: "smooth" });
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
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">Dúvida</span>
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
          if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight") {
            event.preventDefault();
            advance(1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            advance(-1);
          }
        }}
        className="relative flex min-h-screen cursor-pointer flex-col items-center justify-center overflow-hidden px-4 py-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:px-8"
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

        <div className="relative h-[22rem] w-full max-w-xs" style={{ perspective: "2000px" }}>
          {CARDS.map((card, index) => (
            <div
              key={card.duvidaTitle.join()}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="absolute inset-0 shadow-lg"
              style={{
                zIndex: CARDS.length - index,
                transform: `translate(${index * 3}px, ${index * 4}px)`,
              }}
            >
              <div
                ref={(el) => {
                  innerRefs.current[index] = el;
                }}
                className="relative size-full"
                style={{ transformStyle: "preserve-3d", transformOrigin: "left center" }}
              >
                <div
                  className="absolute inset-0 flex flex-col justify-start rounded-r-2xl rounded-l-sm border border-border bg-[linear-gradient(160deg,_var(--color-bg-surface)_0%,_color-mix(in_srgb,_var(--color-brand-sage)_35%,_var(--color-bg-surface))_100%)] p-6 pl-7 pt-7"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-2 rounded-l-sm bg-gradient-to-r from-ink/15 to-transparent"
                  />
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">Dúvida</span>
                  <p className="mt-3 font-serif text-2xl italic leading-tight text-ink">
                    {card.duvidaTitle[0]}
                    <br />
                    {card.duvidaTitle[1]}
                  </p>
                  <p className="mt-3 text-sm text-ink-muted">{card.duvidaText}</p>
                </div>
                <div
                  className="absolute inset-0 flex flex-col justify-start rounded-r-2xl rounded-l-sm border border-border bg-[linear-gradient(160deg,_var(--color-bg-surface)_0%,_var(--color-brand-sage)_100%)] p-6 pl-7 pt-7"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
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
                  <p className="mt-3 text-sm text-brand-primary-deep/80">{card.solucaoText}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p aria-hidden="true" className="mt-8 text-xs uppercase tracking-[0.14em] text-ink-muted">
          Toque ou role para virar a página
        </p>
        <p aria-live="polite" className="sr-only">
          Pergunta {Math.min(currentIndex + 1, CARDS.length)} de {CARDS.length}
        </p>
      </div>
    </div>
  );
}
