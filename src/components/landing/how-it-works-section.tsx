import { SectionContainer } from "@/components/landing/section-container";
import { SectionReveal } from "@/components/landing/section-reveal";

// Fusão de "Como funciona" (mecânica) + "Processo" (acompanhamento ao
// longo do tempo) — eram duas seções com passos parecidos em formatos
// diferentes (Landing V1); a V2 junta num único ritmo de jornada, em tira
// horizontal no desktop. Reforça explicitamente "três profissionais
// selecionados" e "a escolha final é sempre sua" (condições de conteúdo
// da V2 — nunca ranking, nunca decisão automática).
const JOURNEY_STEPS = [
  {
    label: "Você conta sua história",
    description: "Sem formulário frio, no seu tempo e com suas próprias palavras.",
  },
  {
    label: "Organizamos com critério",
    description: "Sua história vira um caminho claro: três profissionais selecionados, nunca por anúncio.",
  },
  {
    label: "Você conversa, acompanhado",
    description: "No momento que importa, alguém da equipe Aliviar está com você, explicando cada passo.",
  },
  {
    label: "A escolha e o cuidado continuam",
    description: "A decisão final é sempre sua — e seguimos por perto enquanto for útil para você.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <SectionContainer className="bg-surface">
      <SectionReveal className="mx-auto max-w-reading text-center">
        <h2 className="font-serif text-2xl font-semibold text-ink lg:text-3xl">Sua jornada com a Aliviar</h2>
      </SectionReveal>

      <div className="relative mt-14 grid gap-10 lg:grid-cols-4 lg:gap-6">
        <div
          aria-hidden="true"
          className="absolute left-4 top-0 hidden h-px w-[calc(100%-2rem)] bg-border lg:block"
          style={{ top: "0.55rem" }}
        />
        {JOURNEY_STEPS.map((step, index) => (
          <div key={step.label} className="relative flex flex-col gap-2 pl-9 lg:pl-0">
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 flex size-[1.1rem] items-center justify-center lg:relative lg:mb-3"
            >
              <span className="size-2 rounded-full bg-brand-gold" />
              <span className="absolute inset-0 rounded-full border border-brand-gold/30" />
            </div>
            <span className="font-serif text-sm text-brand-sage">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="font-sans text-lg font-semibold text-ink">{step.label}</h3>
            <p className="text-sm text-ink-muted">{step.description}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
