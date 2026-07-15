"use client";

import { useEffect, useRef, useState } from "react";
import type { ScrollTrigger } from "gsap/ScrollTrigger";

import { GoldenThread } from "@/components/landing/golden-thread";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionReveal } from "@/components/landing/section-reveal";
import { cn } from "@/components/ui/cn";

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

// Ritmo narrativo (Fase 4 do Masterplan V1.1) — pesos relativos, nunca
// segundos: o `scrub` do GSAP converte qualquer `duration` em distância
// física de scroll, nunca em tempo real, então "unidade" aqui é sempre
// proporção, não velocidade. Fonte única de verdade: tanto a timeline
// (montada mais abaixo) quanto os marcos de navegação por clique/teclado
// (MARK_PROGRESS) derivam exatamente destes números — nunca duplicados,
// nunca podem divergir um do outro.
const FIRST_QUESTION_SETTLE_UNITS = 1; // assentamento antes da 1ª virada
const LAST_QUESTION_SETTLE_UNITS = 1; // assentamento da última dúvida antes de o pin liberar
const FIRST_TURN_EMPHASIS = 1.3; // a 1ª virada recebe mais peso que as demais
const TURN_DURATION_UNITS = 1; // peso-base de uma virada (rotateY)
const TURN_TO_EXIT_GAP_UNITS = 0.15; // intervalo entre virada e saída (inalterado)
const EXIT_DURATION_UNITS = 0.6; // peso-base de uma saída (inalterado)
const TRANSITION_UNITS = TURN_DURATION_UNITS + TURN_TO_EXIT_GAP_UNITS + EXIT_DURATION_UNITS;

// Percurso total da Biblioteca — reduzido de 600vh (CARDS.length * 100,
// herança de fórmula nunca calibrada contra a leitura real) para 390vh.
// A proporção interna entre assentamento/virada/saída não muda — o
// scrub reparte automaticamente sobre a nova distância total.
const BOOK_SCROLL_VH = 390;

// Peso de cada uma das 5 transições reais (a última carta nunca vira —
// ela só assenta, ver o `.forEach` mais abaixo).
const TRANSITION_EMPHASIS: number[] = Array.from({ length: CARDS.length - 1 }, (_, index) =>
  index === 0 ? FIRST_TURN_EMPHASIS : 1,
);

// Marcos normalizados (0 a 1) da posição de repouso de cada carta,
// calculados a partir dos mesmos pesos usados para montar a timeline —
// consumidos pelo avanço por clique/teclado (ver `advance`).
const MARK_PROGRESS: number[] = (() => {
  const marks = [0];
  let acc = FIRST_QUESTION_SETTLE_UNITS;
  for (const emphasis of TRANSITION_EMPHASIS) {
    acc += TRANSITION_UNITS * emphasis;
    marks.push(acc);
  }
  const total = acc + LAST_QUESTION_SETTLE_UNITS;
  return marks.map((mark) => mark / total);
})();

export function FaqBookSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const innerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
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
      window.scrollBy({ top: direction * window.innerHeight, behavior: "smooth" });
      return;
    }
    // Fase 4, Correção 2: avança/volta até o marco lógico real da carta
    // vizinha (posição absoluta, lida ao vivo do ScrollTrigger — nunca um
    // estado duplicado que possa divergir do progresso real do scroll),
    // não mais uma distância fixa em pixels. Primeira e última carta são
    // limites seguros: o índice fica sempre dentro de [0, CARDS.length-1].
    const targetIndex = Math.min(Math.max(currentIndex + direction, 0), CARDS.length - 1);
    const targetY = st.start + MARK_PROGRESS[targetIndex] * (st.end - st.start);
    window.scrollTo({ top: targetY, behavior: "smooth" });
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

        <div className="relative h-[22rem] w-full max-w-xs" style={{ perspective: "2000px" }}>
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
                index === currentIndex && "hover:shadow-2xl group-focus-visible:shadow-2xl",
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
                  index === currentIndex && "hover:-translate-y-1 group-focus-visible:-translate-y-1",
                )}
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
