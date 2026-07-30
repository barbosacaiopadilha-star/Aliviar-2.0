import { describe, expect, it } from "vitest";

import { SUBCRITERION_CATALOG, SUBCRITERION_GROUPS, type Subcriterion } from "@/modules/curadoria/mapa-prioridades";
import {
  completionSentence,
  describeRejection,
  groupProfessionalMap,
  isSubcriterionStatus,
  normalizeNote,
  NOTE_MAX_LENGTH,
  professionalMapCompletion,
  SUBCRITERION_STATUSES,
  SUBCRITERION_STATUS_LABELS,
  validateProfessionalMapWrite,
  type ProfessionalMapItem,
} from "@/modules/curadoria/mapa-profissional";

const TODOS: ProfessionalMapItem[] = SUBCRITERION_CATALOG.map((entry) => ({
  subcriterionCode: entry.code,
  status: "NAO_INFORMADO",
  note: null,
}));

describe("Estados — três, e nenhum adjetivo de qualidade", () => {
  it("são exatamente CONFIRMADO, NAO_CONFIRMADO e NAO_INFORMADO", () => {
    expect([...SUBCRITERION_STATUSES]).toEqual(["CONFIRMADO", "NAO_CONFIRMADO", "NAO_INFORMADO"]);
  });

  it("recusa autoavaliação subjetiva e estado intermediário", () => {
    for (const invalido of [
      "EXCELENTE", "MUITO_BOM", "ATENDIMENTO_SUPERIOR", "PARCIAL",
      "PROVAVEL", "EVIDENCIA_FORTE", "DIVERGENTE", "PENDENTE", "EM_ANALISE",
    ]) {
      expect(isSubcriterionStatus(invalido), invalido).toBe(false);
    }
  });

  it("nenhum rótulo carrega juízo de valor", () => {
    const texto = Object.values(SUBCRITERION_STATUS_LABELS).join(" ").toLowerCase();
    for (const proibido of ["excelente", "ótimo", "superior", "melhor", "alto nível", "insuficiente"]) {
      expect(texto).not.toContain(proibido);
    }
  });
});

describe("Observação", () => {
  it("vazia e só-espaço viram null", () => {
    for (const vazio of ["", "   ", "\n\t ", null, undefined]) {
      expect(normalizeNote(vazio)).toBeNull();
    }
  });

  it("é trimada", () => {
    expect(normalizeNote("  atende às quintas  ")).toBe("atende às quintas");
  });

  it("é recusada acima do limite, com o item nomeado", () => {
    const [rejeicao] = validateProfessionalMapWrite([
      { subcriterionCode: "ACESSO_LOCALIZACAO", status: "CONFIRMADO", note: "x".repeat(NOTE_MAX_LENGTH + 1) },
    ]);
    expect(rejeicao).toMatchObject({ reason: "OBSERVACAO_LONGA", code: "ACESSO_LOCALIZACAO" });
    expect(describeRejection(rejeicao!)).toContain("Localização");
  });

  it("não é obrigatória para estado nenhum", () => {
    for (const status of SUBCRITERION_STATUSES) {
      expect(
        validateProfessionalMapWrite([{ subcriterionCode: "MODELO_COMUNICACAO", status }]),
      ).toEqual([]);
    }
  });
});

