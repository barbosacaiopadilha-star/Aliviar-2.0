import { describe, expect, it } from "vitest";

import {
  ATENDIMENTO_PIPELINE_STAGES,
  CONCIERGE_PIPELINE_STAGES,
  CURADORIA_PIPELINE_STAGES,
  resolveCoaLevelForPipelineStage,
  resolveJourneyPhase,
} from "@/modules/coa/levels";
import { canAccessCoaLevel, resolveCoaHomePath } from "@/modules/coa/permissions";
import { resolveCurrentResponsible } from "@/modules/coa/journey-responsibility";

describe("COA — níveis operacionais", () => {
  it("mapeia etapas de atendimento ao Nível 1", () => {
    expect(resolveCoaLevelForPipelineStage("new_contact")).toBe("ATENDIMENTO");
    expect(ATENDIMENTO_PIPELINE_STAGES).toContain("initial_consultation_scheduled");
  });

  it("mapeia etapas de curadoria ao Nível 2", () => {
    expect(resolveCoaLevelForPipelineStage("curation_in_progress")).toBe("CURADORIA");
    expect(CURADORIA_PIPELINE_STAGES).not.toContain("doctor_selected");
  });

  it("transfere pós-escolha ao Nível 3 Concierge", () => {
    expect(resolveCoaLevelForPipelineStage("doctor_selected")).toBe("CONCIERGE");
    expect(CONCIERGE_PIPELINE_STAGES).toContain("scheduling_support");
  });
});

describe("COA — permissões", () => {
  it("concierge acessa atendimento, não curadoria", () => {
    expect(canAccessCoaLevel(["concierge"], "ATENDIMENTO")).toBe(true);
    expect(canAccessCoaLevel(["concierge"], "CURADORIA")).toBe(false);
  });

  it("curador acessa apenas curadoria", () => {
    expect(canAccessCoaLevel(["curador_medico"], "CURADORIA")).toBe(true);
    expect(canAccessCoaLevel(["curador_medico"], "ATENDIMENTO")).toBe(false);
  });

  it("resolve home por papel", () => {
    expect(resolveCoaHomePath(["concierge"])).toBe("/acompanhamento");
    expect(resolveCoaHomePath(["curador_medico"])).toBe("/coa/curadoria");
  });

  /**
   * COA-H1 · o contrato puro sempre soube fechar — quem não resolve nível já
   * recebia `/acesso-negado` aqui. O defeito nunca esteve nesta função: o
   * índice `/coa` é que não consultava esta resposta antes de renderizar.
   * Estes casos ficam como piso do contrato; a prova que importa é a da rota
   * real, em `tests/e2e/coa-fronteira.spec.ts`.
   */
  it.each([[[]], [["paciente"]], [["profissional"]], [["atendente"]]])(
    "quem não tem nível COA (%j) resolve /acesso-negado",
    (papeis: string[]) => {
      expect(resolveCoaHomePath(papeis)).toBe("/acesso-negado");
    },
  );
});

describe("COA — responsável da jornada", () => {
  it("mostra Curador durante curadoria", () => {
    const responsible = resolveCurrentResponsible({
      pipelineStage: "curation_in_progress",
      curatorName: "Dra. Ana",
    });
    expect(responsible.role).toBe("curador");
    expect(responsible.name).toBe("Dra. Ana");
  });

  it("mostra Concierge após escolha", () => {
    const responsible = resolveCurrentResponsible({
      pipelineStage: "scheduling_support",
      conciergeName: "Marina",
    });
    expect(responsible.role).toBe("concierge");
    expect(responsible.name).toBe("Marina");
  });

  it("mostra Atendente na fase de lead", () => {
    const responsible = resolveCurrentResponsible({
      pipelineStage: "new_contact",
      attendantName: "Paula",
    });
    expect(responsible.role).toBe("atendente");
  });

  it("resolve fase da jornada a partir do funil", () => {
    expect(resolveJourneyPhase("new_contact")).toBe("lead");
    expect(resolveJourneyPhase("sent_to_curator")).toBe("curadoria");
    expect(resolveJourneyPhase("scheduling_support")).toBe("acompanhamento");
  });
});
