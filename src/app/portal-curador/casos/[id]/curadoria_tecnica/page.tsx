import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { CaseAlert } from "@/components/curadoria/case-alert";
import { CompatibilityRunner } from "@/components/curadoria/compatibility-runner";
import {
  BudgetPanel,
  ComparisonPanel,
  EligibilityPanel,
} from "@/components/curadoria/cruzamento-mesa";
import { MesaShell } from "@/components/curadoria/mesa/mesa-shell";
import { MesaTimeline, type CaseTimelineMark } from "@/components/curadoria/mesa/mesa-timeline";
import {
  AvaliacaoSemElegiveis,
  CruzamentoNaoIniciado,
  MesaVazio,
  RedeVazia,
  RelatorioNaoGerado,
} from "@/components/curadoria/mesa/mesa-vazios";
import { MesaContextPanel } from "@/components/curadoria/mesa-context-panel";
import { MesaPriorityPanel } from "@/components/curadoria/mesa-priority-panel";
import { MesaWorkspace } from "@/components/curadoria/mesa-workspace";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { buildCuratorJourney, journeyStepHref } from "@/modules/curadoria/cos/journey";
import { loadMesaCruzamento } from "@/modules/curadoria/mesa-cruzamento";
import {
  buildMesaEtapas,
  mesaProgress,
  proximaDecisao,
  type MesaEtapaId,
} from "@/modules/curadoria/mesa-etapas";
import { getReportLifecycle } from "@/modules/curadoria/relatorio-assistido";

export const metadata: Metadata = {
  title: "Mesa de Curadoria",
  robots: { index: false, follow: false },
};

