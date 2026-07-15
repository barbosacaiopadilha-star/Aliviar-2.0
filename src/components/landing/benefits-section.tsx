import { Clock, HeartHandshake, ScanSearch } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardDescription } from "@/components/ui/card";
import { GoldenThread } from "@/components/landing/golden-thread";
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
    description: "O caminho mais adequado ao seu caso, com critério.",
  },
  {
    icon: Clock,
    title: "Agilidade no processo",
    description: "Menos espera, menos burocracia, em cada etapa.",
  },
  {
    icon: HeartHandshake,
    title: "Cuidado completo",
    description: "Alguém dedicado, do primeiro contato à conversa que importa.",
  },
];

export function BenefitsSection() {
  return (
    <SectionContainer className="relative overflow-hidden bg-[linear-gradient(180deg,_color-mix(in_srgb,_var(--color-brand-sage)_45%,_var(--color-bg-canvas))_0%,_var(--color-bg-canvas)_45%,_var(--color-bg-canvas)_100%)]">
      {/* Curva única e ampla — o mesmo gesto de "mão em concha" da logo
          (dois arcos abraçando o coração), nunca uma linha ondulada
          genérica. */}
      <GoldenThread
        d="M340 0 C 140 78, 140 273, 300 364 C 380 410, 340 468, 220 520"
        className="left-1/2 top-0 h-full w-40 -translate-x-1/2 opacity-60 lg:w-64"
        viewBox="0 0 400 520"
      />
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
              <span className="animate-breathe mx-auto inline-flex">
                <span
                  aria-hidden="true"
                  className="inline-flex size-12 items-center justify-center rounded-full bg-brand-sage/15 text-brand-sage transition-transform duration-base ease-standard group-hover:-rotate-6 group-hover:scale-110"
                >
                  <benefit.icon className="size-6" aria-hidden={true} />
                </span>
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
