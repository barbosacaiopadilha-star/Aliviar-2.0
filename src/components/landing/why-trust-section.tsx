import { BookUser, ShieldCheck, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardDescription } from "@/components/ui/card";
import { SectionContainer } from "@/components/landing/section-container";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionReveal } from "@/components/landing/section-reveal";

// Três critérios de avaliação — no mesmo espírito de "Como avaliamos os
// médicos parceiros" do site de referência, com o critério real da
// Aliviar Curadoria (nunca copiado literalmente). Fundo navy escuro:
// alterna o ritmo claro/escuro da Landing (Hero e a faixa de jornada já
// são escuras) em vez de mais uma seção branca.
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
    <SectionContainer className="border-t border-brand-gold/25 bg-brand-primary-deep">
      <SectionReveal className="mx-auto max-w-reading text-center">
        <SectionEyebrow tone="dark">Critério, não sorte</SectionEyebrow>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-surface lg:text-3xl">
          Como avaliamos cada profissional
        </h2>
      </SectionReveal>

      <div className="mx-auto mt-10 grid max-w-content gap-6 sm:grid-cols-3">
        {CRITERIA.map((criterion, index) => (
          <SectionReveal key={criterion.title} delayMs={index * 120}>
            <Card
              padding="lg"
              className="card-lift h-full border-brand-gold/30 bg-surface/[0.04] text-center shadow-none"
            >
              <span
                aria-hidden="true"
                className="mx-auto inline-flex size-10 items-center justify-center rounded-full border border-brand-gold/50 text-brand-gold"
              >
                <criterion.icon className="size-5" aria-hidden={true} />
              </span>
              <h3 className="mt-4 font-serif text-lg font-semibold text-surface">{criterion.title}</h3>
              <CardDescription className="mt-2 text-surface/70">{criterion.description}</CardDescription>
            </Card>
          </SectionReveal>
        ))}
      </div>
    </SectionContainer>
  );
}
