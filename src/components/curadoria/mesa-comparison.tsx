/**
 * Comparison Workspace — Área 4 da Mesa de Curadoria.
 *
 * @metodo Engine §5.3 — o Motor organiza a leitura e nunca corta a lista, marca favorito ou desempata
 * @metodo Ontologia §8 — ranking, colocação e vencedor estão fora do vocabulário deste domínio
 * @metodo Experience §6 — comparações: mesma estrutura para todos, lacuna neutra, nunca vermelha
 * @metodo Fundamentos §11 — compatibilidade é sempre relativa ao Perfil; nunca um juízo absoluto
 *
 * Por que existe: comparar é ler o mesmo critério em todos ao mesmo tempo —
 * uma mesa de análise, não uma tabela de campeonato. As colunas têm o mesmo
 * peso visual; a ordem é a ordem em que o Curador adicionou, nunca uma
 * classificação.
 *
 * O que nunca faz: ordenar por score, destacar "o melhor de cada linha",
 * colorir célula por desempenho, ou transformar ausência de dado em célula de
 * erro.
 */

import { COMPATIBILITY_BAND_LABELS, PRIORITY_CRITERION_LABELS } from "@/modules/curadoria/types";
import type { AnaliseRecord } from "@/modules/curadoria/cos/types";
import type { PriorityCriterion } from "@/modules/curadoria/types";

export function MesaComparison({ analyses }: { analyses: AnaliseRecord[] }) {
  if (analyses.length < 2) {
    return (
      <p className="text-sm leading-relaxed text-ink-muted">
        Adicione ao menos dois profissionais para comparar lado a lado. A comparação lê o mesmo
        critério em todos ao mesmo tempo — na ordem em que você adicionar, nunca em ordem de
        classificação.
      </p>
    );
  }

  // As linhas são os critérios do paciente, na ordem de peso do Perfil —
  // a ordem é dele, não do desempenho de ninguém.
  const criteria: { criterion: PriorityCriterion; weight: number }[] = analyses[0]!.criteria.map(
    (entry) => ({ criterion: entry.criterion, weight: entry.weight }),
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <caption className="sr-only">
          Comparação lado a lado — colunas na ordem de adição, nunca classificação
        </caption>
        <thead>
          <tr>
            <th scope="col" className="w-44 py-2 pr-4 text-left align-bottom text-xs font-medium uppercase tracking-wide text-ink-muted">
              Critério do paciente
            </th>
            {analyses.map((analysis) => (
              <th key={analysis.professionalId} scope="col" className="px-3 py-2 text-left align-bottom">
                <p className="font-sans text-sm font-semibold text-ink">{analysis.professionalName}</p>
                <p className="mt-0.5 text-xs font-normal text-ink-muted">
                  {COMPATIBILITY_BAND_LABELS[analysis.band]} · interno{" "}
                  {analysis.criteria.filter((c) => c.alignment === null).length} item(ns) sem informação
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map(({ criterion, weight }) => (
            <tr key={criterion} className="border-t border-border align-top">
              <th scope="row" className="py-3 pr-4 text-left font-normal">
                <p className="text-sm font-medium text-ink">{PRIORITY_CRITERION_LABELS[criterion]}</p>
                <p className="text-xs text-ink-muted">peso {weight}</p>
              </th>
              {analyses.map((analysis) => {
                const cell = analysis.criteria.find((entry) => entry.criterion === criterion);
                return (
                  <td key={analysis.professionalId} className="px-3 py-3">
                    {cell ? (
                      <>
                        <p className={cell.alignment === null ? "italic text-ink-muted" : "text-ink"}>
                          {cell.alignment === null ? "Sem dado no cadastro" : cell.explanation}
                        </p>
                        {cell.alignment !== null ? (
                          <p className="mt-0.5 tabular-nums text-xs text-ink-muted">
                            alinhamento {cell.alignment} · contribui {cell.contribution}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="italic text-ink-muted">—</p>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-t border-border align-top">
            <th scope="row" className="py-3 pr-4 text-left font-normal">
              <p className="text-sm font-medium text-ink">Suas observações</p>
            </th>
            {analyses.map((analysis) => (
              <td key={analysis.professionalId} className="px-3 py-3">
                <p className={analysis.curatorNote ? "text-ink" : "italic text-ink-muted"}>
                  {analysis.curatorNote ?? "Nenhuma ainda."}
                </p>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
