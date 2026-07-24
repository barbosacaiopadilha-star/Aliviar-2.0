"use client";

import { useState } from "react";

import { LandingSection } from "@/components/landing/editorial/landing-section";
import { cn } from "@/components/ui/cn";

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
    <LandingSection id="duvidas" variant="white">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center font-serif text-3xl font-semibold leading-snug tracking-tight lg:text-4xl">
          Dúvidas frequentes
        </h2>

        <div className="mt-12 divide-y divide-[var(--color-border)]">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={item.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-forest)] focus-visible:ring-offset-2"
                >
                  <span className="font-medium">{item.question}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "shrink-0 text-xl text-[var(--color-ink-muted)] transition-transform duration-200",
                      isOpen && "rotate-45",
                    )}
                  >
                    +
                  </span>
                </button>
                {isOpen ? (
                  <p className="landing-body pb-5 text-[var(--color-ink-muted)]">{item.answer}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </LandingSection>
  );
}
