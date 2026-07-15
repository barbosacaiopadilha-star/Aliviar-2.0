import { BookUser, ShieldCheck, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardDescription } from "@/components/ui/card";
import { GoldenThread } from "@/components/landing/golden-thread";
import { SectionContainer } from "@/components/landing/section-container";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionReveal } from "@/components/landing/section-reveal";

// Três critérios de avaliação — no mesmo espírito de "Como avaliamos os
// médicos parceiros" do site de referência, com o critério real da
// Aliviar Curadoria (nunca copiado literalmente). Fundo sage escuro
// (não navy) — a Landing tinha navy em excesso (Hero, esta seção, CTA
// final, rodapé); sage passa a ser a cor escura protagonista aqui e no
// CTA final, invertendo o equilíbrio.
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
    <SectionContainer className="relative overflow-hidden bg-[linear-gradient(180deg,_var(--color-bg-canvas)_0%,_color-mix(in_srgb,_var(--color-brand-sage)_75%,_var(--color-ink))_35%,_color-mix(in_srgb,_var(--color-brand-sage)_75%,_var(--color-ink))_100%)]">
      {/* Espelha a curva de Benefits (mesmo gesto, mão oposta) — reforça
          a sensação de fio contínuo entre seções. */}
      <GoldenThread
        d="M60 0 C 260 84, 260 294, 100 392 C 20 441, 60 504, 180 560"
        className="left-1/2 top-0 h-full w-40 -translate-x-1/2 opacity-70 lg:w-64"
        viewBox="0 0 400 560"
      />
      <SectionReveal className="mx-auto max-w-reading text-center">
        <SectionEyebrow tone="dark">Critério, não sorte</SectionEyebrow>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-surface lg:text-3xl">
          Como avaliamos cada profissional
        </h2>
        <div aria-hidden="true" className="gold-divider mx-auto mt-4" />
      </SectionReveal>

      <div className="mx-auto mt-10 grid max-w-content gap-6 sm:grid-cols-3">
        {CRITERIA.map((criterion, index) => (
          <SectionReveal key={criterion.title} delayMs={index * 120}>
            <Card
              padding="lg"
              className="card-lift group h-full border-brand-gold/60 bg-surface/[0.04] text-center shadow-none"
            >
              <span className="animate-breathe mx-auto inline-flex">
                <span
                  aria-hidden="true"
                  className="inline-flex size-10 items-center justify-center rounded-full border-2 border-brand-gold bg-brand-gold/10 text-brand-gold transition-transform duration-base ease-standard group-hover:rotate-6 group-hover:scale-110"
                >
                  <criterion.icon className="size-5" aria-hidden={true} />
                </span>
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
