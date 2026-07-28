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
 * paciente descobre o que importa, e esta tela acompanha essa conversa.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ScrollActionLink } from "@/components/curadoria/scroll-action-link";
import { EvidenceCard } from "@/components/curadoria/evidence-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import {
  saveAllWeightsAction,
  removeWeightAction,
} from "@/modules/curadoria/actions";
import { Select } from "@/components/ui/select";
import { TOTAL_PRIORITY_POINTS } from "@/modules/curadoria/method";
import { computePriorityValidationReadiness } from "@/modules/curadoria/priority-validation-readiness";
import {
  PRIORITY_TARGET_OPTIONS,
  PRIORITY_TARGET_QUESTIONS,
  requiresTarget,
  targetLabel,
} from "@/modules/curadoria/priority-targets";
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
  /** O que a pessoa declarou, nos critérios que exigem alvo (I-04). */
  targetValue?: string | null;
};

type PriorityBuilderProps = {
  patientFirstName: string;
  priorityProfileId: string;
  initialWeights: BuilderWeight[];
  filterCriteria: PriorityCriterion[];
  validated: boolean;
};

export function PriorityBuilder({
  patientFirstName,
  priorityProfileId,
  initialWeights,
  filterCriteria,
  validated,
}: PriorityBuilderProps) {
  const router = useRouter();
  const [weights, setWeights] = useState<BuilderWeight[]>(initialWeights);
  const [adding, setAdding] = useState(false);
  const [validationNote, setValidationNote] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const readiness = useMemo(
    () =>
      computePriorityValidationReadiness({
        weights: weights.map((entry) => ({
          criterion: entry.criterion,
          weight: entry.weight,
          // Passava `null` fixo aqui: a prontidão nunca enxergava o alvo, então
          // a validação seguia bloqueada mesmo com o alvo escolhido na tela.
          targetValue: entry.targetValue ?? null,
          evidence: entry.evidence,
        })),
        filterCriteria,
        validated,
      }),
    [weights, filterCriteria, validated],
  );

  const available = PRIORITY_CRITERIA.filter(
    (criterion) => !weights.some((entry) => entry.criterion === criterion),
  );

  function setWeight(criterion: PriorityCriterion, value: number) {
    setWeights((current) =>
      current.map((entry) => (entry.criterion === criterion ? { ...entry, weight: value } : entry)),
    );
    setSuccess(null);
    setError(null);
  }

  function setTarget(criterion: PriorityCriterion, value: string) {
    setWeights((current) =>
      current.map((entry) =>
        entry.criterion === criterion ? { ...entry, targetValue: value || null } : entry,
      ),
    );
    setSuccess(null);
    setError(null);
  }

  function setEvidence(criterion: PriorityCriterion, value: string) {
    setWeights((current) =>
      current.map((entry) => (entry.criterion === criterion ? { ...entry, evidence: value } : entry)),
    );
    setSuccess(null);
    setError(null);
  }

  function addCriterion(criterion: PriorityCriterion) {
    setWeights((current) => [...current, { criterion, weight: 0, evidence: "" }]);
    setAdding(false);
  }

  /**
   * Remover um critério precisa chegar ao banco.
   *
   * `saveAllWeightsAction` faz upsert do que recebe — ela nunca apaga o que
   * saiu da lista. Sem esta chamada, um critério tirado da tela continuava
   * gravado, e a soma que o Curador via não era a soma que o Motor lia.
   */
  function removeCriterion(criterion: PriorityCriterion) {
    const persistido = initialWeights.some((entry) => entry.criterion === criterion);
    setWeights((current) => current.filter((entry) => entry.criterion !== criterion));
    setSuccess(null);
    setError(null);

    if (!persistido || validated) return;

    startTransition(async () => {
      const result = await removeWeightAction({ priorityProfileId, criterion });
      if (!result.success) {
        setError(result.error ?? "Não foi possível remover o critério.");
      }
    });
  }

  /**
   * Salvar o trabalho sem validar.
   *
   * Antes, os pesos só eram gravados no instante da validação: distribuir os
   * 100 pontos e fechar a aba jogava fora a conversa inteira. Mas a validação
   * tem liturgia própria e costuma ser outro momento — o Método separa os dois,
   * e a tela precisava separar também.
   */
  function salvarRascunho() {
    if (isPending || validated) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveAllWeightsAction({
        priorityProfileId,
        weights: weights.map((entry) => ({
          criterion: entry.criterion,
          weight: entry.weight,
          targetValue: entry.targetValue ?? null,
          evidence: entry.evidence,
        })),
      });

      if (result.success) {
        setSuccess("Pesos salvos. Você pode continuar depois, de onde parou.");
        router.refresh();
      } else {
        setError(result.error ?? "Não foi possível salvar os pesos.");
      }
    });
  }

  function handleValidate() {
    if (!readiness.canValidate || isPending || validated) return;

    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const saveResult = await saveAllWeightsAction({
        priorityProfileId,
        weights: weights.map((entry) => ({
          criterion: entry.criterion,
          weight: entry.weight,
          targetValue: entry.targetValue ?? null,
          evidence: entry.evidence,
        })),
      });

      if (!saveResult.success) {
        setError(saveResult.error ?? "Não foi possível salvar os pesos.");
        return;
      }
      // ADR-042 — daqui não sai mais reconhecimento. O ato é dela, acontece
      // no ambiente dela e depende do Mapa de Prioridades estar completo, não
      // destes 100 pontos. Este botão apenas grava a distribuição legada.
      setShowConfirm(false);
      setSuccess(
        "Distribuição salva. O reconhecimento do Perfil é um ato dela, no ambiente dela, quando o Mapa de Prioridades estiver completo.",
      );
      router.refresh();
    });
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
              <li key={entry.criterion} id={`criterio-${entry.criterion}`} className="scroll-mt-24 space-y-3">
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
                    disabled={validated || isPending}
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

                {/* O ALVO DECLARADO. Três critérios não são monotônicos: para
                    região, área e forma do primeiro encontro, "mais" não é
                    "melhor" — depende do que ESTA pessoa quer. Sem o alvo, o
                    Motor não tem contra o que comparar e a Invariante I-04
                    impede a validação. Antes o campo não existia, e quem
                    escolhesse um desses três ficava travado sem saída. */}
                {requiresTarget(entry.criterion) ? (
                  <div className="space-y-2">
                    <label
                      className="block text-xs uppercase tracking-wide text-ink-muted"
                      htmlFor={`alvo-${entry.criterion}`}
                    >
                      {PRIORITY_TARGET_QUESTIONS[entry.criterion]}
                    </label>
                    {validated ? (
                      <p className="text-sm text-ink">
                        {targetLabel(entry.criterion, entry.targetValue ?? null) ??
                          "Não declarado."}
                      </p>
                    ) : (
                      <>
                        <Select
                          id={`alvo-${entry.criterion}`}
                          value={entry.targetValue ?? ""}
                          disabled={isPending}
                          error={!entry.targetValue}
                          onChange={(event) => setTarget(entry.criterion, event.target.value)}
                        >
                          {/* Nunca uma opção pré-escolhida: quem responde é ela. */}
                          <option value="">Escolha o que ela declarou</option>
                          {(PRIORITY_TARGET_OPTIONS[entry.criterion] ?? []).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                        {!entry.targetValue ? (
                          <p className="text-xs leading-relaxed text-ink-muted">
                            Sem isto, não há contra o que comparar — este critério ficaria com peso
                            e sem sentido.
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
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
                      disabled={isPending}
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
                    disabled={isPending}
                    className="text-sm text-ink-muted underline-offset-4 transition-colors duration-fast ease-standard hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
                  >
                    Tirar este critério
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>

        {!validated && available.length > 0 ? (
          <div id="priority-add-criterion" className="scroll-mt-24 border-t border-border pt-5">
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

        {/* Salvar sem validar: a distribuição é uma conversa que pode durar
            mais de uma sessão. A validação continua sendo um ato à parte. */}
        {!validated && weights.length > 0 ? (
          <div className="border-t border-border pt-5">
            <button
              type="button"
              onClick={salvarRascunho}
              disabled={isPending}
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-fast ease-standard hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60"
            >
              {isPending ? "Salvando…" : "Salvar o que já definimos"}
            </button>
            <p className="mt-2 max-w-reading text-xs leading-relaxed text-ink-muted">
              Guarda os pesos como estão, sem validar. A validação é um momento com{" "}
              {patientFirstName}, e acontece quando vocês estiverem prontos.
            </p>
          </div>
        ) : null}
      </Card>

      <ValidationReview
        patientFirstName={patientFirstName}
        readiness={readiness}
        validated={validated}
        validationNote={validationNote}
        onValidationNoteChange={setValidationNote}
        showConfirm={showConfirm}
        onShowConfirm={setShowConfirm}
        onValidate={handleValidate}
        isPending={isPending}
        error={error}
        success={success}
      />
    </div>
  );
}

type Readiness = ReturnType<typeof computePriorityValidationReadiness>;

function ValidationReview({
  patientFirstName,
  readiness,
  validated,
  validationNote,
  onValidationNoteChange,
  showConfirm,
  onShowConfirm,
  onValidate,
  isPending,
  error,
  success,
}: {
  patientFirstName: string;
  readiness: Readiness;
  validated: boolean;
  validationNote: string;
  onValidationNoteChange: (value: string) => void;
  showConfirm: boolean;
  onShowConfirm: (value: boolean) => void;
  onValidate: () => void;
  isPending: boolean;
  error: string | null;
  success: string | null;
}) {
  const statusTitle = validated
    ? "Perfil validado"
    : readiness.canValidate
      ? "Tudo pronto para validar"
      : "Revisão final";

  return (
    <Card className={cn("space-y-4", readiness.canValidate && !validated && "border-brand-sage/50")}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-sans text-lg font-semibold text-ink">{statusTitle}</h2>
        <p className="tabular-nums text-sm text-ink-muted">
          {readiness.total} de {TOTAL_PRIORITY_POINTS} pontos distribuídos
        </p>
      </div>

      {validated ? (
        <p className="text-sm leading-relaxed text-ink-muted">
          {patientFirstName} reconheceu este Perfil como dele. A partir daqui ele é imutável — corrigir
          exige construir um novo, junto com {patientFirstName}.
        </p>
      ) : readiness.canValidate ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ink">
            Após a confirmação, os critérios serão registrados como versão validada e não poderão mais
            ser alterados.
          </p>
          <ol className="space-y-1 text-sm text-ink-muted">
            <li>1. Leia os pesos em voz alta, na ordem.</li>
            <li>2. Diga a evidência junto de cada um.</li>
            <li>3. Pergunte o que está faltando — hesitação é informação.</li>
          </ol>

          {showConfirm ? (
            <div className="space-y-3 rounded-md border border-border bg-canvas/40 p-4">
              <label className="block text-sm font-medium text-ink" htmlFor="validation-note">
                Como {patientFirstName} confirmou este Perfil?
              </label>
              <textarea
                id="validation-note"
                value={validationNote}
                onChange={(event) => onValidationNoteChange(event.target.value)}
                rows={3}
                disabled={isPending}
                placeholder="Registre as palavras de confirmação do paciente."
                className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onValidate}
                  disabled={isPending || !validationNote.trim()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Registrando…" : "Confirmar validação"}
                </button>
                <button
                  type="button"
                  onClick={() => onShowConfirm(false)}
                  disabled={isPending}
                  className="inline-flex min-h-11 items-center rounded-md border border-border px-4 py-2.5 text-sm text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Voltar e revisar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onShowConfirm(true)}
              disabled={isPending}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
            >
              Validar critérios de {patientFirstName}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">A validação ainda não pode ser concluída.</p>
          <p className="text-sm text-ink-muted">Pendências</p>
          <ul className="divide-y divide-border/60" role="list">
            {readiness.blockers.map((blocker) => (
              <li key={blocker.message}>
                {blocker.scrollTargetId ? (
                  <ScrollActionLink
                    description={blocker.message}
                    scrollTargetId={blocker.scrollTargetId}
                  />
                ) : (
                  <p className="min-h-11 px-2 py-2.5 text-sm text-ink-muted">{blocker.message}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-brand-sage">{success}</p> : null}
    </Card>
  );
}
