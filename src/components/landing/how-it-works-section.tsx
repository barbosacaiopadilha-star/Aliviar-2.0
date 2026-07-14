import { SectionContainer } from "@/components/landing/section-container";
import { SectionReveal } from "@/components/landing/section-reveal";

// Faixa de etapas curta (rótulo de duas linhas + traço conector), no
// mesmo espírito da faixa "Triagem → Análise → Curadoria → Convênio →
// Cirurgia → Cuidado" do site de referência (aliviar-temp.vercel.app) —
// mas com os estágios reais da jornada Aliviar Curadoria, nunca copiados
// literalmente (não gerimos convênio/cirurgia, isso é de outro produto
// da mesma empresa).
const JOURNEY_STEPS = [
  { top: "Sua", bottom: "História" },
  { top: "Curadoria", bottom: "Criteriosa" },
  { top: "Conversa", bottom: "Acompanhada" },
  { top: "Cuidado", bottom: "Contínuo" },
] as const;

export function HowItWorksSection() {
  return (
    <SectionContainer className="bg-brand-primary-deep py-10 lg:py-12">
      <SectionReveal className="mx-auto max-w-content">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-6 lg:flex-nowrap lg:justify-between">
          {JOURNEY_STEPS.map((step, index) => (
            <div key={step.top} className="flex items-center gap-2 lg:gap-4">
              <div className="flex flex-col items-center text-center">
                <span
                  aria-hidden="true"
                  className="mb-2 size-2 rounded-full bg-brand-gold"
                />
                <span className="font-serif text-base font-medium leading-tight text-surface lg:text-lg">
                  {step.top}
                </span>
                <span className="text-sm text-brand-sage-light">{step.bottom}</span>
              </div>
              {index < JOURNEY_STEPS.length - 1 && (
                <span aria-hidden="true" className="hidden h-px w-10 bg-surface/20 lg:block" />
              )}
            </div>
          ))}
        </div>
      </SectionReveal>
    </SectionContainer>
  );
}
