"use client";

/**
 * COMPARAÇÃO — colunas limpas, uma célula por vez.
 *
 * @metodo Ontologia §3.13 — ordenação de leitura, jamais colocação
 * @metodo Fundamentos §13 — P14: a Mesa organiza e explica; a escolha é do Curador
 * @metodo Engine §5.5 — informação insuficiente aparece como lacuna, nunca como reprovação
 *
 * Por que existe: a comparação era uma tabela com a evidência inteira dentro
 * das células — seis critérios × N profissionais de texto corrido, ilegível na
 * largura em que o Curador realmente trabalha. Agora cada profissional ocupa
 * uma coluna, cada critério uma linha, e a célula é um estado. Clicar abre
 * **aquela célula**, não a ficha inteira.
 *
 * O que nunca faz: ordenar por resultado, marcar posição, somar os dois
 * cruzamentos ou distinguir estado apenas por cor — cada estado tem marca,
 * texto e forma próprios.
 */

import { useState } from "react";

import { cn } from "@/components/ui/cn";
import { useMesaFoco } from "@/components/curadoria/mesa/mesa-foco";
import {
  CELULA_LABEL,
  CELULA_MARCA,
  celulaEstado,
  type CelulaEstado,
} from "@/modules/curadoria/mesa-investigacao";
import type { Assessment, CruzamentoCriterion } from "@/modules/curadoria/cruzamento";

export type ComparacaoCelula = {
  criterion: CruzamentoCriterion;
  label: string;
  assessment: Assessment | null;
  /** "25/25", "5/10", ou "não avaliável". */
  pointsSentence: string;
  evidence: string;
};

export type ComparacaoColuna = {
  id: string;
  nome: string;
  celulas: ComparacaoCelula[];
  technicalScore: number;
  patientScore: number;
  technicalCoverageSentence: string;
  patientCoverageSentence: string;
};

const CLASSE: Record<CelulaEstado, string> = {
  PLENO: "mesa-celula--pleno",
  PARCIAL: "mesa-celula--parcial",
  NAO_ATENDE: "mesa-celula--nao",
  INSUFICIENTE: "mesa-celula--insuficiente",
  SEM_DECLARACAO: "mesa-celula--vazio",
};

export function ComparacaoPremium({ colunas }: { colunas: ComparacaoColuna[] }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const foco = useMesaFoco();

  if (colunas.length === 0) return null;

  // O foco do teclado escolhe a coluna visível no celular; no desktop ele
  // apenas realça. Sem foco definido, a primeira.
  const emFoco = foco.indice >= 0 && foco.indice < colunas.length ? foco.indice : 0;
  const criterios = colunas[0]!.celulas;

  return (
    <section aria-label="Comparação dos profissionais" className="mesa-comparacao">
      <p className="text-xs text-ink-muted">
        As colunas seguem a ordem da Rede — não há colocação. Toque numa célula para ver a
        evidência daquele critério.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="mesa-matriz">
          <caption className="sr-only">
            Critérios nas linhas, profissionais nas colunas. Cada célula abre a evidência
            registrada para aquele critério.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="mesa-matriz__canto">
                Critério
              </th>
              {colunas.map((coluna, indice) => (
                <th
                  scope="col"
                  key={coluna.id}
                  aria-current={indice === emFoco ? "true" : undefined}
                  className={cn(
                    "mesa-matriz__coluna",
                    indice === emFoco && "mesa-matriz__coluna--foco",
                    indice !== emFoco && "hidden md:table-cell",
                  )}
                >
                  {coluna.nome}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {criterios.map((referencia) => (
              <tr key={referencia.criterion}>
                <th scope="row" className="mesa-matriz__criterio">
                  {referencia.label}
                </th>
                {colunas.map((coluna, indice) => {
                  const celula =
                    coluna.celulas.find((entrada) => entrada.criterion === referencia.criterion) ??
                    null;
                  const estado = celulaEstado(celula?.assessment ?? null);
                  const chave = `${coluna.id}:${referencia.criterion}`;
                  const expandida = aberta === chave;

                  return (
                    <td
                      key={chave}
                      className={cn(
                        "mesa-matriz__celula",
                        indice !== emFoco && "hidden md:table-cell",
                      )}
                    >
                      <button
                        type="button"
                        aria-expanded={expandida}
                        onClick={() => setAberta(expandida ? null : chave)}
                        className={cn("mesa-celula", CLASSE[estado])}
                      >
                        <span aria-hidden="true" className="mesa-celula__marca">
                          {CELULA_MARCA[estado]}
                        </span>
                        <span className="mesa-celula__pontos">
                          {celula?.pointsSentence ?? "não avaliável"}
                        </span>
                        <span className="sr-only">
                          {coluna.nome}, {referencia.label}: {CELULA_LABEL[estado]}
                        </span>
                      </button>

                      {expandida ? (
                        <p className="mesa-celula__evidencia">
                          {celula?.evidence?.trim()
                            ? celula.evidence
                            : "Nenhuma evidência foi registrada para este critério."}
                        </p>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr>
              <th scope="row" className="mesa-matriz__criterio">
                Cobertura
              </th>
              {colunas.map((coluna, indice) => (
                <td
                  key={coluna.id}
                  className={cn(
                    "mesa-matriz__rodape",
                    indice !== emFoco && "hidden md:table-cell",
                  )}
                >
                  {coluna.technicalCoverageSentence} {coluna.patientCoverageSentence}
                </td>
              ))}
            </tr>

            <tr>
              <th scope="row" className="mesa-matriz__criterio">
                Cruzamentos
              </th>
              {colunas.map((coluna, indice) => (
                <td
                  key={coluna.id}
                  className={cn(
                    "mesa-matriz__rodape",
                    indice !== emFoco && "hidden md:table-cell",
                  )}
                >
                  Avaliação Técnica {coluna.technicalScore} de 100 · Compatibilidade Assistencial{" "}
                  {coluna.patientScore} de 100
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <ul className="mesa-legenda">
        {(Object.keys(CELULA_MARCA) as CelulaEstado[]).map((estado) => (
          <li key={estado}>
            <span aria-hidden="true">{CELULA_MARCA[estado]}</span> {CELULA_LABEL[estado]}
          </li>
        ))}
      </ul>
    </section>
  );
}
