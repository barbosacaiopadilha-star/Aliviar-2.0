import { LinkButton } from "@/components/landing/link-button";
import { SectionContainer } from "@/components/landing/section-container";

export function Hero() {
  return (
    <SectionContainer className="relative overflow-hidden pt-20 lg:pt-28">
      {/* Composição abstrata discreta — nunca imagem literal, só uma
          respiração de cor por trás do texto (Princípio: sofisticação sem
          ostentação). Fora do fluxo de leitura, decorativa. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[-8rem] -z-10 h-[28rem] bg-[radial-gradient(60%_60%_at_50%_35%,_var(--color-brand-sage-light)_0%,_transparent_70%)] opacity-[0.16]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[8%] top-8 -z-10 size-40 rounded-full bg-[radial-gradient(closest-side,_var(--color-brand-gold)_0%,_transparent_75%)] opacity-[0.12] lg:size-56"
      />

      <div className="animate-fade-up mx-auto flex max-w-reading flex-col items-center gap-6 text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink lg:text-4xl">
          Você não precisa enfrentar isso sozinho.
        </h1>
        <p className="text-lg text-ink-muted">
          Existe uma forma organizada e humana de decidir quem vai cuidar de você — com
          acompanhamento em cada etapa, do primeiro passo à conversa que importa.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <LinkButton href="/sua-historia" variant="primary">
            Contar minha história
          </LinkButton>
        </div>
      </div>
    </SectionContainer>
  );
}
