import { LandingSection } from "@/components/landing/editorial/landing-section";

/**
 * Ato VII — AS ÚLTIMAS DÚVIDAS, abertas.
 *
 * O acordeão saiu: era um dos cinco elementos banidos pelo Sistema Visual
 * §12 ("esconder o que importa é confessar que não importa") — e escondia
 * justamente "Quanto custa?", a dúvida mais sensível de quem está com medo.
 * Quatro perguntas com respostas curtas não precisam de mecanismo: abrir
 * tudo é o gesto de quem não tem nada a esconder.
 *
 * Deixou de ser client component no mesmo movimento — sem estado, sem JS.
 */
const FAQ_ITEMS = [
  {
    question: "Não sei por onde começar",
    // "nossa equipe" → o Curador: responsabilidade com rosto (D-C1).
    answer: "Uma conversa com seu Curador organiza seus próximos passos.",
  },
  {
    question: "A Aliviar substitui um médico?",
    answer: "Não. O cuidado clínico é do médico; nós organizamos o caminho até ele.",
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Uso estritamente restrito ao seu atendimento e com consentimento.",
  },
  {
    question: "Quanto custa? / Como funciona?",
    answer: "Transparência total apresentada no primeiro contato, sem custos ocultos.",
  },
] as const;

export function FaqCompactSection() {
  return (
    <LandingSection id="duvidas" variant="warm" spacing="media">
      <div className="mx-auto max-w-4xl">
        <div className="landing-reveal text-center">
          <h2 className="landing-heading text-3xl lg:text-[2.625rem]">Dúvidas frequentes</h2>
          <p className="landing-body mx-auto mt-6 max-w-lg text-[var(--color-ink-muted)]">
            Respostas diretas, no seu ritmo.
          </p>
        </div>

        <dl className="landing-reveal mt-16 grid gap-x-16 gap-y-10 md:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="border-t border-[var(--color-border)] pt-6">
              <dt className="landing-heading text-lg font-medium">{item.question}</dt>
              <dd className="landing-body mt-3 text-[var(--color-ink-muted)]">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </LandingSection>
  );
}
