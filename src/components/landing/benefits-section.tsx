import { Clock, HeartHandshake, ScanSearch } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardDescription } from "@/components/ui/card";
import { SectionContainer } from "@/components/landing/section-container";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionReveal } from "@/components/landing/section-reveal";

// Grid de 3 cards com ícone — mesma densidade/proporção do bloco de
// benefícios do site de referência (aliviar-temp.vercel.app), com a copy
// e o critério da Aliviar Curadoria, nunca copiados literalmente.
const BENEFITS: Array<{
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}> = [
  {
    icon: ScanSearch,
    title: "Curadoria criteriosa",
    description: "Análise personalizada para indicar o caminho mais adequado ao seu caso.",
  },
  {
    icon: Clock,
    title: "Agilidade no processo",
    description: "Acompanhamos cada etapa para reduzir a espera e a burocracia.",
  },
  {
    icon: HeartHandshake,
    title: "Cuidado completo",
    description: "Alguém dedicado te acompanha do primeiro contato à conversa que importa.",
  },
];

export function BenefitsSection() {
  return (
    <SectionContainer className="bg-[linear-gradient(180deg,_var(--color-bg-canvas)_0%,_color-mix(in_srgb,_var(--color-brand-sage)_10%,_var(--color-bg-canvas))_100%)]">
      <SectionReveal className="mx-auto max-w-reading text-center">
        <SectionEyebrow>Na prática</SectionEyebrow>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-ink lg:text-3xl">
          É isso que você recebe
        </h2>
        <div aria-hidden="true" className="gold-divider mx-auto mt-4" />
      </SectionReveal>

      <div className="mx-auto mt-10 grid max-w-content gap-6 sm:grid-cols-3">
        {BENEFITS.map((benefit, index) => (
          <SectionReveal key={benefit.title} delayMs={index * 120}>
            <Card
              padding="lg"
              className="card-lift group h-full border-brand-gold/60 bg-[color-mix(in_srgb,_var(--color-brand-sage)_6%,_var(--color-bg-surface))] text-center"
            >
              <span
                aria-hidden="true"
                className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-brand-sage/15 text-brand-sage transition-transform duration-base ease-standard group-hover:-rotate-6 group-hover:scale-110"
              >
                <benefit.icon className="size-6" aria-hidden={true} />
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-ink">{benefit.title}</h3>
              <CardDescription className="mt-2">{benefit.description}</CardDescription>
            </Card>
          </SectionReveal>
        ))}
      </div>
    </SectionContainer>
  );
}
