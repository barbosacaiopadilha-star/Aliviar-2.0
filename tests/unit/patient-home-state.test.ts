import { describe, expect, it } from "vitest";

import { derivePatientHomeState } from "@/modules/paciente/home-state";

describe("derivePatientHomeState", () => {
  it("sem história: retorna no_story", () => {
    expect(derivePatientHomeState({ storyStatuses: [], caseOverview: null })).toEqual({
      kind: "no_story",
    });
  });

  it("rascunho: retorna draft", () => {
    expect(
      derivePatientHomeState({ storyStatuses: ["rascunho"], caseOverview: null }),
    ).toEqual({ kind: "draft" });
  });

  it("enviada sem Caso: retorna submitted_without_case", () => {
    expect(
      derivePatientHomeState({ storyStatuses: ["enviada"], caseOverview: null }),
    ).toEqual({ kind: "submitted_without_case" });
  });

  it("Caso presente: retorna case_available com o statusLabel oficial, sem reinterpretar", () => {
    expect(
      derivePatientHomeState({
        storyStatuses: ["enviada"],
        caseOverview: { statusLabel: "Sua curadoria está em andamento." },
      }),
    ).toEqual({ kind: "case_available", statusLabel: "Sua curadoria está em andamento." });
  });

  it("combinação inconsistente (rascunho novo + história enviada antiga, sem Caso): rascunho prevalece", () => {
    expect(
      derivePatientHomeState({
        storyStatuses: ["enviada", "rascunho"],
        caseOverview: null,
      }),
    ).toEqual({ kind: "draft" });
  });

  it("combinação inconsistente (rascunho paralelo + Caso já aberto): Caso prevalece", () => {
    expect(
      derivePatientHomeState({
        storyStatuses: ["rascunho", "enviada"],
        caseOverview: { statusLabel: "Recebemos sua história." },
      }),
    ).toEqual({ kind: "case_available", statusLabel: "Recebemos sua história." });
  });

  it("múltiplas histórias enviadas, nenhuma em rascunho, sem Caso: submitted_without_case", () => {
    expect(
      derivePatientHomeState({ storyStatuses: ["enviada", "enviada"], caseOverview: null }),
    ).toEqual({ kind: "submitted_without_case" });
  });

  it("entradas nulas/ausentes: fallback seguro para no_story", () => {
    expect(derivePatientHomeState({})).toEqual({ kind: "no_story" });
    expect(derivePatientHomeState({ storyStatuses: null, caseOverview: null })).toEqual({
      kind: "no_story",
    });
    expect(derivePatientHomeState({ storyStatuses: undefined, caseOverview: undefined })).toEqual(
      { kind: "no_story" },
    );
  });
});
