import { LinkButton } from "@/components/landing/link-button";
import { SectionContainer } from "@/components/landing/section-container";

// Título com entrada em stagger, palavra por palavra — único lugar da
// Landing com esse tratamento (condição do usuário: stagger só no H1).
// Cada palavra herda o @keyframes fade-up já usado no resto da Landing,
// só com animation-delay incremental; prefers-reduced-motion continua
// resolvido pelo override global em globals.css.
const HEADLINE_WORDS = ["Uma", "escolha", "de", "cuidado,", "nunca", "sozinho."];

export function Hero() {
  return (
    <SectionContainer className="relative overflow-hidden pt-20 lg:pt-28">
      <div className="mx-auto flex max-w-reading flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-brand-sage">
          <span aria-hidden="true" className="h-px w-10 bg-brand-gold/60" />
          Curadoria médica independente
        </div>

        <h1 className="font-serif text-3xl font-semibold text-ink lg:text-4xl">
          {HEADLINE_WORDS.map((word, index) => (
            <span
              key={word}
              className="animate-fade-up inline-block"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              {word}
              {index < HEADLINE_WORDS.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>

        <p className="animate-fade-up text-lg text-ink-muted" style={{ animationDelay: "460ms" }}>
          Você conta sua história no seu tempo. Alguém da nossa equipe organiza um caminho
          claro, com critério — e caminha ao seu lado até a conversa que importa.
        </p>

        <div
          className="animate-fade-up flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          style={{ animationDelay: "540ms" }}
        >
          <LinkButton href="/sua-historia" variant="primary">
            Contar minha história
          </LinkButton>
        </div>
      </div>
    </SectionContainer>
  );
}
