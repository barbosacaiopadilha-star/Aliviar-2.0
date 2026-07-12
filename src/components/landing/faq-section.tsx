import { ChevronDown } from "lucide-react";

import { SectionContainer } from "@/components/landing/section-container";

const FAQS = [
  {
    question: "Como funciona a curadoria da Aliviar?",
    answer:
      "Uma pessoa da nossa equipe entende sua história e organiza um caminho claro para você — nunca uma indicação paga ou automática.",
  },
  {
    question: "Vou ser jogado para o WhatsApp e ficar sem suporte?",
    answer:
      "Não. O WhatsApp é uma extensão da mesma experiência — a equipe Aliviar acompanha a conversa com você, em tempo real, do mesmo jeito que aqui no site.",
  },
  {
    question: "Preciso escolher entre a Busca Direta e o Concierge de Saúde?",
    answer:
      "Não são caminhos diferentes — é a mesma curadoria Aliviar. Escolha só a forma que for mais confortável para você começar.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Sim. Suas informações são usadas apenas para organizar o seu atendimento e nunca são compartilhadas sem o seu consentimento.",
  },
  {
    question: "Quanto tempo leva até eu ser atendido?",
    answer:
      "Varia conforme a sua situação, mas você nunca fica sem saber qual é o próximo passo.",
  },
  {
    question: "A Aliviar substitui atendimento médico ou psicológico?",
    answer: "Não. A Aliviar conecta você a quem pode atender — o cuidado em si é sempre humano.",
  },
] as const;

export function FaqSection() {
  return (
    <SectionContainer>
      <div className="mx-auto max-w-reading text-center">
        <h2 className="font-serif text-2xl font-semibold text-ink lg:text-3xl">
          Estas são as dúvidas mais comuns
        </h2>
      </div>

      <div className="mx-auto mt-10 max-w-reading divide-y divide-border border-y border-border">
        {FAQS.map((faq) => (
          <details key={faq.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-left font-sans text-base font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">
              {faq.question}
              <ChevronDown
                className="size-4 shrink-0 text-ink-muted transition-transform duration-fast ease-standard group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-3 text-sm text-ink-muted">{faq.answer}</p>
          </details>
        ))}
      </div>
    </SectionContainer>
  );
}
