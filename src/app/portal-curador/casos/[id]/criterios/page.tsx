import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { CaseAlert } from "@/components/curadoria/case-alert";
import { JourneyNavigator } from "@/components/curadoria/journey-navigator";
import { MandatoryFilters } from "@/components/curadoria/mandatory-filters";
import { PriorityBuilder } from "@/components/curadoria/priority-builder";
import { StartPriorityProfile } from "@/components/curadoria/start-priority-profile";
import { StepMethodReference } from "@/components/curadoria/step-method-reference";
import { LastUpdate, StepStatus } from "@/components/journey";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { buildMemory } from "@/modules/curadoria/cos/memory";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { buildCuratorJourney, journeyStepHref } from "@/modules/curadoria/cos/journey";
import { PHASE_STATUS_LABELS } from "@/modules/curadoria/cos/conduction-ui";
import type { PriorityCriterion } from "@/modules/curadoria/types";

export const metadata: Metadata = {
  title: "Definir Critérios",
  robots: { index: false, follow: false },
};

// DEFINIR CRITÉRIOS — a fusão de Filtros e Perfil de Prioridades.
//
// Qual problema do Curador esta tela resolve?
//   "O que essa pessoa me disse que elimina uma opção, e o que pesa na escolha
//    dela — e ela reconhece isso como dela?"
//
// Por que as duas fases viraram uma etapa: são UMA pergunta com dois lados.
// Quando o paciente diz "precisa ser em São Paulo", o Curador decide na mesma
// frase se aquilo elimina ou se apenas pesa — e essa é exatamente a decisão que
// a Invariante 24 governa (nada é filtro E critério ao mesmo tempo). Em telas
// separadas, o conflito só aparecia depois, como alerta; juntas, ele é evitável
// porque os dois lados estão à vista.
//
// A validação continua sendo uma ETAPA à parte na jornada — o ato é do paciente
// e torna o Perfil imutável — mas acontece aqui, sobre a distribuição que ela
// valida. Uma tela cujo único conteúdo era um link para esta deixou de existir.
//
// O sistema de pesos, computeCompatibility() e as regras do Método permanecem
// exatamente como estavam: mudou onde o Curador trabalha, não o que vale.

const FILTER_KIND_TO_CRITERION: Record<string, PriorityCriterion> = {
  AREA_DE_ATUACAO: "AREA_DE_ATUACAO",
  UF: "LOCALIZACAO",
  CUIDADO_CONTINUO: "CONTINUIDADE",
  DISPONIBILIDADE_IMEDIATA: "DISPONIBILIDADE",
};

