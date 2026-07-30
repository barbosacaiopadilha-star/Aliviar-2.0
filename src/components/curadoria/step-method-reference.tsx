import { COS_PHASE_DEFINITIONS } from "@/modules/curadoria/cos/phases";
import type { CosPhaseId } from "@/modules/curadoria/cos/types";
import { CURADORIA_STEP_LABELS } from "@/modules/curadoria/types";

/**
 * Como esta etapa funciona — a referência do Método, fechada por padrão.
 *
 * @metodo Experience §5 — UX3: o próximo passo é o que a tela oferece primeiro
 * @metodo Ontologia §3.11 — os critérios de cada fase são patrimônio do Método e não se perdem
 *
 * Por que existe: as regras, as validações, os artefatos e a rastreabilidade
 * de cada fase são patrimônio do Método e não podem sumir — mas ocupavam seis
 * cartões abertos ACIMA e ABAIXO do trabalho, e o Curador rolava documentação
 * para chegar ao campo de texto. A informação continua a um clique, no fim da
 * página, e some do caminho de quem já sabe o que está fazendo.
 *
 * Um `<details>` nativo, deliberadamente: abre com teclado, é encontrável pela
 * busca do navegador e não depende de JavaScript para revelar o conteúdo.
 *
 * O que nunca faz: apagar uma regra. Tudo que estava em tela continua aqui,
 * inclusive a citação do documento que originou cada uma.
 */
export function StepMethodReference({ phases }: { phases: CosPhaseId[] }) {
  const definitions = phases.map((phase) => COS_PHASE_DEFINITIONS[phase]);

  return (
    <details className="rounded-md border border-border bg-canvas">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink marker:content-none">
        <span aria-hidden="true" className="mr-2 text-ink-muted">
          ›
        </span>
        Como esta etapa funciona no Método
      </summary>

      <div className="space-y-6 border-t border-border px-4 py-4">
        {definitions.map((definition) => (
          <section key={definition.id} className="space-y-4">
            {definitions.length > 1 ? (
              <h3 className="text-sm font-medium text-ink">{definition.label}</h3>
            ) : null}

            <div>
              <h4 className="text-xs uppercase tracking-wide text-ink-muted">Objetivo</h4>
              <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink">
                {definition.objective}
              </p>
            </div>

            {/* As sete etapas do RACIOCÍNIO (Fundamentos §5.2) vivem aqui, e não
                mais na fila: eram sete, como as etapas da jornada, e as duas
                contagens apareciam com as mesmas palavras significando coisas
                diferentes. O raciocínio é o pensamento do Método — pertence à
                referência, não ao lugar onde se escolhe quem atender. */}
            <div>
              <h4 className="text-xs uppercase tracking-wide text-ink-muted">
                Etapa do raciocínio
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-ink">
                {CURADORIA_STEP_LABELS[definition.reasoningStep]}
              </p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wide text-ink-muted">Regras que valem aqui</h4>
              <ul className="mt-1 space-y-1.5 text-sm leading-relaxed text-ink">
                {definition.validations.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>

            {definition.optionalInformation.length > 0 ? (
              <div>
                <h4 className="text-xs uppercase tracking-wide text-ink-muted">
                  Informações opcionais
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {definition.optionalInformation.join(" · ")}
                </p>
              </div>
            ) : null}

            {definition.artifacts.length > 0 ? (
              <div>
                <h4 className="text-xs uppercase tracking-wide text-ink-muted">
                  Artefatos produzidos
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {definition.artifacts.join(" · ")}
                </p>
              </div>
            ) : null}

            <div>
              <h4 className="text-xs uppercase tracking-wide text-ink-muted">
                De onde estas regras vieram
              </h4>
              <ul className="mt-1 space-y-2">
                {definition.traceability.map((citation) => (
                  <li key={`${citation.source}-${citation.section}-${citation.rule}`} className="text-sm">
                    <span className="text-xs uppercase tracking-wide text-ink-muted">
                      {citation.source} {citation.section}
                    </span>
                    <span className="mt-0.5 block leading-relaxed text-ink">{citation.rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </details>
  );
}
