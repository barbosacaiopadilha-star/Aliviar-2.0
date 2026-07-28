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

import { CRITERIA_REQUIRING_TARGET, PRIORITY_CRITERION_LABELS, type PriorityCriterion } from "../types";
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

/**
 * Um mesmo aspecto nunca é Critério e Restrição no mesmo Perfil
 * (Ontologia, Invariante 24). Este mapa é o que torna a regra verificável.
 */
const CRITERION_TO_FILTER_KIND: Partial<Record<PriorityCriterion, string>> = {
  AREA_DE_ATUACAO: "AREA_DE_ATUACAO",
  LOCALIZACAO: "UF",
  CONTINUIDADE: "CUIDADO_CONTINUO",
  DISPONIBILIDADE: "DISPONIBILIDADE_IMEDIATA",
};

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
  const { weights } = record.prioridades;

  // I-01 só é inconsistência depois da validação. Antes disso, "faltam 15
  // pontos" é o trabalho em andamento, e já aparece como critério de saída da
  // fase — repetir como inconsistência seria ruído, não copiloto.
  const total = weights.reduce((sum, weight) => sum + weight.weight, 0);
  if (record.validacao && total !== 100) {
    found.push({
      code: "I-01",
      phase: "PRIORIDADES",
      description: `A distribuição de um Perfil validado soma ${total} pontos — precisa fechar em exatamente 100.`,
    });
  }

  for (const weight of weights) {
    if (!weight.evidence.trim()) {
      found.push({
        code: "I-02",
        phase: "PRIORIDADES",
        description: `O peso de ${PRIORITY_CRITERION_LABELS[weight.criterion]} está sem evidência.`,
      });
    }

    const filterKind = CRITERION_TO_FILTER_KIND[weight.criterion];
    if (filterKind && record.filtros.some((filtro) => filtro.kind === filterKind)) {
      found.push({
        code: "I-03",
        phase: "PRIORIDADES",
        description: `${PRIORITY_CRITERION_LABELS[weight.criterion]} está como filtro obrigatório e como critério com peso ao mesmo tempo. Ou elimina, ou pesa.`,
      });
    }

    if (CRITERIA_REQUIRING_TARGET.includes(weight.criterion) && !weight.targetValue) {
      found.push({
        code: "I-04",
        phase: "PRIORIDADES",
        description: `${PRIORITY_CRITERION_LABELS[weight.criterion]} precisa de um alvo declarado pelo paciente.`,
      });
    }
  }

  const seen = new Set<PriorityCriterion>();
  for (const weight of weights) {
    if (seen.has(weight.criterion)) {
      found.push({
        code: "I-05",
        phase: "PRIORIDADES",
        description: `O critério ${PRIORITY_CRITERION_LABELS[weight.criterion]} aparece mais de uma vez.`,
      });
    }
    seen.add(weight.criterion);
  }

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

    const analysedIds = new Set(record.curadoriaTecnica.analyses.map((entry) => entry.professionalId));
    for (const id of selected) {
      if (!analysedIds.has(id)) {
        found.push({
          code: "I-11",
          phase: "CURADORIA_TECNICA",
          description: "Uma opção selecionada não tem análise de compatibilidade que a fundamente.",
        });
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
  const { analyses, computedAt } = record.curadoriaTecnica;

  if (!computedAt) {
    return found;
  }

  if (analyses.length === 0) {
    found.push({
      code: "E-01",
      phase: "CURADORIA_TECNICA",
      title: "Nenhum profissional passou pelos filtros",
      detail: `Os ${record.filtros.length} filtros obrigatórios eliminaram todo o universo. Nenhuma restrição é afrouxada sem conversar com ${record.patientFirstName}.`,
      severity: "bloqueio",
    });
    return found;
  }

  if (analyses.length < 3) {
    found.push({
      code: "E-02",
      phase: "CURADORIA_TECNICA",
      title: "Menos de três opções elegíveis",
      detail: `${analyses.length} ${analyses.length === 1 ? "profissional atende" : "profissionais atendem"} a todas as restrições. A Curadoria apresenta sempre três — rever as restrições é uma conversa com ${record.patientFirstName}, nunca um ajuste do sistema.`,
      severity: "bloqueio",
    });
  }

  // C-01 — empate. O Motor não desempata: mostra os equivalentes e para.
  const ordered = [...analyses].sort((a, b) => b.internalScore - a.internalScore);
  const thirdScore = ordered[2]?.internalScore;
  if (thirdScore !== undefined) {
    const equivalents = ordered.filter((entry) => Math.abs(entry.internalScore - thirdScore) < 3);
    if (equivalents.length > 1 && ordered.length > 3) {
      found.push({
        code: "C-01",
        phase: "CURADORIA_TECNICA",
        title: `${equivalents.length} opções equivalentes`,
        detail: `Ficaram a menos de 3 pontos de diferença sob os critérios de ${record.patientFirstName}. O Motor não desempata — a composição é sua.`,
        severity: "atencao",
      });
    }
  }

  if (analyses.length > 0 && analyses.every((entry) => entry.band === "MODERADA")) {
    found.push({
      code: "C-05",
      phase: "CURADORIA_TECNICA",
      title: "Nenhuma opção acima de Moderada",
      detail:
        "A faixa não é relativizada para parecer melhor. Vale conversar com franqueza na devolutiva sobre o que o universo aprovado oferece hoje.",
      severity: "atencao",
    });
  }

  // ADR-042 — o alerta deixou de contar pontos e passou a contar o que falta
  // descobrir. Ele organiza a investigação; nunca bloqueia a navegação.
  const semDados = analyses.reduce(
    (sum, entry) => sum + entry.criteria.filter((c) => c.alignment === null).length,
    0,
  );
  if (semDados > 0) {
    found.push({
      code: "C-06",
      phase: "CURADORIA_TECNICA",
      title: "Lacunas de informação no cadastro",
      detail:
        "Existem lacunas de informação que precisam ser conferidas: o Mapa do Profissional está incompleto para itens que este caso considera relevantes. A análise é honesta, mas menos informativa.",
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
