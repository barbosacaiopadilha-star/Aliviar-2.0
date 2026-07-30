"use client";

import { useState } from "react";

import { LandingSection } from "@/components/landing/editorial/landing-section";

const FAQ_ITEMS = [
  {
    question: "Não sei por onde começar",
    answer: "Uma conversa com nossa equipe organiza seus próximos passos.",
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
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <LandingSection id="duvidas" variant="warm">
      <div className="mx-auto max-w-2xl">
        <div className="landing-reveal">
          <h2 className="landing-heading text-center text-3xl lg:text-[2.625rem]">Dúvidas frequentes</h2>
          <p className="landing-body mx-auto mt-6 max-w-lg text-center text-[var(--color-ink-muted)]">
            Respostas diretas, no seu ritmo.
          </p>
        </div>

        <div className="landing-reveal landing-faq-book mt-16">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={item.question} className="landing-faq-item">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="landing-faq-trigger flex w-full items-center justify-between gap-5 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:ring-offset-2"
                >
                  <span className="landing-heading text-lg font-medium">{item.question}</span>
                  <span aria-hidden="true" className="landing-faq-icon">
                    +
                  </span>
                </button>
                {isOpen ? (
                  <p className="landing-faq-answer landing-body pb-7 pr-10 text-[var(--color-ink-muted)]">
                    {item.answer}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </LandingSection>
  );
}
