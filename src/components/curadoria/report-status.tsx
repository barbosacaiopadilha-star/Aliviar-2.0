import Link from "next/link";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { OpcaoRelatorio } from "@/modules/curadoria/cos/types";

/**
 * O estado do documento que o paciente vai reler sozinho.
 *
 * @metodo Ontologia §3.12 — o Relatório nunca contém score interno nem linguagem de ranking
 * @metodo Experience §2.5 — toda opção diz o que custa; assimetria de entusiasmo é indução
 * @metodo Engine §4.6 — as justificativas de opção e composição são escritas pelo Curador, nunca pelo Motor
 *
 * Por que existe: esta etapa era uma tela cujo único conteúdo era um botão para
 * a Mesa — o mesmo defeito que a Validação tinha e que esta missão eliminou. A
 * pergunta real do Curador aqui não é "onde escrevo?", e sim **"o documento
 * está pronto?"**: quais das três opções já têm parecer, e o que ainda falta em
 * cada uma. Isso é conteúdo próprio, e é o que esta tela agora mostra.
 *
 * O editor continua na Mesa, ao lado da comparação que fundamenta cada parecer:
 * separar o texto do material que o sustenta obrigaria o Curador a escrever de
 * memória. Esta tela leva até lá — mas depois de dizer o que falta, nunca antes.
 *
 * O que nunca faz: ordenar as opções por qualidade, sugerir texto de parecer, ou
 * chamar de "pronta" uma opção que só tem virtudes escritas — uma opção sem
 * ponto de atenção é recomendação disfarçada, e aparece aqui como pendente.
 */

type Props = {
  caseId: string;
  patientFirstName: string;
  options: OpcaoRelatorio[];
  professionalNames: Map<string, string>;
  compositionRationale: string | null;
};

/** O que ainda falta nesta opção, nas palavras do Método. */
function pendenciasDaOpcao(option: OpcaoRelatorio): string[] {
  const faltando: string[] = [];
  if (!option.justification.trim()) faltando.push("a justificativa");
  if (!option.relationToWeights.trim()) faltando.push("a relação com os pesos");
  if (option.attentionPoints.length === 0) faltando.push("os pontos de atenção");
  return faltando;
}

export function ReportStatus({
  caseId,
  patientFirstName,
  options,
  professionalNames,
  compositionRationale,
}: Props) {
  // A ordem é a de apresentação, nunca de colocação (Ontologia §3.13).
  const ordenadas = [...options].sort((a, b) => a.position - b.position);

  return (
    <Card className="border-brand-gold/40">
      <CardHeader>
        <CardTitle>O documento que {patientFirstName} vai reler sozinha</CardTitle>
        <CardDescription>
          Cada opção precisa dizer o que oferece <em>e</em> o que custa. Uma opção só com virtudes é
          recomendação disfarçada — por isso os pontos de atenção contam como parte do parecer.
        </CardDescription>
      </CardHeader>

      {ordenadas.length === 0 ? (
        <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
          As três opções ainda não foram selecionadas. O Relatório começa a existir quando a
          Curadoria Técnica fecha.
        </p>
      ) : (
        <ul className="space-y-2">
          {ordenadas.map((option) => {
            const faltando = pendenciasDaOpcao(option);
            const pronta = faltando.length === 0;

            return (
              <li
                key={option.professionalId}
                className="rounded-md border border-border bg-surface p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    {professionalNames.get(option.professionalId) ?? "Opção"}
                  </p>
                  <span className="text-xs text-ink-muted">
                    {pronta ? "Parecer escrito" : "Parecer em aberto"}
                  </span>
                </div>
                {pronta ? null : (
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    Falta {faltando.join(", ")}.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm leading-relaxed text-ink-muted">
          {compositionRationale?.trim()
            ? "A justificativa da composição das três como conjunto está escrita."
            : "Falta justificar por que estas três, juntas, formam uma escolha honesta."}
        </p>

        <Link
          href={`/coa/curadoria/casos/${caseId}/curadoria_tecnica`}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Escrever na Mesa de Curadoria
          <span aria-hidden="true">→</span>
        </Link>
        <p className="mt-2 max-w-reading text-xs leading-relaxed text-ink-muted">
          O parecer se escreve ao lado da comparação que o sustenta — separar os dois obrigaria você
          a escrever de memória.
        </p>
      </div>
    </Card>
  );
}