/**
 * A MESA — ambiente de investigação.
 *
 * O paciente percorre uma jornada; o Curador conduz uma investigação. A área
 * do paciente é linear e acolhedora; a Mesa é densa, objetiva e sob controle
 * de quem investiga: tudo está disponível, mas só o que serve à decisão de
 * agora ganha destaque.
 *
 * A tela empilhava orçamento, elegibilidade, comparação e seleção na mesma
 * rolagem — dez painéis competindo por quem precisa decidir uma coisa de cada
 * vez. Agora são quatro painéis: cabeçalho fixo (A), navegação das sete
 * etapas (B), área de trabalho (C) e contexto persistente (D). Trocar de
 * etapa não troca de tela e não perde contexto.
 *
 * Nenhuma regra mudou: os mesmos painéis certificados, distribuídos.
 */
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
  const phaseAlerts = state.alerts.filter((alert) => alert.phase === "CURADORIA_TECNICA");
  const { analyses, excluded, computedAt } = record.curadoriaTecnica;

  const view = await loadMesaCruzamento(
    supabase,
    record.caseId,
    record.curadoriaTecnica.selectedProfessionalIds.length,
  );

  const lifecycle = record.curadoriaTecnica.curatedSelectionId
    ? await getReportLifecycle(supabase, record.curadoriaTecnica.curatedSelectionId)
    : null;

  // Os fatos que decidem onde está a próxima decisão — derivados, nunca
  // digitados. O módulo puro faz o resto.
  const criteriaAwaiting = Object.values(view.awaitingDeclaration).reduce(
    (total, faltando) => total + faltando.length,
    0,
  );

  const etapas = buildMesaEtapas({
    profileValidated: view.profileValidated,
    budgetsComplete: view.budgets.technical.complete && view.budgets.patient.complete,
    professionalsFound: view.counts.found,
    awaitingAreaDeclaration: view.counts.awaiting,
    eligible: view.counts.eligible,
    criteriaAwaiting,
    selected: view.counts.selected,
    reportExists: Boolean(lifecycle),
    reportApproved: Boolean(lifecycle?.approvedAt),
    reportEmitted: Boolean(lifecycle?.emittedAt),
  });

  const decisao = proximaDecisao(etapas, view.profileValidated);

  const entregue =
    Boolean(record.relatorio.emittedAt) ||
    state.phases.some((phase) => phase.phase === "DEVOLUTIVA" && phase.status !== "BLOQUEADA");

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

  // A linha do tempo do Case — orientação, nunca navegação: um clique
  // acidental perderia o trabalho em curso.
  const marks: CaseTimelineMark[] = [
    { id: "CONSULTA", label: "Consulta", done: Boolean(record.historia.understandingConfirmedAt) },
    { id: "PERFIL", label: "Perfil", done: Boolean(record.validacao?.validatedAt) },
    { id: "VALIDACAO", label: "Validação", done: Boolean(record.validacao?.validatedAt) },
    { id: "CURADORIA", label: "Curadoria", done: view.counts.selected === 3 },
    { id: "RELATORIO", label: "Relatório", done: Boolean(lifecycle?.emittedAt) },
    { id: "ENTREGA", label: "Entrega", done: Boolean(record.relatorio.deliveredAt) },
  ].map((mark, index, all) => {
    const firstOpen = all.findIndex((entry) => !entry.done);
    return {
      id: mark.id,
      label: mark.label,
      status: mark.done ? "done" : index === firstOpen ? "current" : "ahead",
    };
  });

  const semElegiveis = view.counts.eligible === 0;

  const conteudo: Record<MesaEtapaId, React.ReactNode> = {
    PERFIL: view.profileValidated ? (
      <BudgetPanel view={view} />
    ) : (
      <MesaVazio
        titulo="O Perfil ainda não foi validado."
        corpo={`A Curadoria Técnica só abre depois que ${record.patientFirstName} reconhece o Perfil como seu. Sem o critério dela, qualquer análise seria a Aliviar decidindo com aparência de método.`}
        proximoPasso="A validação acontece na conversa, e é registrada por você na etapa Validar."
      />
    ),

    REDE: view.counts.found === 0 ? <RedeVazia /> : <EligibilityPanel view={view} />,

    AVALIACAO: semElegiveis ? <AvaliacaoSemElegiveis /> : <EligibilityPanel view={view} />,

    COMPATIBILIDADE: semElegiveis ? <AvaliacaoSemElegiveis /> : <ComparisonPanel view={view} />,

    CRUZAMENTO:
      view.comparison.length > 0 ? (
        <ComparisonPanel view={view} />
      ) : (
        <CruzamentoNaoIniciado
          motivo={
            !view.budgets.technical.complete || !view.budgets.patient.complete
              ? "Os dois cruzamentos precisam ter os 100 pontos distribuídos antes de produzir leitura."
              : "Ainda não há profissional elegível com avaliação registrada."
          }
        />
      ),

    CAMINHOS: (
      <div className="mesa-bloco">
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
      </div>
    ),

    RELATORIO:
      view.counts.selected === 3 ? (
        <MesaVazio
          titulo="O Relatório abre na etapa própria."
          corpo="Ele é um documento, não um painel: tem estados próprios — rascunho, revisão, aprovação, emissão — e congela quando emitido."
          proximoPasso="Abra o Relatório para escrever, gerar o rascunho assistido, aprovar e emitir."
        />
      ) : (
        <RelatorioNaoGerado />
      ),
  };

  return (
    <div className="space-y-2">
      <Link
        href={`/coa/curadoria/casos/${record.caseId}`}
        className="text-sm text-brand-primary underline-offset-4 hover:underline"
      >
        ← Voltar ao Case
      </Link>

      {phaseAlerts.length > 0 ? (
        <div className="space-y-2 pt-2">
          {phaseAlerts.map((alert) => (
            <CaseAlert key={alert.code} {...alert} />
          ))}
        </div>
      ) : null}

      <MesaShell
        patientName={record.patientName}
        areaRequirement={view.areaRequirement}
        curatorName={record.curatorName}
        progress={mesaProgress(etapas)}
        decisao={decisao}
        alerts={phaseAlerts.map((alert) => alert.title)}
        etapas={etapas}
        conteudo={conteudo}
        contexto={
          <>
            <section className="mesa-aside__section">
              <h2 className="mesa-aside__title">O caso</h2>
              <div className="mt-3">
                <MesaContextPanel record={record} />
              </div>
            </section>
            <section className="mesa-aside__section">
              <h2 className="mesa-aside__title">Perfil validado</h2>
              <div className="mt-3">
                <MesaPriorityPanel record={record} />
              </div>
            </section>
          </>
        }
        timeline={<MesaTimeline marks={marks} />}
      />

      <p className="sr-only">
        Etapa da jornada do Case: {journey.steps.find((step) => step.status !== "CONCLUIDA")?.label ?? "concluída"}.
      </p>
    </div>
  );
}
