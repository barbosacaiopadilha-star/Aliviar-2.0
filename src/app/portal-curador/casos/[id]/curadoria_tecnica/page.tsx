import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { CaseAlert } from "@/components/curadoria/case-alert";
import { EligibilityPanel } from "@/components/curadoria/cruzamento-mesa";
import { MapaPrioridadesPanel } from "@/components/curadoria/mesa/mapa-prioridades-panel";
import { PainelInvestigacao } from "@/components/curadoria/mesa/painel-investigacao";
import { ComparacaoPremium } from "@/components/curadoria/mesa/comparacao-premium";
import { HipoteseEmFoco } from "@/components/curadoria/mesa/hipotese-em-foco";
import { MesaShell } from "@/components/curadoria/mesa/mesa-shell";
import { MesaTimelineDupla, type CaseTimelineMark } from "@/components/curadoria/mesa/mesa-timeline";
import {
  AvaliacaoSemElegiveis,
  CompatibilidadeNaoIniciada,
  MesaVazio,
  RedeVazia,
  RelatorioNaoGerado,
} from "@/components/curadoria/mesa/mesa-vazios";
import { PainelAtencao } from "@/components/curadoria/mesa/painel-atencao";
import { RedeFiltravel } from "@/components/curadoria/mesa/rede-filtravel";
import { MesaContextPanel } from "@/components/curadoria/mesa-context-panel";
import { MesaEvidenciasPanel } from "@/components/curadoria/mesa-evidencias-panel";
import { MesaPriorityPanel } from "@/components/curadoria/mesa-priority-panel";
import { MesaWorkspace } from "@/components/curadoria/mesa-workspace";
import { ProtocoloPessoaPanel } from "@/components/curadoria/protocolo-pessoa-panel";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getAuthState } from "@/modules/auth/session";
import {
  listOpenUpdateRequests,
  loadCurrentPracticeEvidence,
  loadEvidenceDivergences,
} from "@/modules/curadoria/evidencias-pratica-repository";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { buildCuratorJourney, journeyStepHref } from "@/modules/curadoria/cos/journey";
import { CRITERION_LABELS } from "@/modules/curadoria/cruzamento";
import { loadMesaCruzamento } from "@/modules/curadoria/mesa-cruzamento";
import { groupPriorityMap } from "@/modules/curadoria/mapa-prioridades";
import {
  listSubcriterionCatalog,
  loadCasePriorityMap,
} from "@/modules/curadoria/mapa-prioridades-repository";
import { crossCaseWithProfessional } from "@/modules/curadoria/motor-compatibilidade-repository";
import { candidatosDaSelecao, foraDaSelecao } from "@/modules/curadoria/mesa-selecao";
import {
  buildMesaEtapas,
  mesaProgress,
  proximaDecisao,
  type MesaEtapaId,
} from "@/modules/curadoria/mesa-etapas";
import {
  hipoteseDe,
  itensDeAtencao,
  linhaDeInvestigacao,
  type InvestigacaoProfissional,
} from "@/modules/curadoria/mesa-investigacao";
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
 * Quatro painéis: cabeçalho fixo (A), navegação das sete etapas (B), área de
 * trabalho (C) e contexto persistente (D). Sobre a área de trabalho corre a
 * linha de investigação — hipótese, evidências, conferência, conclusão — que
 * mostra onde o raciocínio está, não onde o processo está.
 *
 * Nenhuma regra mudou: os mesmos painéis certificados, distribuídos, com
 * recorte de leitura, comparação em matriz e atalhos por cima.
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

  const view = await loadMesaCruzamento(
    supabase,
    record.caseId,
    record.curadoriaTecnica.selectedProfessionalIds.length,
  );

  // Governança da Base: leitura corrente completa, divergências e pendências —
  // a RLS decide o alcance; o papel decide as ações disponíveis no painel.
  const authState = await getAuthState();
  const isAdmin = authState?.roles.includes("administrador") ?? false;
  const redeIds = view.professionals.map((p) => p.professionalProfileId);
  const [evidenceRows, evidenceDivergences, evidenceUpdateRequests] = await Promise.all([
    loadCurrentPracticeEvidence(supabase, redeIds),
    loadEvidenceDivergences(supabase, redeIds),
    listOpenUpdateRequests(supabase, redeIds),
  ]);
  const evidencePanelCan = {
    verify: isAdmin,
    openDivergence: true, // curador e admin — policy divergences_curator_open
    requestUpdate: true, // curador e admin — policy update_requests_insert_operacao
    resolveDivergence: isAdmin,
    markOutdated: isAdmin,
  };

  const lifecycle = record.curadoriaTecnica.curatedSelectionId
    ? await getReportLifecycle(supabase, record.curadoriaTecnica.curatedSelectionId)
    : null;

  // Os fatos que decidem onde está a próxima decisão — derivados, nunca
  // digitados. O módulo puro faz o resto.
  // ADR-042: a autoridade das prioridades é o Mapa, não o orçamento.
  const [catalogo, mapa] = await Promise.all([
    listSubcriterionCatalog(supabase),
    loadCasePriorityMap(supabase, record.caseId),
  ]);

  const criteriaAwaiting = Object.values(view.awaitingDeclaration).reduce(
    (total, faltando) => total + faltando.length,
    0,
  );

  const etapas = buildMesaEtapas({
    profileAcknowledged: view.profileAcknowledged,
    mapPending: mapa.completion.pending,
    professionalsFound: view.counts.found,
    awaitingAreaDeclaration: view.counts.awaiting,
    eligible: view.counts.eligible,
    criteriaAwaiting,
    selected: view.counts.selected,
    reportExists: Boolean(lifecycle),
    reportApproved: Boolean(lifecycle?.approvedAt),
    reportEmitted: Boolean(lifecycle?.emittedAt),
  });

  const decisao = proximaDecisao(etapas, view.profileAcknowledged);

  // ------------------------------------------------------------------
  // A leitura da investigação — tudo derivado do que já está na Mesa.
  // ------------------------------------------------------------------

  const colunaPorId = new Map(view.comparison.map((coluna) => [coluna.professionalProfileId, coluna]));

  const profissionais: InvestigacaoProfissional[] = view.professionals.map((profissional) => {
    const coluna = colunaPorId.get(profissional.professionalProfileId);
    return {
      id: profissional.professionalProfileId,
      nome: profissional.displayName,
      estado: profissional.eligibility.state,
      areaDeclarada: Boolean(profissional.declaration),
      temDivergencia: profissional.areaVerificationStatus === "divergente",
      filtrosSemInformacao: profissional.eligibility.filters.filter(
        (filtro) => filtro.passes === null,
      ).length,
      criteriosPendentes:
        view.awaitingDeclaration[profissional.professionalProfileId]?.length ?? 0,
      // Lacuna do Motor: o que o Case declarou e o profissional não respondeu.
      criteriosInsuficientes:
        coluna?.cells.filter((celula) => celula.result === "LACUNA_DE_INFORMACAO").length ?? 0,
    };
  });

  const criteriaTotal = Object.keys(view.awaitingDeclaration).length * 6;

  const linha = linhaDeInvestigacao({
    mapaCompleto: view.mapaPendentes === 0,
    eligible: view.counts.eligible,
    criteriaDeclared: criteriaTotal - criteriaAwaiting,
    criteriaTotal,
    selected: view.counts.selected,
  });

  const atencao = itensDeAtencao(profissionais);

  const nomeDe = (professionalProfileId: string) =>
    view.professionals.find((p) => p.professionalProfileId === professionalProfileId)
      ?.displayName ?? "Profissional";

  const colunas = view.comparison.map((coluna) => ({
    id: coluna.professionalProfileId,
    nome: nomeDe(coluna.professionalProfileId),
    celulas: coluna.cells,
    resumo: coluna.resumo,
  }));

  const hipoteses = view.comparison.map((coluna) =>
    hipoteseDe({
      professionalProfileId: coluna.professionalProfileId,
      nome: nomeDe(coluna.professionalProfileId),
      celulas: coluna.cells.map((celula) => ({
        label: celula.label,
        importancia: celula.importance,
        resultado: celula.result,
      })),
      pendentes: (view.awaitingDeclaration[coluna.professionalProfileId] ?? []).map(
        (criterio) => CRITERION_LABELS[criterio],
      ),
    }),
  );

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

  // ------------------------------------------------------------------
  // As duas linhas do tempo — orientação, nunca navegação: um clique
  // acidental perderia o trabalho em curso.
  // ------------------------------------------------------------------

  const fase = (nome: string) =>
    state.phases.find((phase) => phase.phase === nome)?.status === "CONCLUIDA";

  const marcar = (marks: { id: string; label: string; done: boolean }[]): CaseTimelineMark[] => {
    const primeiraAberta = marks.findIndex((entrada) => !entrada.done);
    return marks.map((mark, index) => ({
      id: mark.id,
      label: mark.label,
      status: mark.done ? "done" : index === primeiraAberta ? "current" : "ahead",
    }));
  };

  const linhaPaciente = marcar([
    { id: "CONSULTA", label: "Consulta", done: Boolean(record.historia.understandingConfirmedAt) },
    { id: "PERFIL", label: "Perfil", done: Boolean(record.validacao?.validatedAt) },
    { id: "CURADORIA", label: "Curadoria", done: fase("CURADORIA_TECNICA") },
    { id: "RELATORIO", label: "Relatório", done: Boolean(lifecycle?.emittedAt) },
    { id: "ESCOLHA", label: "Escolha", done: fase("DEVOLUTIVA") },
  ]);

  const rotuloDaInvestigacao: Partial<Record<MesaEtapaId, string>> = { CAMINHOS: "Seleção" };

  // M4: nenhuma etapa precisa ser filtrada aqui — a duplicidade que exigia o
  // filtro (CRUZAMENTO repetindo COMPATIBILIDADE) deixou de existir.
  const linhaInvestigacao = marcar(
    etapas.map((etapa) => ({
      id: etapa.id,
      label: rotuloDaInvestigacao[etapa.id] ?? etapa.label,
      done: etapa.status === "PRONTA",
    })),
  );

  const semElegiveis = view.counts.eligible === 0;

  // A leitura do Motor para o primeiro elegível — a interface não recalcula
  // regra nenhuma (ADR-041).
  const primeiroElegivel = view.comparison[0]?.professionalProfileId ?? null;
  const investigacao = primeiroElegivel
    ? await crossCaseWithProfessional(supabase, record.caseId, primeiroElegivel)
    : null;

  const comparacao =
    colunas.length > 0 ? (
      <ComparacaoPremium colunas={colunas} />
    ) : (
      <CompatibilidadeNaoIniciada
        motivo={
          view.mapaPendentes > 0
            ? `O Mapa de Prioridades ainda tem ${view.mapaPendentes} subcritério(s) sem classificação.`
            : "Ainda não há profissional elegível para comparar."
        }
      />
    );

  const conteudo: Record<MesaEtapaId, React.ReactNode> = {
    PERFIL: view.profileAcknowledged ? (
      <MapaPrioridadesPanel
        caseId={record.caseId}
        groups={groupPriorityMap(mapa.items, catalogo)}
        completion={mapa.completion}
      />
    ) : (
      <MesaVazio
        titulo="O Perfil ainda não foi validado."
        corpo={`A Curadoria Técnica só abre depois que ${record.patientFirstName} reconhece o Perfil como seu. Sem o critério dela, qualquer análise seria a Aliviar decidindo com aparência de método.`}
        proximoPasso="A validação acontece na conversa, e é registrada por você na etapa Validar."
      />
    ),

    REDE:
      view.counts.found === 0 ? (
        <RedeVazia />
      ) : (
        <RedeFiltravel view={view} profissionais={profissionais} />
      ),

    AVALIACAO: semElegiveis ? <AvaliacaoSemElegiveis /> : <EligibilityPanel view={view} />,

    // M4: uma única etapa de leitura do Motor — COMPATIBILIDADE. A antiga
    // CRUZAMENTO renderizava exatamente este mesmo nó.
    COMPATIBILIDADE: semElegiveis ? <AvaliacaoSemElegiveis /> : comparacao,

    CAMINHOS: (
      <div className="mesa-bloco">
        {/* M1 (ADR-042): a seleção nasce dos elegíveis da Mesa com a leitura
            do Motor — mesma fonte das etapas de leitura, sem runner e sem
            gate de recálculo. */}
        {record.priorityProfileId ? (
          view.comparison.length > 0 ? (
            <MesaWorkspace
              candidatos={candidatosDaSelecao(view.comparison, nomeDe)}
              excluidos={foraDaSelecao(view.professionals)}
              curatorName={record.curatorName}
              patientFirstName={record.patientFirstName}
              priorityProfileId={record.priorityProfileId}
              persisted={persisted}
              locked={entregue}
              reportHref={journeyStepHref(record.caseId, "RELATORIO")}
            />
          ) : (
            <MesaVazio
              titulo="A seleção ainda não tem candidatos."
              corpo={
                view.mapaPendentes > 0
                  ? `O Mapa de Prioridades ainda tem ${view.mapaPendentes} subcritério(s) sem classificação — a leitura de compatibilidade nasce dele.`
                  : "Ainda não há profissional elegível — a seleção acontece sobre quem passou pela área e pelos filtros deste Case."
              }
              proximoPasso={
                view.mapaPendentes > 0
                  ? "Complete o Mapa na etapa Mapa de Prioridades."
                  : "Declare a compatibilidade de área na etapa Rede elegível."
              }
            />
          )
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
        linha={linha}
        totalProfissionais={colunas.length}
        conteudo={conteudo}
        contexto={
          <>
            <section className="mesa-aside__section">
              <h2 className="mesa-aside__title">Investigação</h2>
              <div className="mt-3">
                {investigacao ? (
                  <PainelInvestigacao
                    leitura={investigacao}
                    catalogo={catalogo}
                    professionalName={nomeDe(investigacao.professionalProfileId)}
                  />
                ) : (
                  <p className="text-sm text-ink-muted">
                    A investigação abre quando houver ao menos um profissional elegível.
                  </p>
                )}
              </div>
            </section>
            <section className="mesa-aside__section">
              <h2 className="mesa-aside__title">Merece atenção</h2>
              <div className="mt-3">
                <PainelAtencao itens={atencao} />
              </div>
            </section>
            <section className="mesa-aside__section">
              <h2 className="mesa-aside__title">O que suas declarações indicam</h2>
              <div className="mt-3">
                <HipoteseEmFoco hipoteses={hipoteses} />
              </div>
            </section>
            <section className="mesa-aside__section">
              <h2 className="mesa-aside__title">O caso</h2>
              <div className="mt-3">
                <MesaContextPanel record={record} />
              </div>
            </section>
            <section className="mesa-aside__section">
              <h2 className="mesa-aside__title">Prioridades do Case</h2>
              <div className="mt-3">
                <MesaPriorityPanel
                  patientFirstName={record.patientFirstName}
                  validatedAt={record.validacao?.validatedAt ?? null}
                  groups={groupPriorityMap(mapa.items, catalogo)}
                />
              </div>
            </section>
            <section className="mesa-aside__section">
              <h2 className="mesa-aside__title">Protocolo da Pessoa</h2>
              <div className="mt-3">
                <ProtocoloPessoaPanel caseId={record.caseId} needs={view.necessidades} />
              </div>
            </section>
            <section className="mesa-aside__section">
              <h2 className="mesa-aside__title">Base de Evidências de Prática</h2>
              <div className="mt-3">
                <MesaEvidenciasPanel
                  caseId={record.caseId}
                  professionals={view.professionals.map((p) => ({
                    professionalProfileId: p.professionalProfileId,
                    displayName: p.displayName,
                  }))}
                  rows={Object.fromEntries(evidenceRows)}
                  divergences={evidenceDivergences}
                  updateRequests={evidenceUpdateRequests}
                  can={evidencePanelCan}
                  nowIso={new Date().toISOString()}
                />
              </div>
            </section>
          </>
        }
        timeline={
          <MesaTimelineDupla paciente={linhaPaciente} investigacao={linhaInvestigacao} />
        }
      />

      <p className="sr-only">
        Etapa da jornada do Case: {journey.steps.find((step) => step.status !== "CONCLUIDA")?.label ?? "concluída"}.
      </p>
    </div>
  );
}
