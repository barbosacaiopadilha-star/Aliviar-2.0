/**
 * Memória da Curadoria — linha do tempo e teste de reconstrução.
 *
 * @metodo Engine §5.6 — trilha append-only, sempre com autor e instante
 * @metodo Engine §5.6 — teste de reconstrução: nove perguntas que o registro precisa responder
 * @metodo Fundamentos §13 — P10: registro é obrigação, não subproduto
 * @metodo Engine §1 — o ciclo fecha em registrar, e o que se registra alimenta o próximo reconhecer
 *
 * Por que existe: uma Curadoria que não pode ser reconstruída depois não é uma
 * Curadoria pelo Método Aliviar. Esta tela torna a auditabilidade visível no
 * uso diário, em vez de deixá-la como promessa de arquitetura.
 *
 * O que nunca faz: esconder uma lacuna. Uma pergunta do teste de reconstrução
 * sem resposta aparece como não respondida — nunca é omitida da lista para a
 * trilha parecer completa.
 */

import { phaseLabel } from "@/modules/curadoria/cos/memory";
import type { MemoryEntry, ReconstructionAnswer } from "@/modules/curadoria/cos/memory";

function formatMoment(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MemoryTimeline({ entries }: { entries: MemoryEntry[] }) {
  return (
    <ol className="space-y-4">
      {entries.map((entry, index) => (
        <li key={`${entry.at}-${index}`} className="border-l-2 border-border pl-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            {phaseLabel(entry.phase)}
            <span aria-hidden="true"> · </span>
            {formatMoment(entry.at)}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{entry.description}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{entry.actor}</p>
        </li>
      ))}
    </ol>
  );
}

export function ReconstructionReport({ answers }: { answers: ReconstructionAnswer[] }) {
  const answered = answers.filter((entry) => entry.answered).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        {answered} de {answers.length} perguntas respondidas apenas com o registro.
        {answered < answers.length
          ? " O que falta aparece abaixo — uma lacuna nunca é omitida para a trilha parecer completa."
          : ""}
      </p>
      <ul className="space-y-3">
        {answers.map((entry) => (
          <li key={entry.question} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
            <p className="text-sm font-medium text-ink">{entry.question}</p>
            <p className={entry.answered ? "mt-0.5 text-sm text-ink-muted" : "mt-0.5 text-sm text-warning"}>
              {entry.answer}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
