import { LinkButton } from "@/components/landing/link-button";
import { SectionContainer } from "@/components/landing/section-container";

export function FinalCtaSection() {
  return (
    <SectionContainer className="bg-brand-primary">
      <div className="mx-auto flex max-w-reading flex-col items-center gap-4 text-center">
        <h2 className="font-serif text-2xl font-semibold text-surface lg:text-3xl">
          Quando estiver pronto, estamos aqui.
        </h2>
        <p className="text-base text-surface">
          Sem pressa e sem urgência artificial — comece quando fizer sentido para você.
        </p>
        <LinkButton href="/sua-historia" variant="secondary">
          Contar minha história
        </LinkButton>
      </div>
    </SectionContainer>
  );
}
