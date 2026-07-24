import { describe, expect, it } from "vitest";

import { createNarrative } from "@/modules/ace/artifacts/narrative";
import { humanizeArtifactType, humanizeProtocolId } from "@/modules/ace/artifact-labels";
import {
  applyHumanCorrectionsToMissingInformation,
  resolveFieldStateWithOverrides,
} from "@/modules/ace/protocols/p002-human-overrides";
import { classifyP002FieldState } from "@/modules/ace/protocols/p002-completeness";
import { computePriorityValidationReadiness } from "@/modules/curadoria/priority-validation-readiness";
import {
  resolveAuthenticatedDisplayName,
} from "@/modules/auth/display-identity";
import type { AuthState } from "@/modules/auth/session";
import type { User } from "@supabase/supabase-js";

describe("Estabilização — identidade", () => {
  it("nunca usa Helena Vasconcelos como fallback", () => {
    const state: AuthState = {
      user: { id: "u1", email: "" } as User,
      profile: null,
      roles: ["administrador"],
    };
    expect(resolveAuthenticatedDisplayName(state)).not.toBe("Helena Vasconcelos");
  });
});

describe("Estabilização — precedência humana", () => {
  it("correção humana prevalece sobre inferência na exibição", () => {
    const narrative = createNarrative({
      text: "Sem menção de exames.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const inferred = classifyP002FieldState("exames", narrative);
    const resolved = resolveFieldStateWithOverrides("exames", inferred, [
      {
        field: "exames",
        estado: "conhecido",
        motivo: "Curador confirmou com paciente.",
        corrigidoPor: "curador-1",
        corrigidoEm: "2026-07-24T12:00:00.000Z",
      },
    ]);
    expect(resolved).toBe("conhecido");
  });

  it("remove lacunas quando correção humana dispensa o campo", () => {
    const narrative = createNarrative({
      text: "Busca orientação.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const filtered = applyHumanCorrectionsToMissingInformation(
      narrative,
      [{ description: "Exames não informados.", relatedField: "other" }],
      [
        {
          field: "exames",
          estado: "nao_se_aplica",
          motivo: "Campo dispensado pelo Curador.",
          corrigidoPor: "curador-1",
          corrigidoEm: "2026-07-24T12:00:00.000Z",
        },
      ],
    );
    expect(filtered).toHaveLength(0);
  });
});

describe("Estabilização — linguagem humana", () => {
  it("traduz tipos técnicos para o Curador", () => {
    expect(humanizeArtifactType("DecisionCase")).toBe("Caso de decisão");
    expect(humanizeArtifactType("Narrative")).toBe("História organizada");
    expect(humanizeProtocolId("P002")).toBe("Estruturação do caso");
  });
});

describe("Estabilização — validação idempotente", () => {
  it("bloqueia revalidação de perfil já validado", () => {
    const readiness = computePriorityValidationReadiness({
      weights: [
        { criterion: "DISPONIBILIDADE", weight: 50, evidence: "ok", targetValue: null },
        { criterion: "CONTINUIDADE", weight: 50, evidence: "ok", targetValue: null },
      ],
      filterCriteria: [],
      validated: true,
    });
    expect(readiness.canValidate).toBe(false);
    expect(readiness.status).toBe("validado");
  });
});

describe("Estabilização — classificação semântica", () => {
  const narrative = (text: string) =>
    createNarrative({
      text,
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

  it("exames negados não são ausência", () => {
    expect(classifyP002FieldState("exames", narrative("Não fiz nenhum exame."))).toBe("ausencia_declarada");
  });

  it("especialidade é hipótese técnica, não lacuna do paciente", () => {
    expect(classifyP002FieldState("especialidade", narrative("Não sei qual médico procurar."))).toBe(
      "determinado_pelo_caso",
    );
  });

  it("sem convênio declarado é ausência explícita", () => {
    expect(classifyP002FieldState("convenio", narrative("Não tenho convênio."))).toBe("ausencia_declarada");
  });

  it("especialista anterior é conhecido mesmo sem detalhes", () => {
    expect(
      classifyP002FieldState("atendimento_anterior", narrative("Já passou por um médico especialista.")),
    ).toBe("conhecido");
  });
});
