import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { CaseAlert } from "@/components/curadoria/case-alert";
import { CompatibilityRunner } from "@/components/curadoria/compatibility-runner";
import { CruzamentoMesa } from "@/components/curadoria/cruzamento-mesa";
import { loadMesaCruzamento } from "@/modules/curadoria/mesa-cruzamento";
import { MesaContextPanel } from "@/components/curadoria/mesa-context-panel";
import { MesaPriorityPanel } from "@/components/curadoria/mesa-priority-panel";
import { MesaWorkspace } from "@/components/curadoria/mesa-workspace";
import { JourneyNavigator } from "@/components/curadoria/journey-navigator";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { COS_PHASE_DEFINITIONS } from "@/modules/curadoria/cos/phases";
import { buildCuratorJourney, journeyStepHref } from "@/modules/curadoria/cos/journey";

export const metadata: Metadata = {
  title: "Mesa de Curadoria",
  robots: { index: false, follow: false },
};

// MESA DE CURADORIA — MÓDULO 4 / MISSÃO 203
//
// Qual problema do Curador esta tela resolve?
//   "Tenho o Perfil validado e a rede aprovada. Como eu construo, com
//    julgamento próprio, as três opções que vou apresentar?"
//
// As cinco áreas da missão, sem troca de tela:
//   1. Contexto ................ MesaContextPanel  (coluna lateral, sempre visível)
//   2. Perfil de Prioridades ... MesaPriorityPanel (coluna lateral, sempre visível)
//   3. Médicos elegíveis ....... MesaWorkspace     (cartões da rede aprovada)
//   4. Comparação .............. MesaComparison    (lado a lado, sem ranking)
//   5. Parecer do Curador ...... MesaWorkspace     (editor por opção + composição)
//
// A Mesa só abre com o Perfil validado — a entrada da fase é verificada pelo
// Motor de Condução, nunca presumida aqui. Sem validação, a tela explica o que
// falta em vez de mostrar uma mesa vazia.
//
// Rastreabilidade: Fundamentos §13 (P6, P14), Ontologia §3.10 e §3.13,
// Engine §5.3, §5.5 e §11 (Barreira 4), Experience §3 e §6, AQS Q-10 e Q-11.

export default async function MesaCuradoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole("curador_medico");
  const supabase = await createServerSupabaseClient();
  const record = await loadCuradoriaRecord(supabase, id);

  if (!record) {
    notFound();
  }

  const state = conduct(record);
  const journey = buildCuratorJourney(record, state);
  const definition = COS_PHASE_DEFINITIONS.CURADORIA_TECNICA;
  const phaseState = state.phases.find((entry) => entry.phase === "CURADORIA_TECNICA")!;
  const phaseAlerts = state.alerts.filter((alert) => alert.phase === "CURADORIA_TECNICA");
  const { analyses, excluded, computedAt } = record.curadoriaTecnica;

  const blocked = phaseState.status === "BLOQUEADA";

  // Blocos 1–4 do Dashboard: cabeçalho, orçamento 50/50, elegibilidade por
  // área e comparação. A seleção (bloco 5) continua no MesaWorkspace abaixo.
  const cruzamentoView = await loadMesaCruzamento(
    supabase,
    record.caseId,
    record.curadoriaTecnica.selectedProfessionalIds.length,
  );

  // A Mesa reabre onde parou: seleção e pareceres vêm do que já foi gravado.
  // O parecer persiste no Relatório (curadoria_report_options), que é onde os
  // cinco campos da Mesa cabem inteiros — a seleção guarda só o essencial.
  const entregue = Boolean(record.relatorio.emittedAt) || state.phases.some(
    (phase) => phase.phase === "DEVOLUTIVA" && phase.status !== "BLOQUEADA",
  );

  const persisted =
    record.curadoriaTecnica.selectedProfessionalIds.length > 0
      ? {
          selectedIds: record.curadoriaTecnica.selectedProfessionalIds,
          compositionRationale: record.relatorio.compositionRationale ?? "",
          closed: true,
          pareceres: record.curadoriaTecnica.selectedProfessionalIds.map((professionalId) => {
            const option = record.relatorio.options.find(
              (entry) => entry.professionalId === professionalId,
            );
            return {
              professionalId,
              whyIncluded: option?.justification ?? "",
              prioritiesServed: option?.relationToWeights ?? "",
              limitations: option?.attentionPoints.join(" ") ?? "",
              questions: option?.suggestedQuestions.join(" ") ?? "",
              observations: option?.curatorObservations ?? "",
            };
          }),
        }
      : undefined;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/coa/curadoria/casos/${record.caseId}`}
          className="text-sm text-brand-primary underline-offset-4 hover:underline"
        >
          ← {record.patientName}
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-ink">Mesa de Curadoria</h1>
        <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink-muted">
          {definition.objective}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* min-w-0: item de grid tem min-width auto por padrão, o que impede
            a coluna de encolher e faz a tabela de comparação empurrar a
            página inteira no mobile. O scroll pertence à tabela, nunca ao
            corpo (Experience §4 — a página nunca rola na horizontal). */}
        <div className="min-w-0 space-y-6">
          {phaseAlerts.map((alert) => (
            <CaseAlert key={alert.code} {...alert} />
          ))}

          {blocked ? (
            <Card>
              <CardHeader>
                <CardTitle>A Mesa ainda não abre</CardTitle>
                <CardDescription>{phaseState.reason}</CardDescription>
              </CardHeader>
              <p className="max-w-reading text-sm leading-relaxed text-ink">
                A comparação só acontece depois que {record.patientFirstName} valida o Perfil de
                Prioridades. Sem o critério dele, qualquer análise seria a Aliviar decidindo com
                aparência de método.
              </p>
            </Card>
          ) : (
            <>
              <CruzamentoMesa
                view={cruzamentoView}
                patientFirstName={record.patientFirstName}
                necessidade={cruzamentoView.areaRequirement}
              />

              {/* O chamador que faltava: `computeCompatibilityAction` existia
                  pronta e sem nenhuma superfície — a Mesa dizia "comparação
                  ainda não executada" e parava ali, sem caminho pela interface. */}
              {record.priorityProfileId ? (
                <CompatibilityRunner
                  priorityProfileId={record.priorityProfileId}
                  patientFirstName={record.patientFirstName}
                  hasRun={Boolean(computedAt)}
                  eligibleCount={analyses.length}
                />
              ) : null}

              {computedAt && record.priorityProfileId ? (
                <MesaWorkspace
                  analyses={analyses}
                  excluded={excluded}
                  curatorName={record.curatorName}
                  patientFirstName={record.patientFirstName}
                  priorityProfileId={record.priorityProfileId}
                  persisted={persisted}
                  locked={entregue}
                  reportHref={journeyStepHref(record.caseId, "RELATORIO")}
                />
              ) : null}
            </>
          )}
        </div>

        <aside className="space-y-6">
          <MesaContextPanel record={record} />
          <MesaPriorityPanel record={record} />
          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-wide text-ink-muted">A Curadoria inteira</h2>
            <JourneyNavigator journey={journey} caseId={record.caseId} />
          </div>
        </aside>
      </div>

    </div>
  );
}
