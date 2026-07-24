import type { ReactNode } from "react";

/**
 * Moldura comum a todo gráfico do painel executivo.
 *
 * @metodo Correção do Administrador §7 — cada gráfico responde uma pergunta de negócio
 *
 * Ela impõe quatro coisas que um gráfico solto costuma esquecer:
 *
 * 1. **A pergunta.** Um gráfico que não responde nada não deveria existir.
 *    O campo é obrigatório, então não dá para adicionar um gráfico decorativo
 *    sem antes escrever para que ele serve.
 * 2. **A unidade.** "42" não significa nada; "42 Cases" significa.
 * 3. **O estado vazio.** Sem dado, não se desenha um gráfico vazio que parece
 *    quebrado — diz-se que não há dado.
 * 4. **A alternativa textual.** Toda visualização tem a mesma informação em
 *    tabela, aberta por `<details>`. Quem usa leitor de tela lê a tabela; quem
 *    precisa do número exato também.
 */
export function ChartFrame({
  title,
  question,
  unit,
  rows,
  isEmpty,
  emptyMessage = "Ainda não há dados neste período.",
  unavailable = false,
  children,
  legend,
}: {
  title: string;
  /** A pergunta de negócio. Obrigatória — ver o comentário acima. */
  question: string;
  unit: string;
  /** Os mesmos dados do gráfico, em texto. Nunca um resumo diferente. */
  rows: { label: string; value: string }[];
  isEmpty: boolean;
  emptyMessage?: string;
  /** Fonte não respondeu. Diferente de vazio: aqui não sabemos, lá sabemos que é zero. */
  unavailable?: boolean;
  children: ReactNode;
  legend?: ReactNode;
}) {
  return (
    // min-w-0: como item de grid, sem isso o conteúdo intrínseco do gráfico
    // vence o `1fr` e empurra a célula para além da viewport no mobile —
    // mesma classe de bug já corrigida na tabela de comparação do Portal.
    <section className="min-w-0 rounded-lg border border-border bg-surface p-4" aria-labelledby={`${slug(title)}-titulo`}>
      <h3 id={`${slug(title)}-titulo`} className="text-sm font-semibold text-ink">
        {title}
      </h3>
      <p className="mt-0.5 text-xs text-ink-muted">{question}</p>
      <p className="sr-only">Unidade: {unit}.</p>

      {unavailable ? (
        <p className="mt-4 rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-ink-muted">
          Informação indisponível — a fonte deste indicador não respondeu.
        </p>
      ) : isEmpty ? (
        <p className="mt-4 rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-ink-muted">
          {emptyMessage}
        </p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto">{children}</div>
          {legend ? <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">{legend}</div> : null}
        </>
      )}

      {!unavailable && !isEmpty ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-ink-muted underline-offset-4 hover:underline">
            Ver como tabela
          </summary>
          <table className="mt-2 w-full text-left text-xs">
            <caption className="sr-only">
              {title} — {question} Valores em {unit}.
            </caption>
            <thead>
              <tr className="text-ink-muted">
                <th scope="col" className="py-1 font-medium">
                  Item
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {unit}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <th scope="row" className="py-1 font-normal text-ink">
                    {row.label}
                  </th>
                  <td className="py-1 text-right tabular-nums text-ink">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
    </section>
  );
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