describe("Completude — tratados, não atendidos", () => {
  it("mapa vazio é NOT_STARTED", () => {
    const completude = professionalMapCompletion([]);
    expect(completude.status).toBe("NOT_STARTED");
    expect(completude.declared).toBe(0);
    expect(completude.pending).toBe(completude.total);
  });

  it("mapa parcial é IN_PROGRESS e nomeia os pendentes", () => {
    const completude = professionalMapCompletion([TODOS[0]!, TODOS[1]!]);
    expect(completude.status).toBe("IN_PROGRESS");
    expect(completude.declared).toBe(2);
    expect(completude.pendingCodes).not.toContain(TODOS[0]!.subcriterionCode);
  });

  it("NAO_INFORMADO conta como tratado — completo não significa confirmado", () => {
    const completude = professionalMapCompletion(TODOS);
    expect(completude.status).toBe("COMPLETE");
    expect(completude.pending).toBe(0);
    // Todos os 26 estão como "não informado", e ainda assim está completo.
    expect(TODOS.every((item) => item.status === "NAO_INFORMADO")).toBe(true);
  });

  it("ausência de registro não vira NAO_INFORMADO", () => {
    const grupos = groupProfessionalMap([
      { subcriterionCode: "ACESSO_LOCALIZACAO", status: "NAO_INFORMADO", note: null },
    ]);
    const acesso = grupos.find((g) => g.group === "ACESSO")!;

    const analisado = acesso.entries.find((e) => e.subcriterion.code === "ACESSO_LOCALIZACAO")!;
    expect(analisado.status, "analisado, sem informação").toBe("NAO_INFORMADO");

    const naoTratado = acesso.entries.find((e) => e.subcriterion.code !== "ACESSO_LOCALIZACAO")!;
    expect(naoTratado.status, "ninguém tratou ainda").toBeNull();
  });

  it("subcritério fora de circulação não vira pendência nem some do histórico", () => {
    const catalogo: Subcriterion[] = SUBCRITERION_CATALOG.map((entry, i) =>
      i === 0 ? { ...entry, active: false } : entry,
    );
    const completude = professionalMapCompletion(TODOS, catalogo);
    expect(completude.total).toBe(SUBCRITERION_CATALOG.length - 1);
    expect(completude.status).toBe("COMPLETE");
  });

  it("o resumo não confunde 'não avaliado' com 'não informado'", () => {
    const frase = completionSentence(professionalMapCompletion([TODOS[0]!]));
    expect(frase).toContain("ainda não avaliado");
    expect(frase).not.toContain("não informado");
  });
});

describe("Catálogo compartilhado — sem taxonomia paralela", () => {
  it("usa os mesmos seis grupos e os mesmos 26 subcritérios do Case", () => {
    const grupos = groupProfessionalMap([]);
    expect(grupos.map((g) => g.group)).toEqual([...SUBCRITERION_GROUPS]);
    expect(grupos.reduce((total, g) => total + g.entries.length, 0)).toBe(SUBCRITERION_CATALOG.length);
  });
});

describe("O que o domínio recusa", () => {
  it("aceita os três estados válidos", () => {
    for (const status of SUBCRITERION_STATUSES) {
      expect(validateProfessionalMapWrite([{ subcriterionCode: "HISTORICO_REGULARIDADE", status }])).toEqual([]);
    }
  });

  it("recusa estado inválido, e explica o que escolher", () => {
    const [rejeicao] = validateProfessionalMapWrite([
      { subcriterionCode: "HISTORICO_REGULARIDADE", status: "EXCELENTE" },
    ]);
    expect(rejeicao).toEqual({ reason: "ESTADO_INVALIDO", value: "EXCELENTE" });
    expect(describeRejection(rejeicao!)).toContain("Confirmado");
  });

  it("recusa subcritério inexistente e repetido", () => {
    expect(
      validateProfessionalMapWrite([{ subcriterionCode: "INVENTADO", status: "CONFIRMADO" }]),
    ).toContainEqual({ reason: "SUBCRITERIO_INEXISTENTE", code: "INVENTADO" });

    expect(
      validateProfessionalMapWrite([
        { subcriterionCode: "ACESSO_MODALIDADE", status: "CONFIRMADO" },
        { subcriterionCode: "ACESSO_MODALIDADE", status: "NAO_CONFIRMADO" },
      ]),
    ).toContainEqual({ reason: "SUBCRITERIO_REPETIDO", code: "ACESSO_MODALIDADE" });
  });

  it("nenhuma mensagem de erro é apenas 'Dados inválidos'", () => {
    const rejeicoes = validateProfessionalMapWrite([
      { subcriterionCode: "INVENTADO", status: "EXCELENTE" },
    ]);
    for (const rejeicao of rejeicoes) {
      const mensagem = describeRejection(rejeicao);
      expect(mensagem.toLowerCase()).not.toBe("dados inválidos.");
      expect(mensagem.length).toBeGreaterThan(30);
    }
  });
});
