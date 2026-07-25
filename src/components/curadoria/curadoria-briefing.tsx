import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  OBSERVATION_KIND_LABELS,
  ORIGIN_LABELS,
  PATIENT_OPTION_LABELS,
  PATIENT_QUESTION_TEXT,
  PROFESSIONAL_OPTION_LABELS,
  PROFESSIONAL_QUESTION_TEXT,
  type BriefingSuggestion,
  type CuradoriaBriefingData,
  type Evidence,
} from "@/modules/briefing/types";

/**
 * BRIEFING DA CURADORIA — a camada de contexto do Curador.
 *
 * @metodo Engine §4 — o Motor reconhece e explica; quem decide é o Curador
 * @metodo Experience §3 — o Curador tem um copiloto, nunca um piloto
 * @metodo Ontologia §8 — ranking, colocação e vencedor estão fora deste domínio
 *
 * Governado por docs/ACE_FOUNDATION.md, ACE_PRINCIPLES.md (P2 — compatibilidade
 * não é medida; P6 — explicabilidade legível) e ACE_BOUNDARIES.md §3.
 *
 * Por que existe: o Curador precisa responder "como devo apresentar esta
 * Curadoria para esta pessoa?" sem reler a Consulta Inicial inteira.
 *
 * O que NUNCA faz: exibir score, nota, percentual, estrela, medalha, selo ou
 * ordem de preferência entre profissionais. Não escolhe, não recomenda
 * profissional, não altera os pesos nem a compatibilidade técnica — que
 * seguem exatamente como estão, em outra tela.
 *
 * Visibilidade: exclusivo do processo de Curadoria. O paciente nunca vê
 * (ACE_BOUNDARIES §3.1); o médico nunca vê (§3.2).
 */

function EvidenceLine({ evidence }: { evidence: Evidence }) {
  return (
    <li className="text-sm leading-relaxed text-ink-muted">
      <span className="font-medium text-ink">{ORIGIN_LABELS[evidence.origin]}:</span>{" "}
      <span>{evidence.statement}</span>
      {evidence.at ? (
        <span className="text-xs"> · {new Date(evidence.at).toLocaleDateString("pt-BR")}</span>
      ) : null}
    </li>
  );
}

