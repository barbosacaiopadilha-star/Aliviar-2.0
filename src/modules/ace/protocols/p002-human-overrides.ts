// Correções humanas sobre classificação P002 — precedência sobre inferência de IA.
// Decisão humana validada > dado explícito do paciente > dado estruturado > inferência IA.

import type { MissingInformation } from "@/modules/ace/artifacts/decision-case";
import type { Narrative } from "@/modules/ace/artifacts/narrative";
import type { EstadoInformacao } from "@/modules/ace/core/information-state";
import { estadoGeraPendencia } from "@/modules/ace/core/information-state";
import {
  classifyP002FieldState,
  detectAllFieldsFromDescription,
  type P002CompletenessFieldId,
} from "@/modules/ace/protocols/p002-completeness";

export type P002HumanFieldCorrection = {
  field: P002CompletenessFieldId;
  estado: EstadoInformacao;
  motivo: string;
  corrigidoPor: string;
  corrigidoEm: string;
  valorAnterior?: EstadoInformacao;
};

export type P002HumanOverrideStore = {
  executionId: string;
  corrections: P002HumanFieldCorrection[];
};

/** Precedência: correção humana mais recente vence inferência determinística. */
export function resolveFieldStateWithOverrides(
  field: P002CompletenessFieldId,
  inferredState: EstadoInformacao,
  overrides: P002HumanFieldCorrection[],
): EstadoInformacao {
  const human = [...overrides]
    .filter((entry) => entry.field === field)
    .sort((a, b) => b.corrigidoEm.localeCompare(a.corrigidoEm))[0];

  return human?.estado ?? inferredState;
}

export function applyHumanCorrection(
  store: P002HumanOverrideStore,
  correction: Omit<P002HumanFieldCorrection, "corrigidoEm"> & { corrigidoEm?: string },
): P002HumanOverrideStore {
  const entry: P002HumanFieldCorrection = {
    ...correction,
    corrigidoEm: correction.corrigidoEm ?? new Date().toISOString(),
  };

  return {
    ...store,
    corrections: [...store.corrections.filter((c) => c.field !== entry.field), entry],
  };
}

/** Regeneração não pode apagar correção humana sem ação explícita. */
export function mergeRegeneratedWithHumanOverrides(
  regeneratedStates: Map<P002CompletenessFieldId, EstadoInformacao>,
  overrides: P002HumanFieldCorrection[],
): Map<P002CompletenessFieldId, EstadoInformacao> {
  const merged = new Map(regeneratedStates);
  for (const correction of overrides) {
    merged.set(correction.field, correction.estado);
  }
  return merged;
}

/** Reaplica correções humanas ao DecisionCase exibido — não altera artefato persistido. */
export function applyHumanCorrectionsToMissingInformation(
  narrative: Narrative,
  missingInformation: MissingInformation[],
  overrides: P002HumanFieldCorrection[],
): MissingInformation[] {
  if (overrides.length === 0) return missingInformation;

  return missingInformation.filter((entry) => {
    if (entry.relatedField === "decision" || entry.relatedField === "goal") {
      return true;
    }

    const fields = detectAllFieldsFromDescription(entry.description);
    if (fields.length === 0) return true;

    return fields.some((field) => {
      const inferred = classifyP002FieldState(field, narrative);
      const resolved = resolveFieldStateWithOverrides(field, inferred, overrides);
      return estadoGeraPendencia(resolved);
    });
  });
}
