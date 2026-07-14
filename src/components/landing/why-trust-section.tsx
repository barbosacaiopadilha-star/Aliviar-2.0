import { BookUser, ShieldCheck, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardDescription } from "@/components/ui/card";
import { SectionContainer } from "@/components/landing/section-container";
import { SectionReveal } from "@/components/landing/section-reveal";

// Três critérios de avaliação — no mesmo espírito de "Como avaliamos os
// médicos parceiros" do site de referência, com o critério real da
// Aliviar Curadoria (nunca copiado literalmente).
const CRITERIA: Array<{
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}> = [
  {
    icon: BookUser,
    title: "Currículo profissional",
    description: "Formação, especialização e trajetória de cada profissional na Rede Aliviar.",
  },
  {
    icon: ShieldCheck,
    title: "Ética e conduta",
    description: "Histórico profissional e conduta ética no cuidado ao paciente.",
  },
  {
    icon: TrendingUp,
    title: "Compatibilidade com o caso",
    description: "Experiência e abordagem compatíveis com a sua situação específica — nunca genérica.",
  },
];

export function WhyTrustSection() {
  return (
    <SectionContainer className="bg-surface">
      <SectionReveal className="mx-auto max-w-reading text-center">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-brand-sage">
          Critério, não sorte
        </span>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-ink lg:text-3xl">
          Como avaliamos cada profissional
        </h2>
      </SectionReveal>

      <div className="mx-auto mt-10 grid max-w-content gap-6 sm:grid-cols-3">
        {CRITERIA.map((criterion) => (
          <Card key={criterion.title} padding="lg" className="border-brand-gold/25 bg-transparent shadow-none">
            <span
              aria-hidden="true"
              className="inline-flex size-10 items-center justify-center rounded-full border border-brand-gold/40 text-brand-gold"
            >
              <criterion.icon className="size-5" aria-hidden={true} />
            </span>
            <h3 className="mt-4 font-sans text-lg font-semibold text-ink">{criterion.title}</h3>
            <CardDescription className="mt-2">{criterion.description}</CardDescription>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}
