import { whatsappHref, type WhatsappTopic } from "@/components/curadoria/whatsapp-contact";

/**
 * O CARD DO CONCIERGE — o quarto ato com presença de ferramenta.
 *
 * Decisão do Fundador (24/08, sobre o print do acompanhamento): "o Concierge
 * não teria que ter mais destaque? Ele deve funcionar como uma ferramenta e
 * aqui ele está escondido." A porta era uma linha de texto no pé da página
 * (Track C, C3) — honesta, mas invisível como ferramenta. Vira um card de
 * vidro com botão de verdade, presente em qualquer estado da jornada.
 *
 * A régua que fica da doutrina antiga: durante a Mesa, este card vive
 * ABAIXO da decisão, nunca no meio da leitura — dar destaque ao canal não é
 * empurrar ninguém enquanto ela pesa. E as regras do `ConciergeLink`
 * continuam todas: rótulo único, quem responde é a Aliviar, nenhum horário
 * ou SLA, assunto tipado (nunca texto livre), clique não registrado.
 */
export function ConciergeCard({ topic }: { topic: WhatsappTopic }) {
  return (
    <section aria-labelledby="concierge-card-titulo" className="patient-card patient-veu p-6 lg:p-8">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
        Seu Concierge
      </p>
      <h2
        id="concierge-card-titulo"
        className="mt-3 font-serif text-xl font-medium leading-snug text-[var(--patient-ink)]"
      >
        Alguém da Aliviar para responder, do começo ao fim.
      </h2>
      <p className="patient-body mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Dúvida, documento, próximo passo — é só chamar.
      </p>
      <p className="mt-5">
        <a
          href={whatsappHref(topic)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-full bg-[var(--patient-acento)] px-5 text-sm font-medium text-[var(--patient-linen)] shadow-md transition-all duration-300 ease-standard hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Falar com a Aliviar{" "}
          <span className="sr-only">(abre o WhatsApp em nova aba)</span>
        </a>
      </p>
    </section>
  );
}
