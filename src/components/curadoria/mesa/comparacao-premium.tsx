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

import { Fragment, useState } from "react";

import { cn } from "@/components/ui/cn";
import { useMesaFoco } from "@/components/curadoria/mesa/mesa-foco";
import { IMPORTANCE_LABELS, type ImportanceLevel } from "@/modules/curadoria/mapa-prioridades";
import type { SubcriterionStatus } from "@/modules/curadoria/mapa-profissional";
import { COMPATIBILITY_CELL_LABELS } from "@/modules/curadoria/mesa-cruzamento-view";
import type { CompatibilityResult } from "@/modules/curadoria/motor-compatibilidade";

/**
 * ADR-042 — a matriz passa a ler o Motor.
 *
 * Era uma tabela de pontos: cada critério mostrava "25/25" e o rodapé somava
 * dois totais de 100. Agora cada linha é um subcritério do Mapa, agrupado
 * pelo nível que o Case declarou, e o rodapé conta itens por estado — nunca
 * um total que pudesse ser lido como nota.
 */
export type ComparacaoCelula = {
  subcriterionCode: string;
  label: string;
  importance: ImportanceLevel;
  /** `null` = ausência de registro. Nunca colapsado em NAO_INFORMADO. */
  status: SubcriterionStatus | null;
  result: CompatibilityResult;
  stateSentence: string;
};

export type ComparacaoColuna = {
  id: string;
  nome: string;
  celulas: ComparacaoCelula[];
  /** Contagens por estado — "8 altas · 7 médias · 3 lacunas · 8 sem influência". */
  resumo: string;
};

/**
 * O resultado do Motor vira textura de borda — nunca cor de veredito.
 *
 * [CORRIGIDO — Onda 4] `LACUNA_DE_INFORMACAO` e `NAO_RELEVANTE` apontavam
 * para `mesa-celula--sem-dado` e `--neutro`, que **não existem** no
 * `mesa-curador.css`: as duas células saíam sem tratamento algum, visualmente
 * indistinguíveis de uma célula qualquer. As classes corretas já estavam
 * definidas e mortas no CSS desde então — `--insuficiente` (tracejada, para
 * informação que faltou) e `--nao` (fio neutro, para o que não se aplica a
 * este caso). Nenhum significado novo foi criado: a correção só liga a
 * emissão à definição que já existia.
 */
const CLASSE_RESULTADO: Record<CompatibilityResult, string> = {
  ALTA_COMPATIBILIDADE: "mesa-celula--pleno",
  MEDIA_COMPATIBILIDADE: "mesa-celula--parcial",
  LACUNA_DE_INFORMACAO: "mesa-celula--insuficiente",
  NAO_RELEVANTE: "mesa-celula--nao",
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

      {/* No celular só cabe uma coluna por vez — e sem isto ela seria sempre a
          mesma. `J`/`K` resolvem no teclado; quem está no telefone não tem
          teclado, e ficaria sem enxergar os outros profissionais. */}
      {colunas.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-1.5 md:hidden">
          {colunas.map((coluna, indice) => (
            <button
              key={coluna.id}
              type="button"
              aria-pressed={indice === emFoco}
              onClick={() => foco.irPara(indice)}
              className={cn("mesa-chip", indice === emFoco && "mesa-chip--ativo")}
            >
              {coluna.nome}
            </button>
          ))}
        </div>
      ) : null}

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
            {criterios.map((referencia, posicao) => (
              <Fragment key={referencia.subcriterionCode}>
                {/* Agrupado pelo nível que o Case declarou. A fronteira que
                    importa deixou de ser o bloco de orçamento e passou a ser
                    "quanto isto importa para esta pessoa". */}
                {posicao === 0 ||
                referencia.importance !== criterios[posicao - 1]!.importance ? (
                  <tr>
                    <th
                      scope="colgroup"
                      colSpan={colunas.length + 1}
                      className="mesa-matriz__bloco"
                    >
                      {IMPORTANCE_LABELS[referencia.importance]}
                    </th>
                  </tr>
                ) : null}

                <tr>
                  <th scope="row" className="mesa-matriz__criterio">
                    {referencia.label}
                  </th>
                {colunas.map((coluna, indice) => {
                  const celula =
                    coluna.celulas.find(
                      (entrada) => entrada.subcriterionCode === referencia.subcriterionCode,
                    ) ?? null;
                  const chave = `${coluna.id}:${referencia.subcriterionCode}`;
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
                        className={cn(
                          "mesa-celula",
                          celula ? CLASSE_RESULTADO[celula.result] : "mesa-celula--vazio",
                        )}
                      >
                        {/* O estado nunca é dito só por cor. */}
                        <span className="mesa-celula__pontos">
                          {celula ? COMPATIBILITY_CELL_LABELS[celula.result] : "Sem registro"}
                        </span>
                        <span className="sr-only">
                          {coluna.nome}, {referencia.label}:{" "}
                          {celula ? COMPATIBILITY_CELL_LABELS[celula.result] : "Sem registro"}
                        </span>
                      </button>

                      {expandida ? (
                        <p className="mesa-celula__evidencia">
                          {/* A distinção que o Motor não faz: "ninguém olhou"
                              e "olharam e não havia" caem na mesma lacuna. */}
                          {celula?.stateSentence ?? "Ainda não investigado"}
                        </p>
                      ) : null}
                      </td>
                    );
                  })}
                </tr>
              </Fragment>
            ))}

            {/* Contagens por estado — NUNCA uma soma geral. Um número único
                seria lido como nota, e o Método não dá nota a ninguém. */}
            <tr>
              <th scope="row" className="mesa-matriz__criterio">
                Compatibilidade com este caso
              </th>
              {colunas.map((coluna, indice) => (
                <td
                  key={coluna.id}
                  className={cn(
                    "mesa-matriz__rodape",
                    indice !== emFoco && "hidden md:table-cell",
                  )}
                >
                  <span className="mesa-matriz__linha">{coluna.resumo}</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Os quatro estados da ADR-041 — e nenhum quinto. Não existe
          "baixa compatibilidade": não confirmar não é reprovar. */}
      <ul className="mesa-legenda">
        {(Object.keys(COMPATIBILITY_CELL_LABELS) as CompatibilityResult[]).map((estado) => (
          <li key={estado}>{COMPATIBILITY_CELL_LABELS[estado]}</li>
        ))}
      </ul>
    </section>
  );
}
