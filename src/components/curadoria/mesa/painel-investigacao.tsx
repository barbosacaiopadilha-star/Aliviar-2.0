/**
 * PAINEL DE INVESTIGAÇÃO — quatro perguntas, quatro respostas.
 *
 * @metodo ADR-041 — a compatibilidade vem do Motor; a interface não recalcula
 * @metodo Fundamentos §13 — P14: organiza evidência, não decide
 *
 * As quatro perguntas que o Curador faz o tempo todo, respondidas com o que
 * o Motor devolveu — sem nenhuma regra recalculada aqui:
 *
 *   1. O que mais importa neste caso?      → muito importante e importante
 *   2. O que já encontramos?               → alta e média compatibilidade
 *   3. O que ainda falta descobrir?        → lacunas de informação
 *   4. O que não influencia esta decisão?  → não relevante
 *
 * O que nunca faz: somar, pontuar, ordenar por resultado ou sugerir escolha.
 */

import {
  classeDoPapel,
  papelDaLacuna,
} from "@/components/curadoria/mesa/gramatica-de-estados";
import type { Subcriterion } from "@/modules/curadoria/mapa-prioridades";
import type { CompatibilityReading } from "@/modules/curadoria/motor-compatibilidade";

export function PainelInvestigacao({
  leitura,
  catalogo,
  professionalName,
}: {
  leitura: CompatibilityReading;
  catalogo: readonly Subcriterion[];
  professionalName: string;
}) {
  const nome = (code: string) => catalogo.find((entry) => entry.code === code)?.name ?? code;

  const oQueImporta = leitura.rows
    .filter((row) => row.importance === "MUITO_IMPORTANTE" || row.importance === "IMPORTANTE")
    .map((row) => nome(row.subcriterionCode));

  const oQueEncontramos = leitura.rows
    .filter(
      (row) =>
        row.result === "ALTA_COMPATIBILIDADE" || row.result === "MEDIA_COMPATIBILIDADE",
    )
    .map((row) => nome(row.subcriterionCode));

  const oQueFalta = leitura.rows
    .filter((row) => row.result === "LACUNA_DE_INFORMACAO")
    .map((row) => ({
      nome: nome(row.subcriterionCode),
      // ADR-040: ninguém tratou ainda é diferente de analisado sem informação.
      semRegistro: row.status === null,
      // R-1 · o papel vem da MESMA fonte que a comparação e a leitura
      // relacional consultam. A distinção já estava dita aqui em texto; o
      // que faltava era a cor concordar com ela — e concordar em toda a Mesa.
      papel: papelDaLacuna(row.status),
    }));

  const naoInfluencia = leitura.rows
    .filter((row) => row.result === "NAO_RELEVANTE")
    .map((row) => nome(row.subcriterionCode));

  if (leitura.rows.length === 0) {
    return (
      <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
        O Mapa de Prioridades deste Case ainda não foi preenchido — sem ele não há o que investigar
        em {professionalName}. A investigação começa pela etapa Mapa de Prioridades.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Pergunta titulo="O que mais importa neste caso?" itens={oQueImporta} vazio="Nada foi declarado como importante ou muito importante ainda." />

      <Pergunta
        titulo="O que já encontramos?"
        itens={oQueEncontramos}
        vazio="Nada encontrado ainda — o Mapa deste profissional está por preencher."
      />

      <div>
        <h4 className="mesa-rotulo">O que ainda falta descobrir?</h4>
        {oQueFalta.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Nenhuma lacuna aberta.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {oQueFalta.map((item) => (
              <li key={item.nome} className="text-ink">
                <span aria-hidden="true" className={`mr-1 ${classeDoPapel(item.papel)}`}>
                  {item.semRegistro ? "●" : "·"}
                </span>
                {item.nome}
                <span className="ml-2 text-xs text-ink-muted">
                  {item.semRegistro
                    ? "Este subcritério ainda precisa de investigação."
                    : "Há informações pendentes para este item."}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Pergunta
        titulo="O que não influencia esta decisão?"
        itens={naoInfluencia}
        vazio="Nada foi declarado como sem influência neste caso."
      />
    </div>
  );
}

function Pergunta({ titulo, itens, vazio }: { titulo: string; itens: string[]; vazio: string }) {
  return (
    <div>
      <h4 className="mesa-rotulo">{titulo}</h4>
      {itens.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">{vazio}</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-ink">
          {itens.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
