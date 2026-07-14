import { SectionContainer } from "@/components/landing/section-container";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionReveal } from "@/components/landing/section-reveal";

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
    <SectionContainer id="duvidas" className="scroll-mt-20 bg-canvas">
      <SectionReveal className="max-w-reading text-center lg:text-left">
        <SectionEyebrow align="left">Suas dúvidas</SectionEyebrow>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-ink lg:text-3xl">
          Perguntas que costumam vir antes do primeiro passo
        </h2>
      </SectionReveal>

      {/* Composição editorial em duas colunas no desktop (uma no mobile) —
          continua usando <details>/<summary> por baixo, então a
          acessibilidade (navegação por teclado, leitor de tela) não muda,
          só a densidade/hierarquia visual. Indicador +/- é CSS puro (dois
          spans sobrepostos), sem ícone de biblioteca. */}
      <div className="mx-auto mt-12 grid max-w-content gap-x-12 gap-y-1 lg:grid-cols-2">
        {FAQS.map((faq) => (
          <details key={faq.question} className="group border-b border-border py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-md text-left font-serif text-lg font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">
              {faq.question}
              <span
                aria-hidden="true"
                className="relative mt-1.5 size-3.5 shrink-0 text-brand-gold"
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-px w-3.5 bg-current" />
                </span>
                <span className="absolute inset-0 flex items-center justify-center transition-transform duration-fast ease-standard group-open:rotate-90">
                  <span className="h-3.5 w-px bg-current" />
                </span>
              </span>
            </summary>
            <p className="mt-3 max-w-reading text-sm text-ink-muted">{faq.answer}</p>
          </details>
        ))}
      </div>
    </SectionContainer>
  );
}
