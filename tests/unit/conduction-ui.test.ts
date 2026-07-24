import { describe, expect, it } from "vitest";

import { conduct } from "@/modules/curadoria/cos/conduction";
import {
  buildPendingActionItems,
  getPrimaryActionLabel,
  isPhaseNavigable,
  PHASE_ACTION_LABELS,
  phaseHref,
} from "@/modules/curadoria/cos/conduction-ui";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import type { PhaseStatus } from "@/modules/curadoria/cos/types";

const marina = MOCK_RECORDS["caso-2041"]!;
const rosa = MOCK_RECORDS["caso-2024"]!;

describe("conduction-ui — rotas e rótulos", () => {
  it("gera href canônico por fase", () => {
    expect(phaseHref("abc", "HISTORIA")).toBe("/coa/curadoria/casos/abc/historia");
    expect(phaseHref("abc", "CURADORIA_TECNICA")).toBe(
      "/coa/curadoria/casos/abc/curadoria_tecnica",
    );
  });

  it("nunca usa rótulo genérico Continuar", () => {
    for (const label of Object.values(PHASE_ACTION_LABELS)) {
      expect(label.toLowerCase()).not.toBe("continuar");
    }
  });

  it("descreve ação específica no botão principal", () => {
    const state = conduct(marina);
    const label = getPrimaryActionLabel(state);
    expect(label).toBe("Distribuir Prioridades");
    expect(label.toLowerCase()).not.toContain("continuar");
  });

  it("bloqueio usa rótulo de resolução na fase correta", () => {
    const joaquim = MOCK_RECORDS["caso-2038"]!;
    const semElegiveis = {
      ...joaquim,
      curadoriaTecnica: {
        ...joaquim.curadoriaTecnica,
        analyses: [joaquim.curadoriaTecnica.analyses[0]!],
      },
    };
    const label = getPrimaryActionLabel(conduct(semElegiveis));
    expect(label).toContain("Resolver em");
    expect(label).toContain("Curadoria Técnica");
  });
});

describe("conduction-ui — navegabilidade de fases", () => {
  it("só BLOQUEADA não é navegável", () => {
    const navigable: PhaseStatus[] = ["CONCLUIDA", "EM_ANDAMENTO", "DISPONIVEL", "AGUARDANDO"];
    for (const status of navigable) {
      expect(isPhaseNavigable(status)).toBe(true);
    }
    expect(isPhaseNavigable("BLOQUEADA")).toBe(false);
  });
});

describe("conduction-ui — action links de pendências", () => {
  it("transforma itens faltantes em links clicáveis", () => {
    const state = conduct(marina);
    const items = buildPendingActionItems(state, marina.caseId);
    const missing = items.filter((item) => item.kind === "missing");
    expect(missing.length).toBeGreaterThan(0);
    for (const item of missing) {
      expect(item.href).toBeTruthy();
      expect(item.href).toContain(marina.caseId);
    }
  });

  it("pendência do paciente não é clicável", () => {
    const state = conduct(rosa);
    const items = buildPendingActionItems(state, rosa.caseId);
    const patientItems = items.filter((item) => item.owner === "PACIENTE");
    expect(patientItems.length).toBeGreaterThan(0);
    for (const item of patientItems) {
      expect(item.href).toBeNull();
    }
  });

  it("inconsistências apontam para a fase correta", () => {
    const state = conduct(marina);
    const items = buildPendingActionItems(state, marina.caseId);
    const inconsistencies = items.filter((item) => item.kind === "inconsistency");
    expect(inconsistencies.length).toBeGreaterThan(0);
    for (const item of inconsistencies) {
      expect(item.href).toContain("/prioridades");
    }
  });

  it("não duplica itens idênticos", () => {
    const state = conduct(marina);
    const items = buildPendingActionItems(state, marina.caseId);
    const keys = items.map((item) => `${item.kind}-${item.phase}-${item.description}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
