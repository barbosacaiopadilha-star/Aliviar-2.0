import { SectionContainer } from "@/components/landing/section-container";
import { SectionReveal } from "@/components/landing/section-reveal";

// Layout assimétrico (eyebrow+frase à esquerda, lista corrida à direita),
// deliberadamente diferente do grid de cards com selo dourado de
// WhyTrustSection e da tira numerada de HowItWorksSection — três seções
// vizinhas, três composições distintas, nenhuma repetindo o mesmo bloco.
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
      <SectionReveal className="mx-auto grid max-w-content gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="text-center lg:text-left">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-brand-sage">
            Na prática
          </span>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-ink lg:text-3xl">
            É isso que você recebe
          </h2>
        </div>

        <div>
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="border-t border-brand-gold/20 py-5 first:border-t-0 first:pt-0">
              <h3 className="font-sans text-lg font-semibold text-ink">{benefit.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{benefit.description}</p>
            </div>
          ))}
        </div>
      </SectionReveal>
    </SectionContainer>
  );
}
