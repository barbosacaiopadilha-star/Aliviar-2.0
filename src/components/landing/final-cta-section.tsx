import { FinalActions } from "@/components/landing/final-actions";
import { GoldCornerAccent } from "@/components/landing/gold-corner-accent";
import { SectionContainer } from "@/components/landing/section-container";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionReveal } from "@/components/landing/section-reveal";

export function FinalCtaSection() {
  return (
    <SectionContainer className="relative overflow-hidden bg-[linear-gradient(160deg,_var(--color-brand-sage)_0%,_color-mix(in_srgb,_var(--color-brand-sage)_70%,_var(--color-ink))_55%,_var(--color-brand-primary-deep)_100%)]">
      <GoldCornerAccent className="right-0 top-0 size-40 opacity-60 lg:size-56" />
      <SectionReveal className="relative mx-auto flex max-w-reading flex-col items-center gap-8 text-center">
        <SectionEyebrow tone="dark">Quando estiver pronto</SectionEyebrow>
        <h2 className="font-serif text-3xl font-semibold leading-snug text-surface lg:text-4xl">
          Estamos aqui — sem pressa e sem urgência artificial.
        </h2>
        <div aria-hidden="true" className="gold-divider" />
        <FinalActions />
      </SectionReveal>
    </SectionContainer>
  );
}
