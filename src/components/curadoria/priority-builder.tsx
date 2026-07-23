"use client";

/**
 * Priority Builder — a distribuição dos 100 pontos.
 *
 * @metodo Fundamentos §10 — o Perfil de Prioridades é o primeiro patrimônio construído em conjunto
 * @metodo Fundamentos §13 — P5: nenhuma prioridade existe sem validação do paciente
 * @metodo Ontologia §3.6 — Peso é importância atribuída pelo paciente, nunca qualidade de médico
 * @metodo Engine §5.2 — o Motor de Pesos nunca sugere valor nem autoajusta um peso quando outro muda
 * @metodo Experience §6 — o total é sempre visível e o que falta é dito em linguagem natural
 *
 * Por que existe: é o núcleo do Método. O Curador conduz uma conversa em que o
 * paciente descobre o que importa para ele, e esta tela precisa acompanhar essa
 * conversa — não conduzi-la. Por isso a barra de proporção é o próprio
 * controle: um só elemento carrega o significado e o ajuste, e o Curador nunca
 * tira os olhos da pessoa para procurar um campo.
 *
 * O que nunca faz:
 *   • autoajustar os outros pesos quando um muda — tiraria do paciente o
 *     controle da própria prioridade;
 *   • sugerir uma distribuição "usual" ou herdada de casos parecidos;
 *   • pedir um número ao paciente;
 *   • desabilitar a validação sem explicar o que falta ao lado.
 */

import { useMemo, useState } from "react";

import { EvidenceCard } from "@/components/curadoria/evidence-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
// Import direto de `method` (puro) e `types` — nunca do índice do módulo, que
// reexporta o repositório marcado como `server-only`.
import { TOTAL_PRIORITY_POINTS } from "@/modules/curadoria/method";
import {
  PRIORITY_CRITERIA,
  PRIORITY_CRITERION_LABELS,
  PRIORITY_CRITERION_QUESTIONS,
  type PriorityCriterion,
} from "@/modules/curadoria/types";

export type BuilderWeight = {
  criterion: PriorityCriterion;
  weight: number;
  evidence: string;
};

type PriorityBuilderProps = {
  patientFirstName: string;
  initialWeights: BuilderWeight[];
  /** Aspectos já declarados como filtro obrigatório — não podem também pesar. */
  filterCriteria: PriorityCriterion[];
  validated: boolean;
};

