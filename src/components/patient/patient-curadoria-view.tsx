import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { PatientCuradoria } from "@/modules/curadoria/patient-curadoria";

/**
 * Os três caminhos, como o paciente os recebe.
 *
 * @metodo Ontologia §3.13 — a ordem é de apresentação, nunca colocação
 * @metodo Experience §2.5 — toda opção diz o que custa
 * @metodo Fundamentos §13 — P14: nem o algoritmo nem a Aliviar escolhem
 *
 * SUPERFÍCIE DE LEITURA, NUNCA DE DECISÃO.
 *
 * Este componente apresenta a Curadoria entregue: o que o Curador escreveu,
 * as três opções e o que cada uma custa. Ele NÃO oferece seleção e NÃO grava
 * decisão nenhuma.
 *
 * Por quê: a escolha entre os três é um ato só, e tem um registro só — a
 * Connection, feita no `ConnectionChoicePanel`. Enquanto este componente
 * também tinha rádios, a mesma página oferecia duas formas de escolher e
 * gravava dois fatos concorrentes (`patient_curadoria_decisions` aqui, uma
 * Connection lá). O paciente via os três profissionais duas vezes, e o
 * domínio ficava sem saber qual registro valia.
 *
 * Compreensão mora aqui. Decisão mora na Connection.
 *
 * Por que existe: o Relatório escrito pelo Curador não tinha nenhuma tela do
 * lado de quem ele foi escrito para ler.
 *
 * O que NUNCA mostra: score, banda técnica, cobertura, quem foi eliminado, ou
 * qualquer marca que sugira uma ordem de preferência entre os três.
 */
export function PatientCuradoriaView({ curadoria }: { curadoria: PatientCuradoria }) {
  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seus três caminhos</CardTitle>
          <CardDescription>
            Entregues em {new Date(curadoria.deliveredAt).toLocaleDateString("pt-BR")}. Os três são
            legítimos — a ordem abaixo é de apresentação, não de preferência.
          </CardDescription>
        </CardHeader>
        {curadoria.compositionRationale ? (
          <p className="max-w-reading text-sm leading-relaxed text-ink">
            {curadoria.compositionRationale}
          </p>
        ) : null}
      </Card>

      {curadoria.options.map((option) => (
        <Card key={option.id} className="space-y-4">
          <CardHeader>
            <CardTitle>{option.professionalName}</CardTitle>
          </CardHeader>

          <div>
            <h3 className="text-xs uppercase tracking-wide text-ink-muted">
              Por que este caminho está aqui
            </h3>
            <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink">
              {option.justification}
            </p>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wide text-ink-muted">
              Relação com o que importa para você
            </h3>
            <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink">
              {option.relationToWeights}
            </p>
          </div>

          {/* O que custa vem com o mesmo destaque do que oferece: assimetria
              de entusiasmo é indução (Experience §2.5). */}
          {option.attentionPoints.length > 0 ? (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-ink-muted">Vale considerar</h3>
              <ul className="mt-1 space-y-1">
                {option.attentionPoints.map((point) => (
                  <li key={point} className="max-w-reading text-sm leading-relaxed text-ink">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {option.suggestedQuestions.length > 0 ? (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-ink-muted">
                Perguntas para a primeira consulta
              </h3>
              <ul className="mt-1 space-y-1">
                {option.suggestedQuestions.map((question) => (
                  <li key={question} className="max-w-reading text-sm leading-relaxed text-ink-muted">
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ))}

    </section>
  );
}
