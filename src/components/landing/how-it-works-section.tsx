import { Card, CardDescription } from "@/components/ui/card";
import { SectionContainer } from "@/components/landing/section-container";

const STEPS = [
  {
    number: "1",
    title: "Conte o que você busca",
    description: "Com suas palavras, no seu ritmo — sem formulário frio, sem pressa.",
  },
  {
    number: "2",
    title: "Alguém organiza isso por você",
    description: "Sua história vira um caminho claro, escolhido com critério — nunca por anúncio.",
  },
  {
    number: "3",
    title: "Você segue acompanhado",
    description: "Do primeiro contato à conversa que importa, sempre com alguém do seu lado.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <SectionContainer className="bg-surface">
      <div className="mx-auto max-w-reading text-center">
        <h2 className="font-serif text-2xl font-semibold text-ink lg:text-3xl">É assim que funciona</h2>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.number} padding="lg">
            <span
              aria-hidden="true"
              className="inline-flex size-10 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-surface"
            >
              {step.number}
            </span>
            <h3 className="mt-4 font-sans text-xl font-semibold text-ink">{step.title}</h3>
            <CardDescription className="mt-2">{step.description}</CardDescription>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}
