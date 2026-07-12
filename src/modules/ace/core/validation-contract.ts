// Contrato de validação — usado antes de aceitar a saída de um protocolo
// como final (docs/ace/06-governance/governance.md, seção 5).

import type { Artifact } from "./artifact-contract";

export type ValidationIssue = {
  field: string;
  message: string;
};

export type ValidationResult = { valid: true } | { valid: false; issues: ValidationIssue[] };

export interface Validator<TArtifact extends Artifact> {
  validate(artifact: TArtifact): ValidationResult;
}