function SuggestionCard({ suggestion }: { suggestion: BriefingSuggestion }) {
  const tom =
    suggestion.kind === "ATENCAO"
      ? "border-warning bg-warning-surface"
      : suggestion.kind === "LACUNA"
        ? "border-border bg-canvas"
        : "border-brand-gold/40 bg-surface";

  const rotulo =
    suggestion.kind === "ATENCAO" ? "Ponto de atenção" : suggestion.kind === "LACUNA" ? "Falta saber" : "Ponto de alinhamento";

  return (
    <div className={`rounded-md border p-4 ${tom}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{rotulo}</p>
      <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink">{suggestion.suggestion}</p>

      {/* A justificativa é obrigatória e legível — nunca "o algoritmo calculou". */}
      <p className="mt-2 max-w-reading text-xs leading-relaxed text-ink-muted">{suggestion.because}</p>

      <ul className="mt-3 space-y-1 border-t border-border pt-3">
        {suggestion.evidence.map((evidence, index) => (
          <EvidenceLine key={`${suggestion.id}-${index}`} evidence={evidence} />
        ))}
      </ul>
    </div>
  );
}

export function CuradoriaBriefing({ data }: { data: CuradoriaBriefingData }) {
  const alinhamentos = data.suggestions.filter((s) => s.kind === "ALINHAMENTO");
  const atencoes = data.suggestions.filter((s) => s.kind === "ATENCAO");
  const lacunas = data.suggestions.filter((s) => s.kind === "LACUNA");
  const semNada =
    data.patientAnswers.length === 0 && data.observations.length === 0 && data.suggestions.length === 0;

  return (
    <Card className="space-y-6">
      <CardHeader>
        <CardTitle>Briefing da Curadoria</CardTitle>
        <CardDescription>
          Contexto para você conduzir a apresentação. Não escolhe profissional, não altera a análise
          técnica — só reúne o que já foi dito, com a origem de cada informação.
        </CardDescription>
      </CardHeader>

      {semNada ? (
        <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
          Ainda não há Perfil de Alinhamento nem observações registradas neste caso. A Curadoria segue
          normalmente — este briefing é apoio, nunca requisito. Quando você registrar algo na Consulta
          Inicial, aparece aqui.
        </p>
      ) : null}

      {/* 1 — Como esta pessoa costuma decidir (PREFERÊNCIA DECLARADA) */}
      {data.patientAnswers.length > 0 ? (
        <section aria-labelledby="briefing-paciente" className="space-y-2">
          <h3 id="briefing-paciente" className="text-sm font-semibold text-ink">
            Como {data.patientFirstName} costuma decidir
          </h3>
          <p className="text-xs text-ink-muted">O que a própria pessoa declarou — nunca uma leitura sobre ela.</p>
          <ul className="space-y-2">
            {data.patientAnswers.map((answer) => (
              <li key={answer.questionId} className="rounded-md border border-border bg-surface p-3">
                <p className="text-xs text-ink-muted">{PATIENT_QUESTION_TEXT[answer.questionId]}</p>
                <p className="mt-1 text-sm text-ink">
                  {PATIENT_OPTION_LABELS[answer.option] ?? answer.option}
                </p>
                {answer.verbatim ? (
                  <p className="mt-1 max-w-reading text-sm italic leading-relaxed text-ink">
                    &ldquo;{answer.verbatim}&rdquo;
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 2 — Como cada profissional declara conduzir (FATO DECLARADO) */}
      {data.professionalAnswers.size > 0 ? (
        <section aria-labelledby="briefing-medicos" className="space-y-2">
          <h3 id="briefing-medicos" className="text-sm font-semibold text-ink">
            Como cada profissional declara conduzir seus pacientes
          </h3>
          <p className="text-xs text-ink-muted">
            Declarado por cada um sobre si. Sem comparação entre eles e sem ordem de preferência.
          </p>
          <div className="space-y-3">
            {[...data.professionalAnswers.entries()].map(([profileId, answers]) => (
              <div key={profileId} className="rounded-md border border-border bg-surface p-3">
                <p className="text-sm font-medium text-ink">
                  {data.professionalNames.get(profileId) ?? "Profissional"}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {answers.map((answer) => (
                    <li key={answer.questionId} className="text-sm">
                      <span className="block text-xs text-ink-muted">
                        {PROFESSIONAL_QUESTION_TEXT[answer.questionId]}
                      </span>
                      <span className="text-ink">
                        {answer.declaredText?.trim() ||
                          PROFESSIONAL_OPTION_LABELS[answer.option ?? ""] ||
                          answer.option}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 3 — Observações desta Consulta Inicial (INTERPRETAÇÃO, com autor) */}
      {data.observations.length > 0 ? (
        <section aria-labelledby="briefing-observacoes" className="space-y-2">
          <h3 id="briefing-observacoes" className="text-sm font-semibold text-ink">
            Observações desta Consulta Inicial
          </h3>
          <p className="text-xs text-ink-muted">
            Leitura de quem conduziu, com autor e data. Pertence a este caso — não descreve a pessoa.
          </p>
          <ul className="space-y-2">
            {data.observations.map((observation) => (
              <li key={observation.id} className="rounded-md border border-border bg-surface p-3">
                <p className="text-xs text-ink-muted">{OBSERVATION_KIND_LABELS[observation.kind]}</p>
                <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink">{observation.note}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {observation.authorName} · {new Date(observation.observedAt).toLocaleDateString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 4 — Pontos de atenção */}
      {atencoes.length > 0 ? (
        <section aria-labelledby="briefing-atencao" className="space-y-2">
          <h3 id="briefing-atencao" className="text-sm font-semibold text-ink">
            Pontos de atenção
          </h3>
          <div className="space-y-2">
            {atencoes.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 5 — Sugestões para apresentação */}
      {alinhamentos.length > 0 || lacunas.length > 0 ? (
        <section aria-labelledby="briefing-sugestoes" className="space-y-2">
          <h3 id="briefing-sugestoes" className="text-sm font-semibold text-ink">
            Sugestões para a apresentação
          </h3>
          <p className="text-xs text-ink-muted">
            Cada sugestão mostra de onde veio. Você decide o que usar — e pode registrar discordância.
          </p>
          <div className="space-y-2">
            {alinhamentos.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
            {lacunas.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>
        </section>
      ) : null}
    </Card>
  );
}
