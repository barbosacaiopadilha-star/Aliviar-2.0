/**
 * Motor de Condução — o cérebro operacional do COS.
 *
 * Lê a Memória da Curadoria e responde, a qualquer momento, as cinco perguntas
 * que o Curador nunca deveria precisar responder de cabeça:
 *
 *   Onde estou? · O que já foi concluído? · O que falta? ·
 *   Qual é o próximo passo? · Existe inconsistência ou pendência?
 *
 * Lei que governa este arquivo: **o Portal conduz o Método; o Curador conduz o
 * paciente.** O Motor de Condução nunca avança uma fase sozinho, nunca decide
 * por ele e nunca o impede de voltar. Ele informa — e informar é o oposto de
 * controlar.
 *
 * Puro e determinístico: sem banco, sem rede, sem data do sistema. A mesma
 * Memória sempre produz a mesma condução.
 */

import { COS_PHASE_DEFINITIONS, COS_PHASE_ORDER } from "./phases";
import {
  COS_PHASE_LABELS,
  type ConductionAlert,
  type ConductionInconsistency,
  type ConductionPendency,
  type ConductionState,
  type CosPhaseId,
  type CuradoriaRecord,
  type PhaseState,
  type PhaseStatus,
} from "./types";

/** Fases cuja conclusão depende de um ato de outra pessoa, não do Curador. */
const WAITS_ON_PATIENT: CosPhaseId[] = ["VALIDACAO", "DEVOLUTIVA"];

// ---------------------------------------------------------------------------
// Estado de cada fase
// ---------------------------------------------------------------------------

function evaluatePhase(phase: CosPhaseId, record: CuradoriaRecord): PhaseState {
  const definition = COS_PHASE_DEFINITIONS[phase];

  const unmetExit = definition.exitCriteria.filter((criterion) => !criterion.isMet(record));
  const unmetEntry = definition.entryCriteria.filter((criterion) => !criterion.isMet(record));
  const missing = unmetExit.map((criterion) => criterion.description);

  if (unmetExit.length === 0) {
    return {
      phase,
      status: "CONCLUIDA",
      reason: "Todos os critérios de saída foram atendidos.",
      missing: [],
    };
  }

  if (unmetEntry.length > 0) {
    return {
      phase,
      status: "BLOQUEADA",
      reason: unmetEntry[0]?.description ?? "Uma fase anterior ainda não foi concluída.",
      missing,
    };
  }

  const started = unmetExit.length < definition.exitCriteria.length;
  const status: PhaseStatus = WAITS_ON_PATIENT.includes(phase)
    ? "AGUARDANDO"
    : started
      ? "EM_ANDAMENTO"
      : "DISPONIVEL";

  const reason =
    status === "AGUARDANDO"
      ? "Depende de um ato do paciente — o Curador acompanha, não decide por ele."
      : started
        ? "Em andamento."
        : "Pronta para começar.";

  return { phase, status, reason, missing };
}

// ---------------------------------------------------------------------------
// Inconsistências (Engine §4.4) — o Motor rejeita, nunca corrige
// ---------------------------------------------------------------------------

