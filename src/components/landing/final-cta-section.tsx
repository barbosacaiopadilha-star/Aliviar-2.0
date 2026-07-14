import { LinkButton } from "@/components/landing/link-button";
import { SectionContainer } from "@/components/landing/section-container";
import { SectionReveal } from "@/components/landing/section-reveal";

export function FinalCtaSection() {
  return (
    <SectionContainer className="bg-brand-primary">
      <SectionReveal className="mx-auto flex max-w-reading flex-col items-center gap-8 text-center">
        <h2 className="font-serif text-3xl font-semibold leading-snug text-surface lg:text-4xl">
          Quando estiver pronto, estamos aqui — sem pressa e sem urgência artificial.
        </h2>
        <LinkButton href="/sua-historia" variant="secondary">
          Contar minha história
        </LinkButton>
      </SectionReveal>
    </SectionContainer>
  );
}
