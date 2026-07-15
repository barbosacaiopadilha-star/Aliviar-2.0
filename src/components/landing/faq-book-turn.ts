import { CARDS } from "@/components/landing/faq-cards";

// Motor de Virada do FAQ (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md
// §2, motor 9) — representa o estado lógico do livro (qual carta é a
// atual, para onde avançar/voltar) e a interpolação de posição de
// scroll que move esse estado por clique/teclado. Não desenha o livro,
// não acessa DOM, não produz classe CSS, não anima, não conhece o
// Portal.
//
// Máquina real descoberta antes de formalizar (não inventada): não
// existe, no código original, um estado explícito de "face"
// (pergunta/solução — as duas já ficam sempre no DOM, alternadas só por
// `rotateY`/`backfaceVisibility`, CSS puro) nem de "fase"
// (idle/turning — a virada é um scrub contínuo do GSAP, nunca um estado
// discreto). O único estado lógico real é um índice de carta atual, sem
// wrap-around, sem seleção direta, sem bloqueio explícito durante
// transição. Por isso o contrato aqui é funções puras sobre esse
// índice, não um reducer com eventos — um reducer com `face`/`phase`/
// `SELECT_CARD` representaria uma máquina mais sofisticada do que a que
// existe de fato.
//
// Pesos e marcos de scroll movidos para cá porque alimentam um cálculo
// genuinamente lógico (`getFaqCardTargetScroll`, usado pelo avanço via
// clique/teclado) — não só duração visual. A composição (`faq-book-
// section.tsx`) importa os mesmos valores para montar as tweens reais do
// GSAP; nunca duplicados, nunca podem divergir um do outro (mesma regra
// já documentada no código original).
export const FIRST_QUESTION_SETTLE_UNITS = 1;
export const LAST_QUESTION_SETTLE_UNITS = 1;
export const FIRST_TURN_EMPHASIS = 1.3;
export const TURN_DURATION_UNITS = 1;
export const TURN_TO_EXIT_GAP_UNITS = 0.15;
export const EXIT_DURATION_UNITS = 0.6;
const TRANSITION_UNITS =
  TURN_DURATION_UNITS + TURN_TO_EXIT_GAP_UNITS + EXIT_DURATION_UNITS;

// Percurso total da Biblioteca, em vh — mesma constante de sempre.
export const BOOK_SCROLL_VH = 390;

// Peso de cada transição real (a última carta nunca vira, só assenta).
export const TRANSITION_EMPHASIS: number[] = Array.from(
  { length: CARDS.length - 1 },
  (_, index) => (index === 0 ? FIRST_TURN_EMPHASIS : 1),
);

// Marcos normalizados (0 a 1) da posição de repouso de cada carta.
export const MARK_PROGRESS: number[] = (() => {
  const marks = [0];
  let acc = FIRST_QUESTION_SETTLE_UNITS;
  for (const emphasis of TRANSITION_EMPHASIS) {
    acc += TRANSITION_UNITS * emphasis;
    marks.push(acc);
  }
  const total = acc + LAST_QUESTION_SETTLE_UNITS;
  return marks.map((mark) => mark / total);
})();

// Clamp puro — primeira e última carta são limites seguros, sem
// wrap-around. Mesma lógica usada hoje dentro de `advance()`.
export function getAdjacentFaqCardIndex(
  currentIndex: number,
  direction: 1 | -1,
  cardsCount: number,
): number {
  const safeCurrent = Number.isFinite(currentIndex) ? currentIndex : 0;
  const safeCount = Math.max(cardsCount, 1);
  return Math.min(Math.max(safeCurrent + direction, 0), safeCount - 1);
}

export type FaqCardTargetScroll = {
  targetIndex: number;
  targetScrollY: number;
};

// Reproduz exatamente o cálculo original de `advance()`: dado o índice
// atual, a direção, e os limites reais de scroll do ScrollTrigger já
// montado (lidos ao vivo pela composição, nunca duplicados aqui), decide
// a próxima carta e a posição de scroll correspondente.
export function getFaqCardTargetScroll(
  currentIndex: number,
  direction: 1 | -1,
  scrollRangeStart: number,
  scrollRangeEnd: number,
  cardsCount: number,
): FaqCardTargetScroll {
  const targetIndex = getAdjacentFaqCardIndex(
    currentIndex,
    direction,
    cardsCount,
  );
  const mark = MARK_PROGRESS[targetIndex] ?? 0;
  const targetScrollY =
    scrollRangeStart + mark * (scrollRangeEnd - scrollRangeStart);

  return { targetIndex, targetScrollY };
}
