import { FinalActions } from "@/components/landing/final-actions";
import { GoldenThread } from "@/components/landing/golden-thread";
import { SectionContainer } from "@/components/landing/section-container";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionReveal } from "@/components/landing/section-reveal";

export function FinalCtaSection() {
  return (
    <SectionContainer className="relative overflow-hidden bg-[linear-gradient(160deg,_color-mix(in_srgb,_var(--color-brand-sage)_75%,_var(--color-ink))_0%,_color-mix(in_srgb,_var(--color-brand-sage)_70%,_var(--color-ink))_55%,_var(--color-brand-primary-deep)_100%)]">
      {/* Fecha o abraço: mesma curva de WhyTrust, convergindo no CTA. */}
      <GoldenThread
        d="M340 0 C 140 84, 140 294, 300 392 C 380 441, 340 504, 220 560"
        className="left-1/2 top-0 h-full w-40 -translate-x-1/2 opacity-70 lg:w-64"
        viewBox="0 0 400 560"
      />
      <SectionReveal className="relative mx-auto flex max-w-reading flex-col items-center gap-8 text-center">
        <SectionEyebrow tone="dark">Quando estiver pronto</SectionEyebrow>
        <h2 className="font-serif text-3xl font-semibold leading-snug text-surface lg:text-4xl">
          Estamos aqui — sem pressa e sem urgência artificial.
        </h2>
        <FinalActions />
      </SectionReveal>
    </SectionContainer>
  );
}