export default async function CriteriosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("curador_medico");
  const supabase = await createServerSupabaseClient();
  const record = await loadCuradoriaRecord(supabase, id);

  if (!record) {
    notFound();
  }

  const state = conduct(record);
  const journey = buildCuratorJourney(record, state);
  const step = journey.steps.find((entry) => entry.id === "CRITERIOS")!;
  const validationStep = journey.steps.find((entry) => entry.id === "VALIDAR")!;

  const inconsistencies = state.inconsistencies.filter((entry) =>
    ["FILTROS", "PRIORIDADES"].includes(entry.phase),
  );

  const validated = Boolean(record.validacao?.validatedAt);

  const filterCriteria = record.filtros
    .map((filtro) => FILTER_KIND_TO_CRITERION[filtro.kind])
    .filter((criterion): criterion is PriorityCriterion => Boolean(criterion));

  const lastEvent = buildMemory(record)
    .filter((entry) => ["FILTROS", "PRIORIDADES", "VALIDACAO"].includes(entry.phase))
    .sort((a, b) => a.at.localeCompare(b.at))
    .at(-1);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/coa/curadoria/casos/${record.caseId}`}
          className="text-sm text-brand-primary underline-offset-4 hover:underline"
        >
          ← {record.patientName}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl text-ink">Definir Critérios</h1>
          <Badge variant={step.status === "CONCLUIDA" ? "sage" : "default"}>
            {PHASE_STATUS_LABELS[step.status]}
          </Badge>
        </div>
        <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink-muted">
          Etapa {step.order} de {journey.totalCount} · o que elimina uma opção, e o que pesa na
          escolha de {record.patientFirstName}.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {inconsistencies.map((entry) => (
            <CaseAlert
              key={`${entry.code}-${entry.description}`}
              code={entry.code}
              title="Inconsistência"
              detail={entry.description}
              severity="bloqueio"
            />
          ))}

          <StepStatus
            stepName={step.label}
            settled={step.settled}
            missing={step.missing}
            blockedReason={step.blockedReason}
            completionSentence={step.completionSentence}
          />

          {/* 1 — O QUE ELIMINA. Vem primeiro porque um requisito inegociável
              muda o universo inteiro: distribuir pontos antes de saber quem
              está fora é pesar sobre uma lista que ainda vai mudar. */}
          <Card>
            <CardHeader>
              <CardTitle>Critérios obrigatórios</CardTitle>
              <CardDescription>
                O que elimina uma opção, de forma binária, antes de qualquer conta. Um requisito
                obrigatório nunca recebe peso — ou elimina, ou pesa.
              </CardDescription>
            </CardHeader>
            {record.priorityProfileId ? (
              <MandatoryFilters
                priorityProfileId={record.priorityProfileId}
                patientFirstName={record.patientFirstName}
                readOnly={validated}
                filters={record.filtros.map((filtro) => ({
                  id: filtro.id,
                  kind: filtro.kind,
                  label: filtro.label,
                  value: filtro.value,
                  reason: filtro.reason,
                }))}
                preferences={record.prioridades.preferencias.map((preference) => ({
                  id: preference.id,
                  value: preference.value,
                  reason: "",
                }))}
              />
            ) : (
              <StartPriorityProfile
                caseId={record.caseId}
                patientFirstName={record.patientFirstName}
              />
            )}
          </Card>

          {/* 2 — O QUE PESA. E, dentro dele, a liturgia da validação — o ato
              do paciente acontece sobre a distribuição que ele valida. */}
          <div id="prioridades" className="scroll-mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prioridades</CardTitle>
                <CardDescription>
                  Os 100 pontos que {record.patientFirstName} distribui entre o que influencia a
                  ordem. Cada peso nasce de uma fala dela e carrega a evidência.
                </CardDescription>
              </CardHeader>
            </Card>

            <div id="validacao" className="scroll-mt-6">
              {record.priorityProfileId ? (
                <PriorityBuilder
                  patientFirstName={record.patientFirstName}
                  priorityProfileId={record.priorityProfileId}
                  initialWeights={record.prioridades.weights.map((weight) => ({
                    criterion: weight.criterion,
                    weight: weight.weight,
                    evidence: weight.evidence,
                  }))}
                  filterCriteria={filterCriteria}
                  validated={validated}
                />
              ) : null}
            </div>
          </div>

          {/* A validação é etapa própria na jornada — dono diferente, e
              irreversível. A tela diz isso onde o ato acontece. */}
          <StepStatus
            stepName={validationStep.label}
            settled={validationStep.settled}
            missing={validationStep.missing}
            blockedReason={validationStep.blockedReason}
            completionSentence={validationStep.completionSentence}
          />

          {validated ? (
            <Card className="border-brand-sage/40">
              <CardHeader>
                <CardTitle>Próxima etapa: Curadoria Técnica</CardTitle>
                <CardDescription>
                  Com o Perfil validado, a Mesa abre — o critério dela já existe.
                </CardDescription>
              </CardHeader>
              <Link
                href={journeyStepHref(record.caseId, "COMPARAR")}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Abrir a Mesa de Curadoria
                <span aria-hidden="true">→</span>
              </Link>
            </Card>
          ) : null}

          <StepMethodReference phases={["FILTROS", "PRIORIDADES", "VALIDACAO"]} />
        </div>

        <aside className="space-y-4">
          <LastUpdate at={lastEvent?.at ?? null} by={lastEvent?.actor} what={lastEvent?.description} />

          {record.prioridades.observations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
                <CardDescription>Nas palavras dela, sem virar critério.</CardDescription>
              </CardHeader>
              <ul className="space-y-2 text-sm leading-relaxed text-ink-muted">
                {record.prioridades.observations.map((observation) => (
                  <li key={observation}>{observation}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-wide text-ink-muted">A Curadoria inteira</h2>
            <JourneyNavigator journey={journey} caseId={record.caseId} />
          </div>
        </aside>
      </div>
    </div>
  );
}
