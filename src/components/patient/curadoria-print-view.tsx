import type { PatientCuradoria } from "@/modules/curadoria/patient-curadoria";

/**
 * A Curadoria do Método, em papel.
 *
 * @metodo Ontologia §3.12 — o Relatório nunca contém score interno nem linguagem de ranking
 * @metodo Ontologia §3.13 — a ordem é de apresentação, jamais colocação
 *
 * Por que existe: o PDF só sabia imprimir a entrega legada
 * (`FinalCuradoriaView`). Quem tinha apenas a Curadoria do Método — o caminho
 * canônico — não tinha como levar o documento para casa nem para a consulta
 * (Item 1.7, A5). Esta view imprime exatamente o que ela já lê na tela, sem
 * nenhum campo novo e sem reescrever frase nenhuma.
 *
 * O que nunca faz: reordenar as opções, resumir, comparar, concluir por ela ou
 * acrescentar qualquer texto que o Relatório não tenha. Cada parágrafo aqui é
 * literal do que o Curador escreveu e aprovou.
 */
export function CuradoriaPrintView({ curadoria }: { curadoria: PatientCuradoria }) {
  return (
    <article className="max-w-[44rem] space-y-8 text-[var(--patient-ink)]">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl">Sua Curadoria</h1>
        {curadoria.curatorName ? (
          <p className="text-sm text-ink-muted">Conduzida por {curadoria.curatorName}.</p>
        ) : null}
      </header>

      {curadoria.compositionRationale ? (
        <section className="space-y-2">
          <h2 className="font-serif text-lg">Por que estes três, juntos</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed">
            {curadoria.compositionRationale}
          </p>
        </section>
      ) : null}

      {curadoria.options.map((option) => (
        <section key={option.id} className="space-y-3 border-t border-[var(--color-border)] pt-6">
          <h2 className="font-serif text-lg">{option.professionalName}</h2>

          {option.justification ? (
            <p className="whitespace-pre-line text-sm leading-relaxed">{option.justification}</p>
          ) : null}

          {option.relationToWeights ? (
            <div className="space-y-1">
              <h3 className="text-sm font-medium">O que isso tem a ver com o que você disse</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {option.relationToWeights}
              </p>
            </div>
          ) : null}

          {option.relationalReading ? (
            <div className="space-y-1">
              <h3 className="text-sm font-medium">
                Como este caminho conversa com a forma como você quer ser cuidada
              </h3>
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {option.relationalReading}
              </p>
            </div>
          ) : null}

          {option.favorablePoints.length > 0 ? (
            <div className="space-y-1">
              <h3 className="text-sm font-medium">O que encontramos</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {option.favorablePoints.map((ponto) => (
                  <li key={ponto}>{ponto}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Nunca omitido: uma opção só com virtudes é recomendação disfarçada. */}
          {option.attentionPoints.length > 0 ? (
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Pontos de atenção</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {option.attentionPoints.map((ponto) => (
                  <li key={ponto}>{ponto}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {option.suggestedQuestions.length > 0 ? (
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Perguntas para levar à consulta</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
                {option.suggestedQuestions.map((pergunta) => (
                  <li key={pergunta}>{pergunta}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ))}
    </article>
  );
}
