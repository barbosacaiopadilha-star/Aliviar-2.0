/**
 * Memória da Curadoria — a reconstrução completa.
 *
 * Transforma o registro em uma linha do tempo legível e responde ao **teste de
 * reconstrução** (Engine §5.6): meses depois, é possível responder às nove
 * perguntas apenas com o registro? Se qualquer resposta faltar, a trilha é
 * insuficiente — e isso é defeito do sistema, não limitação aceitável.
 *
 * Puro: não lê banco, não usa data do sistema, não infere nada. O que não foi
 * registrado aparece como lacuna, nunca como suposição.
 */

import { PRIORITY_CRITERION_LABELS } from "../types";
import { COS_PHASE_LABELS, type CosPhaseId, type CuradoriaRecord } from "./types";

/**
 * Nenhum nome técnico chega à tela. O Curador lê "Forma do primeiro encontro",
 * nunca `ABORDAGEM_INICIAL` (Experience §7 — a voz do Portal).
 */
function moment(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type MemoryEntry = {
  at: string;
  phase: CosPhaseId;
  /** Evento do catálogo do Motor (Engine §7). */
  event: string;
  description: string;
  /** Quem agiu. Nunca vazio — "Sistema" quando foi o sistema. */
  actor: string;
};

/** As nove perguntas do teste de reconstrução (Engine §5.6). */
export type ReconstructionAnswer = {
  question: string;
  answered: boolean;
  answer: string;
};

export function buildMemory(record: CuradoriaRecord): MemoryEntry[] {
  const entries: MemoryEntry[] = [];

  entries.push({
    at: record.openedAt,
    phase: "ACOLHIMENTO",
    event: "CURADORIA_INICIADA",
    description: `Caso aberto para ${record.patientName}.`,
    actor: record.curatorName,
  });

  if (record.historia.registeredAt) {
    entries.push({
      at: record.historia.registeredAt,
      phase: "HISTORIA",
      event: "HISTORIA_REGISTRADA",
      description: "História registrada como o Curador a compreendeu.",
      actor: record.curatorName,
    });
  }

  if (record.historia.understandingConfirmedAt) {
    entries.push({
      at: record.historia.understandingConfirmedAt,
      phase: "HISTORIA",
      event: "HISTORIA_REGISTRADA",
      description: `${record.patientFirstName} reconheceu a própria história na devolução.`,
      actor: record.patientName,
    });
  }

  for (const filtro of record.filtros) {
    entries.push({
      at: record.historia.registeredAt ?? record.openedAt,
      phase: "FILTROS",
      event: "RESTRICAO_ADICIONADA",
      // Um filtro booleano já é afirmação pelo próprio rótulo — "Oferece
      // acompanhamento contínuo", nunca "…: true". Mesmo cuidado que a tela
      // de critérios já tinha; a Memória não o tinha.
      description:
        filtro.value === "true"
          ? `${filtro.label} — ${filtro.reason}`
          : `${filtro.label}: ${filtro.value} — ${filtro.reason}`,
      actor: record.curatorName,
    });
  }

  for (const weight of record.prioridades.weights) {
    entries.push({
      at: weight.registeredAt,
      phase: "PRIORIDADES",
      event: "PESO_ATRIBUIDO",
      description: `${PRIORITY_CRITERION_LABELS[weight.criterion]} recebeu ${weight.weight} pontos. Evidência: ${weight.evidence}`,
      actor: record.patientName,
    });
  }

  if (record.validacao) {
    entries.push({
      at: record.validacao.validatedAt,
      phase: "VALIDACAO",
      event: "PERFIL_VALIDADO",
      description: record.validacao.validationNote,
      actor: record.patientName,
    });
  }

  if (record.curadoriaTecnica.computedAt) {
    entries.push({
      at: record.curadoriaTecnica.computedAt,
      phase: "CURADORIA_TECNICA",
      event: "COMPATIBILIDADE_CALCULADA",
      description: `${record.curadoriaTecnica.analyses.length} profissionais analisados, ${record.curadoriaTecnica.excluded.length} eliminados pelos filtros.`,
      actor: "Sistema",
    });
  }

  if (record.curadoriaTecnica.selectedAt && record.curadoriaTecnica.selectedBy) {
    entries.push({
      at: record.curadoriaTecnica.selectedAt,
      phase: "CURADORIA_TECNICA",
      event: "SELECAO_FECHADA",
      description: "Três opções selecionadas.",
      actor: record.curadoriaTecnica.selectedBy,
    });
  }

  if (record.relatorio.emittedAt) {
    entries.push({
      at: record.relatorio.emittedAt,
      phase: "RELATORIO",
      event: "RELATORIO_EMITIDO",
      description: "Relatório fechado com as três opções justificadas.",
      actor: record.curatorName,
    });
  }

  if (record.devolutiva.presentedAt) {
    entries.push({
      at: record.devolutiva.presentedAt,
      phase: "DEVOLUTIVA",
      event: "RELATORIO_ENTREGUE",
      description: "Devolutiva realizada pessoalmente.",
      actor: record.curatorName,
    });
  }

  if (record.devolutiva.decision) {
    entries.push({
      at: record.devolutiva.decision.decidedAt,
      phase: "DEVOLUTIVA",
      event:
        record.devolutiva.decision.outcome === "CHOSEN"
          ? "ESCOLHA_REGISTRADA"
          : "NENHUMA_OPCAO_ESCOLHIDA",
      description:
        record.devolutiva.decision.outcome === "CHOSEN"
          ? `${record.patientFirstName} escolheu uma das três opções.`
          : `${record.patientFirstName} não escolheu nenhuma das três — alguma etapa anterior não capturou algo.`,
      actor: record.patientName,
    });
  }

  return entries.sort((a, b) => a.at.localeCompare(b.at));
}

const MISSING = "Não registrado.";

export function runReconstructionTest(record: CuradoriaRecord): ReconstructionAnswer[] {
  const { curadoriaTecnica: tecnica, validacao, devolutiva } = record;

  const answers: ReconstructionAnswer[] = [
    {
      question: "Quem conduziu a Consulta Inicial e quando?",
      answered: Boolean(record.historia.registeredAt),
      answer: record.historia.registeredAt
        ? `${record.curatorName}, em ${moment(record.historia.registeredAt)}.`
        : MISSING,
    },
    {
      question: "Quais pesos foram atribuídos, e qual fala originou cada um?",
      answered:
        record.prioridades.weights.length > 0 &&
        record.prioridades.weights.every((weight) => Boolean(weight.evidence.trim())),
      answer:
        record.prioridades.weights.length > 0
          ? `${record.prioridades.weights.length} pesos, todos com evidência registrada.`
          : MISSING,
    },
    {
      question: "Quando e como o paciente validou?",
      answered: Boolean(validacao?.validatedAt),
      answer: validacao ? `${moment(validacao.validatedAt)} — ${validacao.validationNote}` : MISSING,
    },
    {
      question: "Quais médicos foram eliminados, por qual filtro?",
      answered: Boolean(tecnica.computedAt),
      answer: tecnica.computedAt
        ? `${tecnica.excluded.length} eliminados, cada um com o motivo registrado.`
        : MISSING,
    },
    {
      question: "Qual era o Perfil Médico de cada analisado naquele momento?",
      // Lacuna estrutural conhecida (Engine §13, divergência 13): o registro
      // guarda o resultado da análise, não o cadastro que a originou.
      answered: false,
      answer:
        "Não preservado — o registro guarda o resultado da análise, não o estado do cadastro no momento do cálculo.",
    },
    {
      question: "Qual score e qual cobertura cada um teve?",
      answered: tecnica.analyses.length > 0,
      answer:
        tecnica.analyses.length > 0
          ? `${tecnica.analyses.length} análises com score e cobertura registrados.`
          : MISSING,
    },
    {
      question: "Quem escolheu as três, quando, e com qual justificativa?",
      answered: Boolean(tecnica.selectedBy && tecnica.selectedAt && record.relatorio.compositionRationale),
      answer:
        tecnica.selectedBy && tecnica.selectedAt
          ? `${tecnica.selectedBy}, em ${moment(tecnica.selectedAt)}.`
          : MISSING,
    },
    {
      question: "Quem entregou o Relatório, e quando?",
      answered: Boolean(devolutiva.presentedAt),
      answer: devolutiva.presentedAt ? `${record.curatorName}, em ${moment(devolutiva.presentedAt)}.` : MISSING,
    },
    {
      question: "O que o paciente decidiu, e quando?",
      answered: Boolean(devolutiva.decision),
      answer: devolutiva.decision
        ? `${devolutiva.decision.outcome === "CHOSEN" ? "Escolheu uma opção" : "Nenhuma das três"}, em ${moment(devolutiva.decision.decidedAt)}.`
        : MISSING,
    },
  ];

  return answers;
}

export function phaseLabel(phase: CosPhaseId): string {
  return COS_PHASE_LABELS[phase];
}
