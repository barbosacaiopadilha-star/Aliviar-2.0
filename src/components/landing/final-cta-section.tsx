import { FinalActions } from "@/components/landing/final-actions";
import { SectionContainer } from "@/components/landing/section-container";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionReveal } from "@/components/landing/section-reveal";

export function FinalCtaSection() {
  return (
    <SectionContainer className="bg-[linear-gradient(160deg,_var(--color-brand-primary)_0%,_var(--color-brand-primary-deep)_100%)]">
      <SectionReveal className="mx-auto flex max-w-reading flex-col items-center gap-8 text-center">
        <SectionEyebrow tone="dark">Quando estiver pronto</SectionEyebrow>
        <h2 className="font-serif text-3xl font-semibold leading-snug text-surface lg:text-4xl">
          Estamos aqui — sem pressa e sem urgência artificial.
        </h2>
        <FinalActions />
      </SectionReveal>
    </SectionContainer>
  );
}
