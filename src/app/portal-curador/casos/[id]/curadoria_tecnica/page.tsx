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
import { PainelDeJuizo, type ConceitoDeJuizo } from "@/components/curadoria/mesa/painel-de-juizo";
import { RedeFiltravel } from "@/components/curadoria/mesa/rede-filtravel";
import { MesaContextPanel } from "@/components/curadoria/mesa-context-panel";
import { MesaEvidenciasPanel } from "@/components/curadoria/mesa-evidencias-panel";
import { MesaPriorityPanel } from "@/components/curadoria/mesa-priority-panel";
import { MesaWorkspace } from "@/components/curadoria/mesa-workspace";
import { StartPriorityProfile } from "@/components/curadoria/start-priority-profile";
import { ProtocoloPessoaPanel } from "@/components/curadoria/protocolo-pessoa-panel";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { falhaParaUsuario } from "@/lib/observability/erros";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRole } from "@/modules/auth/guard";
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
import { crossCaseRelationalForProfessionals } from "@/modules/curadoria/motor-relacional-repository";
import { RELATIONAL_CONCEPTS_BY_CODE } from "@/modules/curadoria/motor-relacional";
import {
  conceitosExigidos,
  julgamentoVigente,
  lacunasDeJuizo,
  regimeDaAvaliacao,
} from "@/modules/curadoria/julgamentos";
import { loadJulgamentosDaAvaliacao } from "@/modules/curadoria/julgamentos-repository";
import { AbasCompatibilidade } from "@/components/curadoria/mesa/abas-compatibilidade";
import { LeituraRelacionalPanel } from "@/components/curadoria/mesa/leitura-relacional-panel";
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
import { itensParaTextarea } from "@/modules/curadoria/relatorio-itens";
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
  await requireAnyRole(["curador_medico", "administrador"]);
  const supabase = await createServerSupabaseClient();
  const record = await loadCuradoriaRecord(supabase, id);

  if (!record) {
    notFound();
  }

  const state = conduct(record);
  const journey = buildCuratorJourney(record, state);
  const phaseAlerts = state.alerts.filter((alert) => alert.phase === "CURADORIA_TECNICA");

  // Bloco D (gate D17): a construção da Rede é fail-closed — blocklist
  // inacessível LANÇA, e a falha aparece aqui como erro dito, com referência
  // ERR-. Nunca uma Rede inflada (profissional bloqueado aparecendo) nem uma
  // Rede vazia mentirosa. Mínimo honesto: mensagem + referência.
  let view;
  try {
    view = await loadMesaCruzamento(
      supabase,
      record.caseId,
      record.curadoriaTecnica.selectedProfessionalIds.length,
    );
  } catch (erro) {
    const mensagem = falhaParaUsuario("mesa.curadoriaTecnica.cruzamento", erro, {
      mensagem: "Não foi possível montar a Mesa deste Case agora.",
      contexto: { caseId: record.caseId },
    });
    return (
      <main className="mx-auto max-w-reading px-6 py-10">
        <h1 className="font-serif text-xl font-medium text-ink">Mesa de Curadoria</h1>
        <p role="alert" className="mt-4 text-sm leading-relaxed text-ink">
          {mensagem} A Rede deste Case não pôde ser lida — nada foi decidido nem perdido.
          Recarregue a página; se persistir, informe a referência acima.
        </p>
      </main>
    );
  }

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

  // ADR-065 — a quarta leitura, computada ANTES das etapas porque o Item 2.3
  // deriva dela os conceitos H11 exigidos: o Motor emite JUIZO_HUMANO
  // exatamente quando o Case declarou grau para o conceito relacional humano.
  const idsElegiveis = view.comparison.map((coluna) => coluna.professionalProfileId);
  const relacional =
    idsElegiveis.length > 0
      ? await crossCaseRelationalForProfessionals(supabase, record.caseId, idsElegiveis)
      : { byProfessional: [], relationalNeedsCount: 0 };
  const relacionalPorId = new Map(
    relacional.byProfessional.map((leitura) => [leitura.professionalProfileId, leitura]),
  );

  // Item 2.3 — a divisão da AVALIAÇÃO: o juízo humano por profissional
  // elegível, lido pela capability (gate-first) e derivado pelo módulo puro.
  const regime = regimeDaAvaliacao(process.env.AVALIACAO_LEGADO_6XN);
  const juizoPorProfissional = await Promise.all(
    idsElegiveis.map(async (professionalProfileId) => {
      const julgamentos = await loadJulgamentosDaAvaliacao(
        supabase,
        record.caseId,
        professionalProfileId,
      );
      const declarados = (relacionalPorId.get(professionalProfileId)?.readings ?? [])
        .filter((reading) => reading.kind === "JUIZO_HUMANO")
        .map((reading) => reading.code);
      return { professionalProfileId, julgamentos, declarados };
    }),
  );
  const julgamentosAguardando = juizoPorProfissional.reduce(
    (total, entrada) => total + lacunasDeJuizo(entrada.julgamentos, entrada.declarados).length,
    0,
  );

  const etapas = buildMesaEtapas({
    profileAcknowledged: view.profileAcknowledged,
    mapPending: mapa.completion.pending,
    professionalsFound: view.counts.found,
    awaitingAreaDeclaration: view.counts.awaiting,
    eligible: view.counts.eligible,
    criteriaAwaiting,
    julgamentosAguardando,
    regimeDaAvaliacao: regime,
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
      // ADR-065 §10.3: as lacunas relacionais entram na mesma contagem de
      // atenção que as assistenciais — a linha de investigação não distingue
      // a leitura de origem, só a pendência.
      criteriosInsuficientes:
        (coluna?.cells.filter((celula) => celula.result === "LACUNA_DE_INFORMACAO").length ?? 0) +
        (relacionalPorId.get(profissional.professionalProfileId)?.summary.lacunas ?? 0),
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
              // FRENTE D3: o parecer da Mesa edita as coleções em textarea —
              // um item por linha, a MESMA serialização (com inversa definida)
              // do editor do Relatório. O `join(" ")` anterior fundia itens
              // por espaço, sem volta, já na exibição.
              limitations: itensParaTextarea(option?.attentionPoints ?? []),
              questions: itensParaTextarea(option?.suggestedQuestions ?? []),
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
      <AbasCompatibilidade
        assistencial={<ComparacaoPremium colunas={colunas} />}
        relacional={
          <LeituraRelacionalPanel
            colunas={relacional.byProfessional.map((leitura) => ({
              ...leitura,
              nome: nomeDe(leitura.professionalProfileId),
            }))}
            relationalNeedsCount={relacional.relationalNeedsCount}
          />
        }
      />
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
    // ETAPA 8 (Release de Reconstrução): a Mesa parava aqui num beco sem
    // saída — sem Perfil aberto não havia como abrir (o componente existia,
    // órfão), e o Mapa ficava atrás do reconhecimento que depende do próprio
    // Mapa. A ordem do Método é: abrir o Perfil → preencher o Mapa na
    // conversa → ela reconhecer no portal dela → a Curadoria Técnica abrir.
    PERFIL: !record.priorityProfileId ? (
      <div className="mesa-bloco">
        <StartPriorityProfile caseId={record.caseId} patientFirstName={record.patientFirstName} />
      </div>
    ) : (
      <div className="space-y-4">
        {!view.profileAcknowledged ? (
          <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
            O Mapa se preenche na conversa com {record.patientFirstName}. Quando estiver completo,
            ela o reconhece no portal dela — e só então a Curadoria Técnica abre. Sem o critério
            dela, qualquer análise seria a Aliviar decidindo com aparência de método.
          </p>
        ) : null}
        <MapaPrioridadesPanel
          caseId={record.caseId}
          groups={groupPriorityMap(mapa.items, catalogo)}
          completion={mapa.completion}
        />
      </div>
    ),

    REDE:
      view.counts.found === 0 ? (
        <RedeVazia />
      ) : (
        <RedeFiltravel view={view} profissionais={profissionais} />
      ),

    // Item 2.3 — a etapa exibe a leitura de elegibilidade E o painel de juízo
    // (H8–H11): evidências por referência, aguardo nomeado, vigente com
    // histórico, ato de registrar/retirar. No regime LEGADO_6XN (flag de
    // rollback, G-2.3-7) a superfície volta a ser somente a antiga.
    AVALIACAO: semElegiveis ? (
      <AvaliacaoSemElegiveis />
    ) : (
      <div className="space-y-6">
        <EligibilityPanel view={view} />
        {regime === "JUIZO" ? (
          <PainelDeJuizo
            caseId={record.caseId}
            profissionais={juizoPorProfissional.map(
              ({ professionalProfileId, julgamentos, declarados }) => {
                const evidencias = evidenceRows.get(professionalProfileId) ?? [];
                const lacunas = lacunasDeJuizo(julgamentos, declarados);
                const lacunaPorCode = new Map(lacunas.map((l) => [l.subcriterionCode, l.motivo]));
                return {
                  professionalProfileId,
                  nome: nomeDe(professionalProfileId),
                  conceitos: conceitosExigidos(declarados).map((exigido): ConceitoDeJuizo => {
                    const cadeia = julgamentos
                      .filter((j) => j.subcriterionCode === exigido.code)
                      .sort((a, b) => a.versao - b.versao);
                    const vigente = julgamentoVigente(julgamentos, exigido.code);
                    const correntes = evidencias.filter((evidencia) =>
                      exigido.natureza === "RELACIONAL"
                        ? evidencia.subcriterionCode === exigido.code
                        : evidencia.subcriterionCode.startsWith(`${exigido.code}_`),
                    );
                    return {
                      code: exigido.code,
                      label:
                        exigido.natureza === "TECNICO"
                          ? (CRITERION_LABELS[exigido.code as keyof typeof CRITERION_LABELS] ??
                            exigido.code)
                          : (RELATIONAL_CONCEPTS_BY_CODE.get(exigido.code)?.name ?? exigido.code),
                      natureza: exigido.natureza,
                      lacuna: vigente ? null : (lacunaPorCode.get(exigido.code) ?? "SEM_JUIZO"),
                      vigente,
                      historico: cadeia.filter((j) => j.state !== "VIGENTE"),
                      evidenciasCorrentes: correntes.map((evidencia) => ({
                        id: evidencia.id,
                        version: evidencia.version,
                        subcriterionCode: evidencia.subcriterionCode,
                        status: evidencia.status,
                        resumo: evidencia.subcriterionCode,
                      })),
                      versaoBaseId: cadeia.length > 0 ? cadeia[cadeia.length - 1].id : null,
                    };
                  }),
                };
              },
            )}
          />
        ) : null}
      </div>
    ),

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
