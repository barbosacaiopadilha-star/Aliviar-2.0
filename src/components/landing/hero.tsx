import { LinkButton } from "@/components/landing/link-button";
import { SectionContainer } from "@/components/landing/section-container";

export function Hero() {
  return (
    <SectionContainer className="pt-20 lg:pt-28">
      <div className="mx-auto flex max-w-reading flex-col items-center gap-6 text-center">
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
