"use client";

import { useEffect, useRef, useState } from "react";

import { SectionEyebrow } from "@/components/landing/section-eyebrow";

// Pilha de cards com flip 3D real (Dúvida na frente, Solução atrás),
// fixada na tela durante a rolagem — a mesma dinâmica do site de
// referência (aliviar-temp.vercel.app), reconstruída com GSAP +
// ScrollTrigger (biblioteca padrão, todos os plugins gratuitos desde
// 2024 — nunca um serviço proprietário). Mesmo padrão de conteúdo das
// nossas dúvidas reais (não as frases literais deles, que descrevem
// convênio/cirurgia — um produto irmão distinto).
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

export function DuvidasStackSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const innerRefs = useRef<Array<HTMLDivElement | null>>([]);
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
            .to(inner, { rotateY: 180, duration: 1, ease: "power2.inOut" })
            .to(card, { y: "-120%", opacity: 0, duration: 0.6, ease: "power1.in" }, "+=0.15");
        });
      }, sectionRef);
    })();

    return () => ctx?.revert();
  }, []);

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
              className="rounded-2xl border border-brand-gold/50 bg-[linear-gradient(160deg,_var(--color-bg-surface)_0%,_color-mix(in_srgb,_var(--color-brand-sage)_25%,_var(--color-bg-surface))_100%)] p-6"
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
      <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16 lg:px-8">
        <div className="mb-10 max-w-reading text-center">
          <SectionEyebrow>Suas dúvidas</SectionEyebrow>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink lg:text-3xl">
            Perguntas que costumam vir antes do primeiro passo
          </h2>
        </div>

        <div className="relative h-[22rem] w-full max-w-xs" style={{ perspective: "1600px" }}>
          {CARDS.map((card, index) => (
            <div
              key={card.duvidaTitle.join()}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="absolute inset-0"
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
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 flex flex-col justify-start rounded-2xl border border-brand-gold/50 bg-[linear-gradient(160deg,_var(--color-bg-surface)_0%,_color-mix(in_srgb,_var(--color-brand-sage)_35%,_var(--color-bg-surface))_100%)] p-6 pt-7 shadow-lg"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">Dúvida</span>
                  <p className="mt-3 font-serif text-2xl italic leading-tight text-ink">
                    {card.duvidaTitle[0]}
                    <br />
                    {card.duvidaTitle[1]}
                  </p>
                  <p className="mt-3 text-sm text-ink-muted">{card.duvidaText}</p>
                </div>
                <div
                  className="absolute inset-0 flex flex-col justify-start rounded-2xl border border-brand-gold/50 bg-[linear-gradient(160deg,_var(--color-bg-surface)_0%,_var(--color-brand-sage)_100%)] p-6 pt-7 shadow-lg"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
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
          Role para ver todas
        </p>
      </div>
    </div>
  );
}
