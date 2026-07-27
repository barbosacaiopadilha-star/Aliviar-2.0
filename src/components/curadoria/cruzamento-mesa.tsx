"use client";

/**
 * MESA DO CRUZAMENTO — blocos 1 a 4 do Dashboard do Curador.
 *
 * @metodo Fundamentos §13 — P14: o algoritmo nunca seleciona; a Mesa organiza, compara e explica
 * @metodo Engine §5.2 — o saldo de pontos é sempre visível e o sistema soma pelo Curador, nunca decide por ele
 * @metodo Ontologia §3.13 — a ordenação é de leitura, jamais colocação; nenhum vocabulário de pódio
 * @metodo Experience §6 — ausência de informação é dita como lacuna, nunca convertida em reprovação
 *
 * Por que existe: o Curador não deve precisar somar pontos, cruzar seis
 * critérios mentalmente nem abrir vários cadastros para comparar. Esta tela
 * faz o trabalho mecânico e devolve a ele só o que é dele — declarar área,
 * avaliar critérios e escolher três.
 *
 * 1. Cabeçalho do Case — números que orientam, nunca métricas administrativas
 * 2. Orçamento de pontos — dois cruzamentos de 100, o Curador nunca soma
 * 3. Elegibilidade — declaração de área lado a lado, filtros com resultado dito
 * 4. Comparação — células que explicam; ordenação de leitura, jamais pódio
 *
 * O bloco 5 (seleção dos três) continua no MesaWorkspace já certificado — a
 * regra de exatamente três, os pareceres e o caminho para o Relatório não
 * mudaram de casa.
 *
 * O que esta tela nunca faz: somar pelo Curador errado, decidir área,
 * pré-selecionar, chamar alguém de melhor.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import {
  ASSESSMENT_LABELS,
  AREA_COMPATIBILITY_LABELS,
  CRITERION_LABELS,
  PATIENT_CRITERIA,
  TECHNICAL_CRITERIA,
  type AreaCompatibility,
  type CruzamentoCriterion,
} from "@/modules/curadoria/cruzamento";
import {
  budgetOf,
  clampWeight,
  ELIGIBILITY_LABELS,
} from "@/modules/curadoria/mesa-cruzamento-view";
import type { MesaCruzamentoView, MesaProfessional } from "@/modules/curadoria/mesa-cruzamento";
import { declareAreaAction, saveCruzamentoWeightsAction } from "@/modules/curadoria/cruzamento-actions";

type CruzamentoMesaProps = {
  view: MesaCruzamentoView;
  patientFirstName: string;
  necessidade: string | null;
};

export function CruzamentoMesa({ view, patientFirstName, necessidade }: CruzamentoMesaProps) {
  return (
    <div className="space-y-6">
      <MesaHeader view={view} patientFirstName={patientFirstName} necessidade={necessidade} />

      {view.profileValidated ? (
        <>
          <BudgetPanel view={view} />
          <EligibilityPanel view={view} />
          <ComparisonPanel view={view} />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>O Perfil de Prioridades ainda precisa ser validado pela pessoa.</CardTitle>
            <CardDescription>
              A Curadoria Técnica só abre depois que {patientFirstName} valida o Perfil — sem o
              critério dela, qualquer análise seria a Aliviar decidindo com aparência de método.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bloco 1 — Cabeçalho
// ---------------------------------------------------------------------------

function MesaHeader({
  view,
  patientFirstName,
  necessidade,
}: {
  view: MesaCruzamentoView;
  patientFirstName: string;
  necessidade: string | null;
}) {
  const { counts } = view;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Curadoria de {patientFirstName}</CardTitle>
        <CardDescription>
          {necessidade ?? view.areaRequirement ?? "Necessidade em definição"}
          {" · "}
          {view.profileValidated ? "Perfil validado" : "Perfil pendente"}
        </CardDescription>
      </CardHeader>

      <p className="text-sm font-medium text-ink" aria-live="polite">
        {view.nextStep}
      </p>

      <dl className="mt-4 flex flex-wrap gap-2 text-xs">
        {[
          [`${counts.found} encontrado${counts.found === 1 ? "" : "s"}`, "default"],
          [`${counts.awaiting} aguardando declaração`, counts.awaiting > 0 ? "gold" : "default"],
          [`${counts.eligible} elegíve${counts.eligible === 1 ? "l" : "is"}`, "default"],
          [`${counts.eliminated} eliminado${counts.eliminated === 1 ? "" : "s"}`, "default"],
          [`${counts.pending} pendente${counts.pending === 1 ? "" : "s"} de verificação`, "default"],
          [`${counts.selected} selecionado${counts.selected === 1 ? "" : "s"} de 3`, "default"],
        ].map(([label, variant]) => (
          <Badge key={label as string} variant={variant as "default" | "gold"}>
            {label}
          </Badge>
        ))}
      </dl>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Bloco 2 — Orçamento de pontos
// ---------------------------------------------------------------------------

function BudgetPanel({ view }: { view: MesaCruzamentoView }) {
  const router = useRouter();
  const [weights, setWeights] = useState<Partial<Record<CruzamentoCriterion, number>>>(view.weights);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const technical = useMemo(() => budgetOf(weights, "TECNICO"), [weights]);
  const patient = useMemo(() => budgetOf(weights, "PRIORIDADES"), [weights]);

  function setWeight(criterion: CruzamentoCriterion, proposed: number) {
    setWeights((current) => ({ ...current, [criterion]: clampWeight(current, criterion, proposed) }));
  }

  function saveBlock(block: "TECNICO" | "PRIORIDADES") {
    const criteria = block === "TECNICO" ? TECHNICAL_CRITERIA : PATIENT_CRITERIA;
    setError(null);
    startTransition(async () => {
      const result = await saveCruzamentoWeightsAction({
        caseId: view.caseId,
        block,
        weights: Object.fromEntries(criteria.map((criterion) => [criterion, weights[criterion] ?? 0])),
      });
      if (!result.success) {
        // O rascunho local fica — trabalho digitado nunca é jogado fora.
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section aria-label="Orçamento de pontos" className="grid gap-4 md:grid-cols-2">
      {(
        [
          { title: "Avaliação Técnica do Profissional", block: "TECNICO" as const, budget: technical, criteria: TECHNICAL_CRITERIA },
          { title: "Perfil de Prioridades do Paciente", block: "PRIORIDADES" as const, budget: patient, criteria: PATIENT_CRITERIA },
        ]
      ).map(({ title, block, budget, criteria }) => (
        <Card key={block} role="group" aria-label={title}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription aria-live="polite">{budget.sentence}</CardDescription>
          </CardHeader>

          <div className="space-y-3">
            {criteria.map((criterion) => {
              const value = weights[criterion] ?? 0;
              return (
                <div key={criterion} className="flex items-center justify-between gap-3">
                  <label htmlFor={`weight-${criterion}`} className="text-sm text-ink">
                    {CRITERION_LABELS[criterion]}
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`Diminuir ${CRITERION_LABELS[criterion]}`}
                      onClick={() => setWeight(criterion, value - 5)}
                      disabled={value === 0}
                    >
                      −
                    </Button>
                    <input
                      id={`weight-${criterion}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(event) => setWeight(criterion, Number(event.target.value) || 0)}
                      className="w-14 rounded-md border border-line bg-surface px-2 py-1 text-center text-sm text-ink"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label={`Aumentar ${CRITERION_LABELS[criterion]}`}
                      onClick={() => setWeight(criterion, value + 5)}
                      disabled={budget.remaining === 0}
                    >
                      +
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <Button type="button" onClick={() => saveBlock(block)} disabled={!budget.complete || isPending}>
              {budget.complete ? "Salvar bloco" : `Distribua os ${budget.remaining} pontos restantes`}
            </Button>
          </div>
        </Card>
      ))}

      {error ? (
        <p role="alert" className="text-sm text-red-700 md:col-span-2">
          {error}
        </p>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Bloco 3 — Elegibilidade e declaração de área
// ---------------------------------------------------------------------------

const GROUP_ORDER = ["AGUARDANDO_DECLARACAO", "ELEGIVEL", "PENDENTE_DE_INFORMACAO", "ELIMINADO"] as const;

function EligibilityPanel({ view }: { view: MesaCruzamentoView }) {
  if (view.professionals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>A Rede ainda não possui profissionais disponíveis para este caso.</CardTitle>
          <CardDescription>
            Nenhum profissional publicado corresponde a este contexto. O cadastro e a verificação
            acontecem no Admin.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <section aria-label="Elegibilidade da Rede" className="space-y-4">
      {view.counts.awaiting > 0 ? (
        <p className="text-sm font-medium text-ink">
          Declare a compatibilidade da área de atuação para continuar.
        </p>
      ) : null}

      {GROUP_ORDER.map((state) => {
        const group = view.professionals.filter((professional) => professional.eligibility.state === state);
        if (group.length === 0) return null;
        return (
          <div key={state} className="space-y-3">
            <h3 className="text-xs uppercase tracking-wide text-ink-muted">{ELIGIBILITY_LABELS[state]}</h3>
            {group.map((professional) => (
              <ProfessionalCard key={professional.professionalProfileId} view={view} professional={professional} />
            ))}
          </div>
        );
      })}
    </section>
  );
}

function ProfessionalCard({ view, professional }: { view: MesaCruzamentoView; professional: MesaProfessional }) {
  const [declaring, setDeclaring] = useState(false);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-medium text-ink">{professional.displayName}</h4>
          <p className="text-sm text-ink-muted">
            {professional.areaRawText ?? "Área de atuação não registrada"}
            {professional.cityUf ? ` · ${professional.cityUf}` : ""}
          </p>
        </div>
        <Badge variant={professional.eligibility.state === "ELEGIVEL" ? "gold" : "default"}>
          {ELIGIBILITY_LABELS[professional.eligibility.state]}
        </Badge>
      </div>

      <p className="mt-2 text-sm text-ink-muted">{professional.eligibility.reason}</p>

      {professional.eligibility.filters.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm">
          {professional.eligibility.filters.map((filter) => (
            <li key={filter.label} className="flex flex-wrap justify-between gap-2">
              <span className="text-ink">{filter.label}</span>
              <span className="text-ink-muted">
                {filter.professionalValue} —{" "}
                {filter.passes === true ? "atende" : filter.passes === false ? "não atende" : "pendente de verificação"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {professional.eligibility.state === "AGUARDANDO_DECLARACAO" ||
      professional.eligibility.state === "PENDENTE_DE_INFORMACAO" ? (
        <div className="mt-4">
          {declaring ? (
            <AreaDeclarationForm view={view} professional={professional} onDone={() => setDeclaring(false)} />
          ) : (
            <Button type="button" variant="secondary" onClick={() => setDeclaring(true)}>
              Declarar área
            </Button>
          )}
        </div>
      ) : null}

      {professional.declaration ? (
        <p className="mt-3 text-xs text-ink-muted">
          Declarado como {AREA_COMPATIBILITY_LABELS[professional.declaration.compatibility].toLowerCase()} em{" "}
          {new Date(professional.declaration.declaredAt).toLocaleDateString("pt-BR")}
          {professional.declaration.rationale ? ` — ${professional.declaration.rationale}` : ""}
        </p>
      ) : null}
    </Card>
  );
}

function AreaDeclarationForm({
  view,
  professional,
  onDone,
}: {
  view: MesaCruzamentoView;
  professional: MesaProfessional;
  onDone: () => void;
}) {
  const router = useRouter();
  const [compatibility, setCompatibility] = useState<AreaCompatibility | null>(null);
  const [rationale, setRationale] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const needsRationale = compatibility !== null && compatibility !== "COMPATIVEL";

  function submit() {
    if (!compatibility) return;
    setError(null);
    startTransition(async () => {
      const result = await declareAreaAction({
        caseId: view.caseId,
        professionalProfileId: professional.professionalProfileId,
        compatibility,
        confirmedByCurator: compatibility === "PARCIALMENTE_COMPATIVEL" ? confirmed : false,
        rationale: rationale.trim() || undefined,
        areaTextReviewed: professional.areaRawText ?? undefined,
        caseRequirementReviewed: view.areaRequirement ?? undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      onDone();
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface-raised p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <h5 className="text-xs uppercase tracking-wide text-ink-muted">O caso exige</h5>
          <p className="mt-1 text-sm text-ink">{view.areaRequirement ?? "Área não definida no Perfil"}</p>
        </div>
        <div>
          <h5 className="text-xs uppercase tracking-wide text-ink-muted">O profissional declara</h5>
          <p className="mt-1 text-sm text-ink">{professional.areaRawText ?? "Sem texto registrado"}</p>
          {professional.areaTags.length > 0 ? (
            <p className="mt-1 text-xs text-ink-muted">{professional.areaTags.join(" · ")}</p>
          ) : null}
          <p className="mt-1 text-xs text-ink-muted">
            {professional.areaSource ?? "Fonte não registrada"} ·{" "}
            {professional.areaVerificationStatus ?? "não verificado"}
            {professional.areaVerifiedAt
              ? ` em ${new Date(professional.areaVerifiedAt).toLocaleDateString("pt-BR")}`
              : ""}
          </p>
        </div>
      </div>

      <fieldset>
        <legend className="text-xs uppercase tracking-wide text-ink-muted">Sua declaração</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(AREA_COMPATIBILITY_LABELS) as AreaCompatibility[]).map((option) => (
            <Button
              key={option}
              type="button"
              variant={compatibility === option ? "primary" : "secondary"}
              aria-pressed={compatibility === option}
              onClick={() => setCompatibility(option)}
            >
              {AREA_COMPATIBILITY_LABELS[option]}
            </Button>
          ))}
        </div>
      </fieldset>

      {needsRationale ? (
        <div>
          <label htmlFor={`rationale-${professional.professionalProfileId}`} className="text-sm text-ink">
            {compatibility === "INFORMACAO_INSUFICIENTE"
              ? "O que falta verificar?"
              : "Justificativa"}
          </label>
          <textarea
            id={`rationale-${professional.professionalProfileId}`}
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
        </div>
      ) : null}

      {compatibility === "PARCIALMENTE_COMPATIVEL" ? (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          Confirmo que este profissional participa mesmo com compatibilidade parcial.
        </label>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" onClick={submit} disabled={!compatibility || isPending}>
          Registrar declaração
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bloco 4 — Comparação
// ---------------------------------------------------------------------------

function ComparisonPanel({ view }: { view: MesaCruzamentoView }) {
  const [openEvidence, setOpenEvidence] = useState<string | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);

  if (view.comparison.length === 0) {
    if (view.counts.eligible > 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Comparação</CardTitle>
            <CardDescription>
              A comparação abre quando os dois blocos de pontos estiverem distribuídos.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }
    return null;
  }

  const nameOf = (id: string) =>
    view.professionals.find((p) => p.professionalProfileId === id)?.displayName ?? "Profissional";

  if (view.counts.eligible < 3) {
    // A frase existe mesmo com a matriz visível: comparar dois é possível,
    // selecionar três não.
  }

  return (
    <section aria-label="Comparação dos profissionais" className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Comparação</CardTitle>
          <CardDescription>
            As colunas seguem a ordem da Rede — não há colocação. A seleção pertence ao Curador.
          </CardDescription>
        </CardHeader>

        {view.counts.eligible < 3 ? (
          <p className="mb-3 text-sm text-ink">
            Há apenas {view.counts.eligible} profissiona{view.counts.eligible === 1 ? "l" : "is"} elegíve
            {view.counts.eligible === 1 ? "l" : "is"}. A seleção exige três opções distintas.
          </p>
        ) : null}

        {/* Mobile: um profissional por vez, mesmos critérios na mesma ordem. */}
        <div className="mb-3 flex flex-wrap gap-2 md:hidden">
          {view.comparison.map((column, index) => (
            <Button
              key={column.professionalProfileId}
              type="button"
              variant={index === mobileIndex ? "primary" : "secondary"}
              aria-pressed={index === mobileIndex}
              onClick={() => setMobileIndex(index)}
            >
              {nameOf(column.professionalProfileId)}
            </Button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-0 text-sm">
            <thead>
              <tr>
                <th scope="col" className="py-2 pr-3 text-left text-xs uppercase tracking-wide text-ink-muted">
                  Critério
                </th>
                {view.comparison.map((column, index) => (
                  <th
                    scope="col"
                    key={column.professionalProfileId}
                    className={cn(
                      "py-2 pr-3 text-left font-medium text-ink",
                      index !== mobileIndex && "hidden md:table-cell",
                    )}
                  >
                    {nameOf(column.professionalProfileId)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.comparison[0]!.cells.map((referenceCell) => (
                <tr key={referenceCell.criterion} className="border-t border-line align-top">
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-ink-muted">
                    {referenceCell.label}
                  </th>
                  {view.comparison.map((column, index) => {
                    const cell = column.cells.find((entry) => entry.criterion === referenceCell.criterion)!;
                    const key = `${column.professionalProfileId}:${cell.criterion}`;
                    return (
                      <td
                        key={key}
                        className={cn("py-2 pr-3", index !== mobileIndex && "hidden md:table-cell")}
                      >
                        <button
                          type="button"
                          className="text-left"
                          aria-expanded={openEvidence === key}
                          onClick={() => setOpenEvidence(openEvidence === key ? null : key)}
                        >
                          <span className="font-medium text-ink">
                            {cell.assessment ? ASSESSMENT_LABELS[cell.assessment] : "—"}
                          </span>{" "}
                          <span className="text-ink-muted">({cell.pointsSentence})</span>
                        </button>
                        {openEvidence === key ? (
                          <p className="mt-1 max-w-reading text-xs leading-relaxed text-ink-muted">
                            {cell.evidence}
                          </p>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr className="border-t border-line">
                <th scope="row" className="py-2 pr-3 text-left font-normal text-ink-muted">
                  Cobertura
                </th>
                {view.comparison.map((column, index) => (
                  <td
                    key={column.professionalProfileId}
                    className={cn("py-2 pr-3 text-ink", index !== mobileIndex && "hidden md:table-cell")}
                  >
                    {column.technicalCoverageSentence} {column.patientCoverageSentence.replace("Avaliação construída", "Assistencial construída")}
                  </td>
                ))}
              </tr>

              <tr className="border-t border-line">
                <th scope="row" className="py-2 pr-3 text-left font-normal text-ink-muted">
                  Blocos
                </th>
                {view.comparison.map((column, index) => (
                  <td
                    key={column.professionalProfileId}
                    className={cn(
                      "py-2 pr-3 text-ink-muted",
                      index !== mobileIndex && "hidden md:table-cell",
                    )}
                  >
                    Avaliação Técnica {column.result.technical.score} de 100 · Compatibilidade Assistencial {column.result.patient.score} de 100
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
