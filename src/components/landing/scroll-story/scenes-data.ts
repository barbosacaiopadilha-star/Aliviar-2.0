export type ScrollStoryScene = {
  id: string;
  eyebrow?: string;
  /** Só a cena 0 tem heading real (h1) — SEO/acessibilidade da página. */
  heading?: string;
  caption: string;
  microline?: string;
  /** true só na cena 0 — prioriza vídeo (institucional real ou loop ambiente) sobre foto. */
  isVideo?: boolean;
  /** Caminho da foto em public/scenes/ — ver docs/LANDING_V3_SCENES.md. */
  photoSrc?: string;
  /** Fallback honesto (gradiente com tokens existentes) enquanto a foto real não existe. */
  fallbackGradient: string;
  /** Grand Finale é a única cena clara — texto escuro em vez de branco sobre scrim. */
  textTone: "light" | "dark";
  isGrandFinale?: boolean;
};

// Copy reduzida (~30% do volume da V2), reaproveitando as frases-núcleo já
// aprovadas ("três profissionais selecionados", "a escolha final é sempre
// sua", "cuidado humano antes de tecnologia" — antes um card do
// WhyTrustSection, agora fundida nas cenas Organização/Companhia). Sete
// cenas, uma por momento emocional do documento de conceito da Landing V3.
export const SCROLL_STORY_SCENES: ScrollStoryScene[] = [
  {
    id: "recepcao",
    eyebrow: "Curadoria médica independente",
    heading: "Uma escolha de cuidado, nunca sozinho.",
    caption: "Você não precisa saber por onde começar.",
    isVideo: true,
    photoSrc: "/scenes/recepcao.jpg",
    fallbackGradient:
      "bg-[radial-gradient(120%_140%_at_50%_0%,_var(--color-brand-primary)_0%,_var(--color-brand-primary-deep)_55%,_#0a2544_100%)]",
    textTone: "light",
  },
  {
    id: "escuta",
    eyebrow: "Escuta",
    caption: "Conte sua história do seu jeito, no seu tempo.",
    photoSrc: "/scenes/escuta.jpg",
    fallbackGradient:
      "bg-[linear-gradient(155deg,_var(--color-brand-sage)_0%,_var(--color-brand-primary-deep)_120%)]",
    textTone: "light",
  },
  {
    id: "organizacao",
    eyebrow: "Organização",
    caption: "O que parecia confuso agora tem um caminho.",
    microline: "Três profissionais selecionados, nunca por anúncio.",
    photoSrc: "/scenes/organizacao.jpg",
    fallbackGradient:
      "bg-[linear-gradient(155deg,_var(--color-brand-primary)_0%,_var(--color-brand-gold)_150%)]",
    textTone: "light",
  },
  {
    id: "companhia",
    eyebrow: "Companhia",
    caption: "Na conversa que importa, você não está sozinho.",
    microline: "Cuidado humano antes de tecnologia.",
    photoSrc: "/scenes/companhia.jpg",
    fallbackGradient:
      "bg-[linear-gradient(155deg,_var(--color-brand-primary-deep)_0%,_var(--color-brand-sage)_150%)]",
    textTone: "light",
  },
  {
    id: "criterio",
    eyebrow: "Critério",
    caption: "A decisão final é sempre sua.",
    photoSrc: "/scenes/criterio.jpg",
    fallbackGradient:
      "bg-[linear-gradient(155deg,_var(--color-brand-gold)_0%,_var(--color-brand-primary-deep)_150%)]",
    textTone: "light",
  },
  {
    id: "entrega",
    eyebrow: "Entrega",
    caption: "Clareza para seguir em frente.",
    photoSrc: "/scenes/entrega.jpg",
    fallbackGradient:
      "bg-[linear-gradient(155deg,_var(--color-brand-sage-light)_0%,_var(--color-brand-sage)_140%)]",
    textTone: "light",
  },
  {
    id: "grand-finale",
    caption: "Quando estiver pronto, estamos aqui.",
    photoSrc: "/scenes/grand-finale.jpg",
    fallbackGradient: "bg-[linear-gradient(180deg,_var(--color-bg-surface)_0%,_var(--color-bg-canvas)_100%)]",
    textTone: "dark",
    isGrandFinale: true,
  },
];
