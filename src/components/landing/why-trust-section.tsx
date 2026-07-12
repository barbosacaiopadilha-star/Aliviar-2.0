import { Feather, HeartHandshake, Layers, Scale } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardDescription } from "@/components/ui/card";
import { SectionContainer } from "@/components/landing/section-container";

const REASONS: Array<{
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}> = [
  {
    icon: Scale,
    title: "Curadoria independente",
    description: "Cada recomendação é escolhida com critério — nunca comprada ou patrocinada.",
  },
  {
    icon: HeartHandshake,
    title: "Cuidado humano antes de tecnologia",
    description:
      "A tecnologia apoia a decisão humana; nunca a substitui ou a esconde atrás de automação.",
  },
  {
    icon: Layers,
    title: "Modelo modular e evolutivo",
    description:
      "A plataforma cresce junto com a sua jornada de cuidado, não é uma ferramenta de função única.",
  },
  {
    icon: Feather,
    title: "Identidade discreta e sofisticada",
    description: "Comunicamos confiança por espaço e cuidado editorial, nunca por promessa exagerada.",
  },
];

export function WhyTrustSection() {
  return (
    <SectionContainer>
      <div className="mx-auto max-w-reading text-center">
        <h2 className="font-serif text-2xl font-semibold text-ink lg:text-3xl">
          É por isso que as pessoas confiam
        </h2>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((reason) => (
          <Card key={reason.title} padding="lg">
            <span
              aria-hidden="true"
              className="inline-flex size-10 items-center justify-center rounded-full bg-brand-primary text-surface"
            >
              <reason.icon className="size-5" aria-hidden={true} />
            </span>
            <h3 className="mt-4 font-sans text-lg font-semibold text-ink">{reason.title}</h3>
            <CardDescription className="mt-2">{reason.description}</CardDescription>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}
