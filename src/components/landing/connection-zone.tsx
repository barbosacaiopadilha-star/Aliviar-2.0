import { SectionReveal } from "@/components/landing/section-reveal";

// Travessia entre os dois ambientes — sem foto nova. Um único gradiente
// vertical (tokens existentes) faz a luz derivar do frio da Recepção para
// o aberto do Final; o resto da jornada emocional (escuta, organização,
// companhia, critério) é carregado só por três frases isoladas, cada
// uma com bastante respiro, nunca um bloco de texto.
const CONNECTION_LINES = [
  { text: "Três profissionais selecionados, nunca por anúncio.", tone: "light" as const },
  { text: "Cuidado humano antes de tecnologia.", tone: "light" as const },
  { text: "A decisão final é sempre sua.", tone: "dark" as const },
];

export function ConnectionZone() {
  return (
    <section
      aria-hidden={false}
      className="relative flex flex-col gap-24 bg-[linear-gradient(180deg,_var(--color-brand-primary-deep)_0%,_var(--color-brand-sage)_55%,_var(--color-bg-canvas)_100%)] px-4 py-24 lg:gap-32 lg:px-8 lg:py-40"
    >
      {CONNECTION_LINES.map((line) => (
        <SectionReveal key={line.text} className="mx-auto max-w-reading text-center">
          <p
            className={
              line.tone === "dark"
                ? "font-serif text-2xl font-semibold text-ink lg:text-3xl"
                : "font-serif text-2xl font-semibold text-surface lg:text-3xl"
            }
          >
            {line.text}
          </p>
        </SectionReveal>
      ))}
    </section>
  );
}