export function detectInconsistencies(record: CuradoriaRecord): ConductionInconsistency[] {
  const found: ConductionInconsistency[] = [];

  // M3 (ADR-042): as inconsistências do modelo de pesos (I-01 a I-05)
  // deixaram de existir junto com o modelo. Policiar a soma de 100 pontos num
  // domínio que não soma seria manter o motor antigo vivo como fiscal.

  const selected = record.curadoriaTecnica.selectedProfessionalIds;
  if (selected.length > 0) {
    if (selected.length !== 3) {
      found.push({
        code: "I-09",
        phase: "CURADORIA_TECNICA",
        description: `Há ${selected.length} profissionais selecionados — a Curadoria apresenta sempre exatamente três.`,
      });
    }

    if (new Set(selected).size !== selected.length) {
      found.push({
        code: "I-10",
        phase: "CURADORIA_TECNICA",
        description: "O mesmo profissional foi selecionado mais de uma vez.",
      });
    }

    // M3: a fundamentação vigente é a elegibilidade da Mesa, não a análise do
    // motor antigo. Só vale para Curadoria em curso — numa entrega já feita, a
    // Rede pode ter mudado depois, e isso é história, não inconsistência.
    if (!record.relatorio.deliveredAt) {
      const elegiveis = new Set(record.curadoriaTecnica.leituras.map((entry) => entry.professionalId));
      for (const id of selected) {
        if (!elegiveis.has(id)) {
          found.push({
            code: "I-11",
            phase: "CURADORIA_TECNICA",
            description: "Uma opção selecionada não consta entre os elegíveis da Mesa deste Case.",
          });
        }
      }
    }

    if (!record.curadoriaTecnica.selectedBy) {
      found.push({
        code: "I-12",
        phase: "CURADORIA_TECNICA",
        description: "A seleção está sem autor humano registrado.",
      });
    }
  }

  return found;
}

// ---------------------------------------------------------------------------
// Alertas (Engine §4.5 e §9) — o Motor nomeia, quantifica e para
// ---------------------------------------------------------------------------

export function detectAlerts(record: CuradoriaRecord): ConductionAlert[] {
  const found: ConductionAlert[] = [];
  const { elegibilidade, leituras } = record.curadoriaTecnica;

  // M3 (ADR-042): os alertas da Curadoria Técnica leem a MESMA fonte da Mesa
  // — elegibilidade (área + filtros) e leitura do Motor. Antes do
  // reconhecimento e do Mapa completo, o que existe é trabalho em andamento,
  // não achado; e enquanto houver área por declarar, "poucos elegíveis" é
  // tarefa do Curador, não alerta.
  //
  // C-01 (equivalência por pontos de score) e C-05 (bandas) deixaram de
  // existir: os conceitos que eles mediam não existem no Método vigente, e
  // nenhuma regra normativa os substitui. Nada foi inventado no lugar.
  if (!record.validacao) return found;
  if (record.prioridades.mapaPendentes > 0) return found;
  if (elegibilidade.awaitingArea > 0) return found;

  if (elegibilidade.eligible === 0) {
    found.push({
      code: "E-01",
      phase: "CURADORIA_TECNICA",
      title: "Nenhum profissional elegível",
      detail: `A área e os filtros deste Case não deixaram ninguém elegível: ${elegibilidade.eliminated} eliminado${elegibilidade.eliminated === 1 ? "" : "s"} e ${elegibilidade.pendingInfo} pendente${elegibilidade.pendingInfo === 1 ? "" : "s"} de verificação. Nenhuma restrição é afrouxada sem conversar com ${record.patientFirstName}.`,
      severity: "bloqueio",
    });
    return found;
  }

  if (elegibilidade.eligible < 3) {
    found.push({
      code: "E-02",
      phase: "CURADORIA_TECNICA",
      title: "Menos de três opções elegíveis",
      detail: `${elegibilidade.eligible} ${elegibilidade.eligible === 1 ? "profissional elegível" : "profissionais elegíveis"} pela Mesa. A Curadoria apresenta sempre três — rever as restrições é uma conversa com ${record.patientFirstName}, nunca um ajuste do sistema.`,
      severity: "bloqueio",
    });
  }

  // C-06 — lacunas reais do Mapa do Profissional, na fonte real (ADR-040/041):
  // item que ninguém tratou é diferente de item analisado sem informação, e
  // subcritério não declarado pelo Case não é lacuna de profissional nenhum
  // (com o Mapa completo, ele nem entra aqui). O alerta organiza a
  // investigação; nunca bloqueia a navegação.
  const semRegistro = leituras.reduce((sum, leitura) => sum + leitura.gapsWithoutAnyRecord, 0);
  const semInformacao = leituras.reduce(
    (sum, leitura) => sum + (leitura.informationGaps - leitura.gapsWithoutAnyRecord),
    0,
  );

  if (semRegistro + semInformacao > 0) {
    const partes = [
      semRegistro > 0
        ? `${semRegistro} subcritério${semRegistro === 1 ? "" : "s"} ainda não avaliado${semRegistro === 1 ? "" : "s"} no Mapa do Profissional`
        : null,
      semInformacao > 0
        ? `${semInformacao} analisado${semInformacao === 1 ? "" : "s"} sem informação suficiente`
        : null,
    ].filter((parte): parte is string => parte !== null);

    found.push({
      code: "C-06",
      phase: "CURADORIA_TECNICA",
      title: "Lacunas de informação no Mapa do Profissional",
      detail: `Entre os itens que este Case declarou relevantes: ${partes.join(" e ")}. A leitura é honesta, mas menos informativa — completar é trabalho da operação, nunca penalidade do profissional.`,
      severity: "atencao",
    });
  }

  return found;
}

