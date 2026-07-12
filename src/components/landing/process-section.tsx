import { SectionContainer } from "@/components/landing/section-container";

const STAGES = [
  {
    label: "Antes",
    title: "Você conta sua história",
    description: "Sem formulário frio, sem pressa — no seu tempo e com suas palavras.",
  },
  {
    label: "Organização",
    title: "Cuidamos dos detalhes",
    description: "Sua situação é entendida com calma e organizada em um caminho claro.",
  },
  {
    label: "Encontro",
    title: "Você conversa, acompanhado",
    description: "No momento decisivo, a equipe Aliviar está com você, em tempo real.",
  },
  {
    label: "Depois",
    title: "O acompanhamento continua",
    description: "Enquanto você precisar — nunca terminamos no primeiro contato.",
  },
] as const;

export function ProcessSection() {
  return (
    <SectionContainer>
      <div className="mx-auto max-w-reading text-center">
        <h2 className="font-serif text-2xl font-semibold text-ink lg:text-3xl">
          Este será o seu acompanhamento
        </h2>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-4 lg:gap-6">
        {STAGES.map((stage, index) => (
          <div key={stage.label} className="relative flex flex-col gap-2 pl-6 lg:pl-0 lg:pt-6">
            <div
              aria-hidden="true"
              className="absolute left-0 top-1 h-full w-px bg-border lg:left-0 lg:right-0 lg:top-0 lg:h-px lg:w-full"
            />
            <div
              aria-hidden="true"
              className="absolute left-[-4px] top-0 size-2.5 rounded-full bg-brand-gold lg:left-0 lg:top-[-4px]"
            />
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
              {String(index + 1).padStart(2, "0")} · {stage.label}
            </span>
            <h3 className="font-sans text-lg font-semibold text-ink">{stage.title}</h3>
            <p className="text-sm text-ink-muted">{stage.description}</p>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
