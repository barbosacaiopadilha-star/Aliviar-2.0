// Referência genérica de proveniência entre artefatos — cada artefato
// parametriza com seu próprio union de tipos de origem válidos, evitando
// redefinir a mesma forma em cada arquivo (ADR-012, docs/DECISIONS.md).

import type { ArtifactId } from "./artifact-contract";

export type ArtifactReference<TType extends string> = {
  artifactId: ArtifactId;
  artifactVersion: number;
  artifactType: TType;
};