// ---------------------------------------------------------------------------
// Pendências — sempre com dono nomeado
// ---------------------------------------------------------------------------

export function detectPendencies(record: CuradoriaRecord, phases: PhaseState[]): ConductionPendency[] {
  const pendencies: ConductionPendency[] = [];

  for (const state of phases) {
    if (state.status === "AGUARDANDO") {
      pendencies.push({
        owner: "PACIENTE",
        phase: state.phase,
        description:
          state.phase === "VALIDACAO"
            ? `${record.patientFirstName} precisa reconhecer o Perfil como dele.`
            : `${record.patientFirstName} está decidindo entre as três opções.`,
      });
    }

  }

  // Nenhuma pendência é criada para a fase atual do Curador: "o que falta" já
  // responde isso. Repetir a mesma frase em duas seções é ruído, e ruído em um
  // copiloto é pior do que silêncio.

  for (const pendency of record.acolhimento.openPendencies) {
    pendencies.push({ owner: "EQUIPE", phase: "ACOLHIMENTO", description: pendency });
  }

  return pendencies;
}

// ---------------------------------------------------------------------------
// Condução
// ---------------------------------------------------------------------------

export function conduct(record: CuradoriaRecord): ConductionState {
  const phases = COS_PHASE_ORDER.map((phase) => evaluatePhase(phase, record));

  const completedPhases = phases
    .filter((state) => state.status === "CONCLUIDA")
    .map((state) => state.phase);

  // A fase atual é a primeira ainda não concluída — nunca a mais avançada que
  // tenha algum dado. Voltar a uma fase anterior é legítimo no Método, então a
  // condução acompanha o trabalho real, não o ponto mais distante já alcançado.
  const currentState = phases.find((state) => state.status !== "CONCLUIDA") ?? phases[phases.length - 1]!;
  const currentPhase = currentState.phase;
  const definition = COS_PHASE_DEFINITIONS[currentPhase];

  const alerts = detectAlerts(record);
  const blockingAlert = alerts.find((alert) => alert.severity === "bloqueio");

  const nextStep = blockingAlert
    ? {
        phase: blockingAlert.phase,
        label: blockingAlert.title,
        description: blockingAlert.detail,
        kind: "acao" as const,
      }
    : {
        phase: currentPhase,
        label:
          currentState.status === "AGUARDANDO"
            ? `Acompanhar ${COS_PHASE_LABELS[currentPhase]} — sem cobrar`
            : `${COS_PHASE_LABELS[currentPhase]}`,
        description: currentState.missing[0] ?? definition.objective,
        kind: currentState.status === "AGUARDANDO" ? ("aguardando" as const) : ("acao" as const),
      };

  return {
    currentPhase,
    currentReasoningStep: definition.reasoningStep,
    completedPhases,
    phases,
    nextStep,
    missing: currentState.missing,
    inconsistencies: detectInconsistencies(record),
    pendencies: detectPendencies(record, phases),
    alerts,
  };
}