export function PriorityBuilder({
  patientFirstName,
  initialWeights,
  filterCriteria,
  validated,
}: PriorityBuilderProps) {
  const [weights, setWeights] = useState<BuilderWeight[]>(initialWeights);
  const [adding, setAdding] = useState(false);

  const total = useMemo(() => weights.reduce((sum, entry) => sum + entry.weight, 0), [weights]);
  const remaining = TOTAL_PRIORITY_POINTS - total;
  const missingEvidence = weights.filter((entry) => !entry.evidence.trim());
  const conflicting = weights.filter((entry) => filterCriteria.includes(entry.criterion));

  const available = PRIORITY_CRITERIA.filter(
    (criterion) => !weights.some((entry) => entry.criterion === criterion),
  );

  const canValidate =
    remaining === 0 && missingEvidence.length === 0 && conflicting.length === 0 && !validated;

  function setWeight(criterion: PriorityCriterion, value: number) {
    // Nunca reajusta os outros. Se a soma passar de 100, o Curador vê e decide
    // o que tirar — a escolha é da conversa, não do software.
    setWeights((current) =>
      current.map((entry) => (entry.criterion === criterion ? { ...entry, weight: value } : entry)),
    );
  }

  function setEvidence(criterion: PriorityCriterion, value: string) {
    setWeights((current) =>
      current.map((entry) => (entry.criterion === criterion ? { ...entry, evidence: value } : entry)),
    );
  }

  function addCriterion(criterion: PriorityCriterion) {
    setWeights((current) => [...current, { criterion, weight: 0, evidence: "" }]);
    setAdding(false);
  }

  function removeCriterion(criterion: PriorityCriterion) {
    setWeights((current) => current.filter((entry) => entry.criterion !== criterion));
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-6">
        <CardHeader>
          <CardTitle>O que importa para {patientFirstName}</CardTitle>
          <CardDescription>
            Cem pontos, distribuídos como {patientFirstName} distribuiria. O peso aparece quando duas
            coisas boas não cabem juntas.
          </CardDescription>
        </CardHeader>

        <ul className="space-y-8">
          {weights.map((entry) => {
            const isConflicting = filterCriteria.includes(entry.criterion);
            const share = Math.round((entry.weight / TOTAL_PRIORITY_POINTS) * 100);

            return (
              <li key={entry.criterion} className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <div>
                    <h3 className="font-sans text-base font-medium text-ink">
                      {PRIORITY_CRITERION_LABELS[entry.criterion]}
                    </h3>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {PRIORITY_CRITERION_QUESTIONS[entry.criterion]}
                    </p>
                  </div>
                  <p className="tabular-nums text-2xl font-semibold text-ink">
                    {entry.weight}
                    <span className="ml-1 text-sm font-normal text-ink-muted">
                      {entry.weight === 1 ? "ponto" : "pontos"}
                    </span>
                  </p>
                </div>

                <div className="relative">
                  {/* A proporção preenchida vive atrás do controle: o mesmo
                      elemento comunica quanto pesa e permite mudar. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 rounded-sm bg-brand-sage-light/50 transition-[width] duration-base ease-standard"
                    style={{ width: `${share}%` }}
                  />
                  <label className="sr-only" htmlFor={`peso-${entry.criterion}`}>
                    Pontos de {PRIORITY_CRITERION_LABELS[entry.criterion]}
                  </label>
                  <input
                    id={`peso-${entry.criterion}`}
                    type="range"
                    min={0}
                    max={TOTAL_PRIORITY_POINTS}
                    step={5}
                    value={entry.weight}
                    disabled={validated}
                    onChange={(event) => setWeight(entry.criterion, Number(event.target.value))}
                    aria-valuetext={`${entry.weight} de ${TOTAL_PRIORITY_POINTS} pontos`}
                    className="weight-slider relative disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>

                {isConflicting ? (
                  <p className="text-sm text-warning">
                    {PRIORITY_CRITERION_LABELS[entry.criterion]} já é um filtro obrigatório. Ou elimina,
                    ou pesa — nunca os dois.
                  </p>
                ) : null}

                <div className="space-y-2">
                  <label
                    className="block text-xs uppercase tracking-wide text-ink-muted"
                    htmlFor={`evidencia-${entry.criterion}`}
                  >
                    Evidência
                  </label>
                  {validated ? (
                    <EvidenceCard evidence={entry.evidence} />
                  ) : (
                    <textarea
                      id={`evidencia-${entry.criterion}`}
                      value={entry.evidence}
                      onChange={(event) => setEvidence(entry.criterion, event.target.value)}
                      rows={2}
                      placeholder={`O que ${patientFirstName} disse que originou este peso`}
                      className={cn(
                        "w-full rounded-sm border bg-surface px-3 py-2 text-sm leading-relaxed text-ink",
                        "placeholder:text-ink-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                        "transition-colors duration-fast ease-standard",
                        entry.evidence.trim() ? "border-border" : "border-brand-gold/50",
                      )}
                    />
                  )}
                </div>

                {!validated ? (
                  <button
                    type="button"
                    onClick={() => removeCriterion(entry.criterion)}
                    className="text-sm text-ink-muted underline-offset-4 transition-colors duration-fast ease-standard hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    Tirar este critério
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>

        {!validated && available.length > 0 ? (
          <div className="border-t border-border pt-5">
            {adding ? (
              <div className="space-y-2">
                <p className="text-sm text-ink-muted">Qual outro aspecto {patientFirstName} trouxe?</p>
                <ul className="flex flex-wrap gap-2">
                  {available.map((criterion) => (
                    <li key={criterion}>
                      <button
                        type="button"
                        onClick={() => addCriterion(criterion)}
                        className="rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink transition-colors duration-fast ease-standard hover:border-brand-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                      >
                        {PRIORITY_CRITERION_LABELS[criterion]}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="text-sm font-medium text-brand-primary underline-offset-4 transition-colors duration-fast ease-standard hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Acrescentar um critério
              </button>
            )}
          </div>
        ) : null}
      </Card>

      <DistributionState
        remaining={remaining}
        total={total}
        missingEvidence={missingEvidence.length}
        conflicting={conflicting.length}
        canValidate={canValidate}
        validated={validated}
        patientFirstName={patientFirstName}
      />
    </div>
  );
}

/**
 * O estado da distribuição, dito em linguagem natural. Nunca "85/100" solto —
 * o Curador lê "faltam 15 pontos" (Experience §6).
 */
function DistributionState({
  remaining,
  total,
  missingEvidence,
  conflicting,
  canValidate,
  validated,
  patientFirstName,
}: {
  remaining: number;
  total: number;
  missingEvidence: number;
  conflicting: number;
  canValidate: boolean;
  validated: boolean;
  patientFirstName: string;
}) {
  const blockers: string[] = [];
  if (remaining > 0) blockers.push(`faltam ${remaining} ${remaining === 1 ? "ponto" : "pontos"}`);
  if (remaining < 0)
    blockers.push(`passou ${Math.abs(remaining)} ${Math.abs(remaining) === 1 ? "ponto" : "pontos"} de 100`);
  if (missingEvidence > 0)
    blockers.push(
      missingEvidence === 1 ? "um peso ainda sem evidência" : `${missingEvidence} pesos ainda sem evidência`,
    );
  if (conflicting > 0) blockers.push("um aspecto está como filtro e como critério ao mesmo tempo");

  return (
    <Card className={cn("space-y-4", canValidate && "border-brand-sage/50")}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-sans text-lg font-semibold text-ink">
          {validated
            ? "Perfil validado"
            : remaining === 0 && blockers.length === 0
              ? "Pronto para validar"
              : "Distribuição em construção"}
        </h2>
        <p className="tabular-nums text-sm text-ink-muted">
          {total} de {TOTAL_PRIORITY_POINTS} pontos distribuídos
        </p>
      </div>

      {validated ? (
        <p className="text-sm leading-relaxed text-ink-muted">
          {patientFirstName} reconheceu este Perfil como dele. A partir daqui ele é imutável — corrigir
          exige construir um novo, junto com {patientFirstName}.
        </p>
      ) : blockers.length > 0 ? (
        <p className="text-sm leading-relaxed text-ink">
          Para validar com {patientFirstName}: {blockers.join("; ")}.
        </p>
      ) : (
        <ValidationLiturgy patientFirstName={patientFirstName} />
      )}
    </Card>
  );
}

/**
 * A liturgia da validação (Experience §2.3). Não é um checkbox — é o roteiro
 * do momento em que a decisão passa a ser do paciente.
 */
function ValidationLiturgy({ patientFirstName }: { patientFirstName: string }) {
  return (
    <div className="space-y-4">
      <ol className="space-y-2 text-sm leading-relaxed text-ink">
        <li>1. Leia os pesos em voz alta, na ordem, em linguagem de conversa.</li>
        <li>2. Diga a evidência junto de cada um: &ldquo;ficou assim porque você me disse que…&rdquo;</li>
        <li>
          3. Pergunte o que está faltando — nunca &ldquo;está tudo certo?&rdquo;, que só convida a
          concordar.
        </li>
        <li>4. Se {patientFirstName} hesitar, ajuste aqui mesmo. Hesitação é informação.</li>
      </ol>
      <button
        type="button"
        className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Registrar a validação de {patientFirstName}
      </button>
      <p className="text-xs text-ink-muted">
        Depois de validado, este Perfil não pode mais ser alterado.
      </p>
    </div>
  );
}
