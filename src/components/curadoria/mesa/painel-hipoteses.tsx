/**
 * PAINEL DE HIPÓTESES — o raciocínio do Curador, devolvido a ele.
 *
 * @metodo Fundamentos §13 — P14: a Mesa organiza e explica; a decisão é do Curador
 * @metodo ADR-035 — o Curador é a única autoridade decisória
 *
 * Por que existe: entre a quarta e a quinta avaliação, o Curador perde o fio
 * do que já concluiu sobre cada profissional e reabre fichas para relembrar.
 * Este painel devolve, em uma frase, o que ele mesmo já declarou — e o que
 * falta para fechar a leitura.
 *
 * O que nunca faz: recomendar, comparar profissionais entre si, usar
 * superlativo ou dizer que alguém responde melhor. A hipótese é sobre o
 * estado da investigação, não sobre quem deve ser escolhido — e nada disso é
 * salvo: some quando a Mesa fecha, porque não é dado clínico.
 */

import { cn } from "@/components/ui/cn";
import {
  HIPOTESE_STATUS_LABELS,
  type Hipotese,
} from "@/modules/curadoria/mesa-investigacao";

export function PainelHipoteses({ hipotese }: { hipotese: Hipotese | null }) {
  if (!hipotese) {
    return (
      <p className="text-sm text-ink-muted">
        Escolha um profissional na comparação para ver o que suas declarações já indicam sobre ele.
      </p>
    );
  }

  return (
    <div className="mesa-hipotese">
      <p className="font-medium text-ink">{hipotese.nome}</p>
      <p className="mt-1 max-w-reading leading-relaxed text-ink-muted">{hipotese.frase}</p>

      <p
        className={cn(
          "mesa-hipotese__status",
          hipotese.status === "CONFERIDA" && "mesa-hipotese__status--conferida",
        )}
      >
        {HIPOTESE_STATUS_LABELS[hipotese.status]}
      </p>

      {hipotese.lacunas.length > 0 ? (
        <ul className="mt-2 space-y-0.5 text-xs text-ink-muted">
          {hipotese.lacunas.map((lacuna) => (
            <li key={lacuna}>{lacuna}</li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 text-xs text-ink-muted">
        Leitura do que você declarou. Não é recomendação e não fica registrada.
      </p>
    </div>
  );
}
