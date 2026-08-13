import type { Metadata } from "next";

import { SolicitarAtendimentoForm } from "@/components/publico/solicitar-atendimento-form";

export const metadata: Metadata = {
  title: "Fale com a Aliviar",
  description: "Peça atendimento à Aliviar. Uma pessoa entra em contato com você.",
};

/**
 * A PORTA DE ENTRADA — `/solicitar-atendimento`.
 *
 * Rota pública. Não cria conta, não cria Case, não pergunta nada de saúde:
 * recolhe o mínimo para uma pessoa da Aliviar procurar quem pediu, e para por
 * aí. Quem converte contato em paciente é o Atendimento, por ato interno.
 */
export default function SolicitarAtendimentoPage() {
  return (
    <main className="mx-auto max-w-content px-6 py-16 lg:px-8">
      <header className="max-w-reading space-y-3">
        <h1 className="font-serif text-3xl text-ink">Fale com a Aliviar</h1>
        <p className="text-base leading-relaxed text-ink-muted">
          Conte só o essencial para a gente procurar você. Nada sobre saúde nesta página — isso a
          gente conversa depois, com uma pessoa.
        </p>
      </header>

      <div className="mt-10">
        <SolicitarAtendimentoForm />
      </div>
    </main>
  );
}
