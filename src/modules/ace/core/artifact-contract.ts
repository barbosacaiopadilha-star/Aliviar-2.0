// Contrato base de todo artefato produzido por um protocolo do ACE.
// Ver docs/ace/06-governance/governance.md, seção 6: "todo protocolo produz
// exatamente um novo artefato".
//
// `producedBy` é sempre estampado pela própria construção do artefato,
// nunca recebido como entrada — cada artefato se autodeclara qual
// protocolo o produziu, fortalecendo rastreabilidade (ADR-012,
// docs/DECISIONS.md).

import type { ProtocolId } from "./protocol-id";

export type ArtifactId = string;

export interface Artifact {
  readonly id: ArtifactId;
  readonly version: number;
  readonly createdAt: string;
  readonly previousVersionId?: ArtifactId;
  readonly producedBy: ProtocolId;
}

// Artefato de Análise — nenhum artefato produzido entre P001 e P008 possui
// valor decisório (Constituição, Princípio 9; Kernel, seção 6). `decisional`
// é sempre `false`, estampado pela própria construção do artefato — nunca
// recebido como entrada de quem chama o construtor.
export interface AnalysisArtifact extends Artifact {
  readonly decisional: false;
}

// Artefato de Decisão Humana — primeira e única categoria de artefato do
// ACE com autoridade institucional real (Constituição, Princípio 9;
// Kernel, seção 6). Distinto de AnalysisArtifact: `decisional` é `true`,
// mas nunca isoladamente — a autoria humana é sempre modelada
// explicitamente aqui, na base, para que nenhum artefato decisório possa
// existir sem registrar quem decidiu e quando. Um artefato concreto (ex.:
// HumanReviewResult, P009) estende este contrato acrescentando qual ação
// foi tomada e com base em quais evidências.
export interface HumanDecisionArtifact extends Artifact {
  readonly decisional: true;
  readonly reviewerId: string;
  readonly reviewedAt: string;
}

// Artefato de Entrega — materializa e comunica uma decisão humana já
// registrada (P010, Sprint 11), sem tomar uma nova decisão e sem
// replicar autoridade decisória: `decisional` é sempre `false`, e a
// proveniência da decisão humana original é preservada na própria base
// (quem validou, quando, e a partir de qual HumanReviewResult) — nunca
// reconstruída ou reinterpretada. Distinto de AnalysisArtifact: um
// DeliveryArtifact não é uma etapa de análise do pipeline, é o produto
// final entregável ao cliente.
export interface DeliveryArtifact extends Artifact {
  readonly decisional: false;
  readonly validatedBy: string;
  readonly validatedAt: string;
  readonly humanReviewReference: {
    readonly artifactId: ArtifactId;
    readonly artifactVersion: number;
    readonly artifactType: "HumanReviewResult";
  };
  readonly methodVersion: string;
}
