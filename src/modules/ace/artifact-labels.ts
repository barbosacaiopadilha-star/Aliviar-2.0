/**
 * Rótulos humanizados dos artefatos ACE — linguagem do Curador, não do protocolo.
 */
export const ACE_PROTOCOL_LABELS: Record<string, string> = {
  P001: "Organização da história",
  P002: "Estruturação do caso",
  P003: "Verificação",
  P004: "Modelagem do contexto",
  P005: "Competências",
  P006: "Elegibilidade",
  P007: "Compatibilidade",
  P008: "Seleção final",
  P009: "Revisão humana",
  P010: "Entrega",
};

export const ACE_ARTIFACT_LABELS: Record<string, string> = {
  Narrative: "História organizada",
  DecisionCase: "Caso de decisão",
  CaseAudit: "Auditoria do caso",
  DecisionContext: "Contexto da decisão",
  CompetencyProfile: "Perfil de competência",
  EligibleProviderSet: "Profissionais elegíveis",
  CompatibilityMatrix: "Matriz de compatibilidade",
  Shortlist: "Lista final",
};

export function humanizeArtifactType(artifactType: string): string {
  return ACE_ARTIFACT_LABELS[artifactType] ?? artifactType;
}

export function humanizeProtocolId(protocolId: string): string {
  return ACE_PROTOCOL_LABELS[protocolId] ?? protocolId;
}
