import type { PublicationOutcome } from "@/alicia/protocol-engine";

import type {
  ChangeClassification,
  ChangeDetectionResult,
  VerificationDecision,
  VerificationDecisionOutcome,
} from "./types";

export function decideVerification(
  change: ChangeDetectionResult,
  protocolOutcome: PublicationOutcome,
): VerificationDecision {
  if (change.classification === "CONFLICT") {
    return {
      outcome: "UNPUBLISH_RECOMMENDED",
      classification: change.classification,
      protocolOutcome,
      justification: "Conflito detectado entre versão publicada e fontes atuais.",
    };
  }

  if (protocolOutcome === "REJECT") {
    return {
      outcome: "UNPUBLISH_RECOMMENDED",
      classification: change.classification,
      protocolOutcome,
      justification: "Protocol Engine rejeitou o perfil na revalidação.",
    };
  }

  if (change.classification === "NO_CHANGE" && protocolOutcome === "AUTO_PUBLISH") {
    return {
      outcome: "VERIFIED",
      classification: change.classification,
      protocolOutcome,
      justification: "Perfil permanece compatível com o Protocolo.",
    };
  }

  if (change.classification === "MATERIAL_CHANGE") {
    if (protocolOutcome === "AUTO_PUBLISH") {
      return {
        outcome: "UPDATE_REQUIRED",
        classification: change.classification,
        protocolOutcome,
        justification: "Mudança material detectada — atualização recomendada.",
      };
    }

    return {
      outcome: "REVIEW_REQUIRED",
      classification: change.classification,
      protocolOutcome,
      justification: "Mudança material requer revisão humana.",
    };
  }

  if (change.classification === "MINOR_CHANGE") {
    if (protocolOutcome === "HUMAN_REVIEW") {
      return {
        outcome: "REVIEW_REQUIRED",
        classification: change.classification,
        protocolOutcome,
        justification: "Mudança leve com pendências do Protocolo.",
      };
    }

    return {
      outcome: "VERIFIED",
      classification: change.classification,
      protocolOutcome,
      justification: "Mudança leve dentro dos limites aceitáveis.",
    };
  }

  if (protocolOutcome === "HUMAN_REVIEW") {
    return {
      outcome: "REVIEW_REQUIRED",
      classification: change.classification,
      protocolOutcome,
      justification: "Protocol Engine exige revisão humana.",
    };
  }

  return {
    outcome: "VERIFIED",
    classification: change.classification,
    protocolOutcome,
    justification: "Revalidação concluída sem ação obrigatória.",
  };
}

export function isReviewRequired(decision: VerificationDecisionOutcome): boolean {
  return decision === "REVIEW_REQUIRED" || decision === "UNPUBLISH_RECOMMENDED";
}

export function isUpdateRequired(decision: VerificationDecisionOutcome): boolean {
  return decision === "UPDATE_REQUIRED";
}

export function requiresPublication(
  decision: VerificationDecisionOutcome,
  classification: ChangeClassification,
): boolean {
  return decision === "UPDATE_REQUIRED" && classification === "MATERIAL_CHANGE";
}
