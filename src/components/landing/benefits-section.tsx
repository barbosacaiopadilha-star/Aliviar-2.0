import { Clock, Compass, MessageCircle, UserCheck } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardDescription } from "@/components/ui/card";
import { SectionContainer } from "@/components/landing/section-container";

const BENEFITS: Array<{
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}> = [
  {
    icon: UserCheck,
    title: "Um curador médico dedicado",
    description: "Alguém acompanha o seu caso do início ao fim — nunca só uma tela decidindo por você.",
  },
  {
    icon: MessageCircle,
    title: "Companhia em tempo real",
    description:
      "No momento da conversa que importa, a equipe Aliviar está com você, explicando cada passo.",
  },
  {
    icon: Compass,
    title: "Clareza sobre o próximo passo",
    description: "Você sempre sabe o que vem a seguir — nunca fica esperando sem entender por quê.",
  },
  {
    icon: Clock,
    title: "No seu tempo",
    description: "Sem urgência artificial, sem prazo forçado — o ritmo é o seu.",
  },
];

export function BenefitsSection() {
  return (
    <SectionContainer className="bg-surface">
      <div className="mx-auto max-w-reading text-center">
        <h2 className="font-serif text-2xl font-semibold text-ink lg:text-3xl">
          É isso que você recebe
        </h2>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((benefit) => (
          <Card key={benefit.title} padding="lg">
            <span
              aria-hidden="true"
              className="inline-flex size-10 items-center justify-center rounded-full bg-brand-sage text-ink"
            >
              <benefit.icon className="size-5" aria-hidden={true} />
            </span>
            <h3 className="mt-4 font-sans text-lg font-semibold text-ink">{benefit.title}</h3>
            <CardDescription className="mt-2">{benefit.description}</CardDescription>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}
