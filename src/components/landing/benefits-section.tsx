import { Clock, HeartHandshake, ScanSearch } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardDescription } from "@/components/ui/card";
import { SectionContainer } from "@/components/landing/section-container";
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
    <SectionContainer>
      <SectionReveal className="mx-auto max-w-reading text-center">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-brand-sage">Na prática</span>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-ink lg:text-3xl">
          É isso que você recebe
        </h2>
      </SectionReveal>

      <div className="mx-auto mt-10 grid max-w-content gap-6 sm:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <Card key={benefit.title} padding="lg" className="border-brand-gold/20 text-center">
            <span
              aria-hidden="true"
              className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary"
            >
              <benefit.icon className="size-6" aria-hidden={true} />
            </span>
            <h3 className="mt-4 font-serif text-lg font-semibold text-ink">{benefit.title}</h3>
            <CardDescription className="mt-2">{benefit.description}</CardDescription>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}
