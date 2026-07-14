import { FinalActions } from "@/components/landing/final-actions";
import { SectionContainer } from "@/components/landing/section-container";
import { SectionReveal } from "@/components/landing/section-reveal";

export function FinalCtaSection() {
  return (
    <SectionContainer className="bg-brand-primary">
      <SectionReveal className="mx-auto flex max-w-reading flex-col items-center gap-8 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-brand-sage-light">
          Quando estiver pronto
        </span>
        <h2 className="font-serif text-3xl font-semibold leading-snug text-surface lg:text-4xl">
          Estamos aqui — sem pressa e sem urgência artificial.
        </h2>
        <FinalActions />
      </SectionReveal>
    </SectionContainer>
  );
}
