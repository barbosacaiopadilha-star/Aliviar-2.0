import { SectionContainer } from "@/components/landing/section-container";
import { SectionReveal } from "@/components/landing/section-reveal";

// Tratamento editorial (numeral serifado + regra fina), deliberadamente
// diferente do grid de cards com selo dourado de WhyTrustSection e da
// tira de ProviderJourney (HowItWorksSection) — três seções vizinhas,
// três composições distintas, nenhuma repetindo o mesmo bloco.
const BENEFITS = [
  {
    title: "Um curador médico dedicado",
    description: "Alguém acompanha o seu caso do início ao fim — nunca só uma tela decidindo por você.",
  },
  {
    title: "Companhia em tempo real",
    description:
      "No momento da conversa que importa, a equipe Aliviar está com você, explicando cada passo.",
  },
  {
    title: "Clareza sobre o próximo passo",
    description: "Você sempre sabe o que vem a seguir — nunca fica esperando sem entender por quê.",
  },
  {
    title: "No seu tempo",
    description: "Sem urgência artificial, sem prazo forçado — o ritmo é o seu.",
  },
] as const;

export function BenefitsSection() {
  return (
    <SectionContainer>
      <SectionReveal className="mx-auto max-w-reading text-center">
        <h2 className="font-serif text-2xl font-semibold text-ink lg:text-3xl">
          É isso que você recebe
        </h2>
      </SectionReveal>

      <div className="mx-auto mt-12 grid max-w-content gap-x-10 gap-y-8 border-t border-border pt-8 sm:grid-cols-2">
        {BENEFITS.map((benefit, index) => (
          <div key={benefit.title} className="flex gap-5">
            <span aria-hidden="true" className="font-serif text-2xl font-medium text-brand-sage">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="font-sans text-lg font-semibold text-ink">{benefit.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
