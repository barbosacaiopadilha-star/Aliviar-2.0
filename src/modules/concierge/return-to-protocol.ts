/**
 * Retorno a estágio anterior (P009 returnToProtocol) — invalidação de artefatos
 * downstream e ponto de retomada do pipeline ACE.
 *
 * Artefatos são imutáveis; a invalidação é lógica — o orquestrador deixa de
 * reaproveitar artefatos a partir do protocolo de retorno.
 */

import type { ProtocolId } from "@/modules/ace/core/protocol-id";

import type { AceArtifactType } from "./types";

/** Ordem canônica do pipeline P001–P008. */
export const ACE_PIPELINE_PROTOCOLS = [
  "P001",
  "P002",
  "P003",
  "P004",
  "P005",
  "P006",
  "P007",
  "P008",
] as const satisfies readonly ProtocolId[];

export type AcePipelineProtocol = (typeof ACE_PIPELINE_PROTOCOLS)[number];

const PROTOCOL_TO_ARTIFACT: Record<AcePipelineProtocol, AceArtifactType> = {
  P001: "Narrative",
  P002: "DecisionCase",
  P003: "CaseAudit",
  P004: "DecisionContext",
  P005: "CompetencyProfile",
  P006: "EligibleProviderSet",
  P007: "CompatibilityMatrix",
  P008: "Shortlist",
};

const PROTOCOL_INDEX = new Map<ProtocolId, number>(
  ACE_PIPELINE_PROTOCOLS.map((protocol, index) => [protocol, index]),
);

/** Verdadeiro quando `protocol` é o retorno ou qualquer estágio posterior. */
export function isProtocolAtOrAfterReturnPoint(
  protocol: ProtocolId,
  returnPoint: ProtocolId,
): boolean {
  const protocolIndex = PROTOCOL_INDEX.get(protocol);
  const returnIndex = PROTOCOL_INDEX.get(returnPoint);
  if (protocolIndex === undefined || returnIndex === undefined) return false;
  return protocolIndex >= returnIndex;
}

/** Tipos de artefato que devem ser recalculados após um retorno. */
export function getArtifactTypesToInvalidate(returnPoint: ProtocolId): AceArtifactType[] {
  const returnIndex = PROTOCOL_INDEX.get(returnPoint);
  if (returnIndex === undefined) return [];

  return ACE_PIPELINE_PROTOCOLS.slice(returnIndex).map((protocol) => PROTOCOL_TO_ARTIFACT[protocol]);
}

export function artifactTypeForProtocol(protocol: ProtocolId): AceArtifactType | null {
  if (protocol in PROTOCOL_TO_ARTIFACT) {
    return PROTOCOL_TO_ARTIFACT[protocol as AcePipelineProtocol];
  }
  return null;
}
