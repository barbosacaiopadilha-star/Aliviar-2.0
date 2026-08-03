import { describe, expect, it } from "vitest";

import { CRITERION_LABELS } from "@/modules/curadoria/cruzamento";
import {
  activeSubcriteria,
  groupPriorityMap,
  IMPORTANCE_LABELS,
  IMPORTANCE_LEVELS,
  importanceOrdinal,
  isImportanceLevel,
  isSubcriterionGroup,
  priorityMapCompletion,
  SUBCRITERION_CATALOG,
  SUBCRITERION_GROUPS,
  subcriteriaOfGroup,
  validatePriorityMapWrite,
  type Subcriterion,
} from "@/modules/curadoria/mapa-prioridades";

const TODOS = SUBCRITERION_CATALOG.map((entry) => ({
  subcriterionCode: entry.code,
  importance: "RELEVANTE" as const,
}));

describe("Catálogo — o Método define o que se avalia", () => {
  it("os grupos são os seis critérios do Modelo v1.0 mais VIABILIDADE (Catálogo 1.0.0, fora da matriz do Motor)", () => {
    expect([...SUBCRITERION_GROUPS]).toEqual([
      "FORMACAO",
      "EXPERIENCIA",
      "HISTORICO",
      "ACESSO",
      "CONTINUIDADE_DO_CUIDADO",
      "MODELO_DE_ATENDIMENTO",
      "VIABILIDADE",
    ]);
    // O rótulo vem do mesmo lugar que a Mesa já usa.
    expect(CRITERION_LABELS.HISTORICO).toBe("Histórico Profissional");
  });

  it("o catálogo vigente (1.1.0, ADR-065) tem exatamente os 29 conceitos aprovados", () => {
    expect(SUBCRITERION_CATALOG.filter((entry) => entry.active)).toHaveLength(29);
    const codigos = SUBCRITERION_CATALOG.map((entry) => entry.code);
    for (const novo of [
      "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
      "CONTINUIDADE_CANAIS",
      "PRATICA_LIMITES_DE_ATUACAO",
      "EXPERIENCIA_NO_TIPO_DE_CASO",
      "HISTORICO_ATIVIDADE_ACADEMICA",
      "HISTORICO_AREAS_DE_ATUACAO",
      "ACESSO_LOCAL_DE_ATENDIMENTO",
      "VIABILIDADE_COBERTURA_E_CONVENIO",
      "VIABILIDADE_CUSTO_E_PAGAMENTO",
    ]) {
      expect(codigos, novo).toContain(novo);
    }
    for (const aposentado of [
      "HISTORICO_REGULARIDADE",
      "EXPERIENCIA_CASOS_SEMELHANTES",
      "EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO",
      "HISTORICO_PRODUCAO_ACADEMICA",
      "HISTORICO_ENSINO_E_PESQUISA",
      "ACESSO_LOCALIZACAO",
    ]) {
      expect(codigos, aposentado).not.toContain(aposentado);
    }
  });

  it("todo subcritério pertence a um grupo válido", () => {
    for (const entry of SUBCRITERION_CATALOG) {
      expect(isSubcriterionGroup(entry.group), `${entry.code} → ${entry.group}`).toBe(true);
    }
  });

  it("os códigos são únicos", () => {
    const codigos = SUBCRITERION_CATALOG.map((entry) => entry.code);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it("o código não deriva do texto visível — o rótulo pode mudar sem quebrar Case nenhum", () => {
    for (const entry of SUBCRITERION_CATALOG) {
      expect(entry.code).toMatch(/^[A-Z][A-Z0-9_]+$/);
      expect(entry.code).not.toBe(entry.name);
    }
  });

  it("cada grupo tem ordem de apresentação sem empate", () => {
    for (const group of SUBCRITERION_GROUPS) {
      const ordens = subcriteriaOfGroup(group).map((entry) => entry.displayOrder);
      expect(ordens.length, `${group} sem subcritério`).toBeGreaterThan(0);
      expect(new Set(ordens).size, `${group} com ordem repetida`).toBe(ordens.length);
    }
  });

  it("Formação reaproveita a taxonomia oficial da formação do profissional", () => {
    const codigos = subcriteriaOfGroup("FORMACAO").map((entry) => entry.code);
    for (const oficial of ["RESIDENCIA", "ESPECIALIZACAO", "FELLOWSHIP", "GRADUACAO"]) {
      expect(codigos.some((code) => code.includes(oficial)), oficial).toBe(true);
    }
  });
});

describe("Escala de importância — fechada, e o número é derivado", () => {
  it("são exatamente cinco níveis, todos com rótulo", () => {
    expect(IMPORTANCE_LEVELS).toHaveLength(5);
    for (const nivel of IMPORTANCE_LEVELS) {
      expect(IMPORTANCE_LABELS[nivel]?.length ?? 0).toBeGreaterThan(0);
    }
    expect(IMPORTANCE_LABELS.NAO_INFLUENCIA).toBe("Não influencia este caso");
  });

  it("recusa texto livre e número", () => {
    for (const invalido of ["muito importante", "5", "", "MUITO IMPORTANTE", "ALTA"]) {
      expect(isImportanceLevel(invalido), invalido).toBe(false);
    }
  });

  it("o ordinal é monotônico e centralizado num lugar só", () => {
    const ordinais = IMPORTANCE_LEVELS.map(importanceOrdinal);
    expect(ordinais).toEqual([...ordinais].sort((a, b) => b - a));
    expect(importanceOrdinal("NAO_INFLUENCIA")).toBe(0);
    expect(importanceOrdinal("MUITO_IMPORTANTE")).toBe(5);
  });
});

describe("Completude — calculada, nunca declarada", () => {
  it("mapa vazio é NOT_STARTED, e diz tudo o que falta", () => {
    const completude = priorityMapCompletion([]);
    expect(completude.status).toBe("NOT_STARTED");
    expect(completude.completed).toBe(0);
    expect(completude.total).toBe(activeSubcriteria().length);
    expect(completude.pendingCodes).toHaveLength(completude.total);
  });

  it("mapa parcial é IN_PROGRESS e nomeia os pendentes", () => {
    const completude = priorityMapCompletion([TODOS[0]!, TODOS[1]!]);
    expect(completude.status).toBe("IN_PROGRESS");
    expect(completude.completed).toBe(2);
    expect(completude.pending).toBe(completude.total - 2);
    expect(completude.pendingCodes).not.toContain(TODOS[0]!.subcriterionCode);
  });

  it("mapa completo é COMPLETE, sem etapa manual de validação", () => {
    const completude = priorityMapCompletion(TODOS);
    expect(completude.status).toBe("COMPLETE");
    expect(completude.pending).toBe(0);
    expect(completude.pendingCodes).toEqual([]);
  });

  it("subcritério fora de circulação não vira pendência nem apaga o histórico", () => {
    const catalogo: Subcriterion[] = SUBCRITERION_CATALOG.map((entry, indice) =>
      indice === 0 ? { ...entry, active: false } : entry,
    );

    // O Case classificou o subcritério ANTES de ele sair de circulação.
    const completude = priorityMapCompletion(TODOS, catalogo);

    expect(completude.total).toBe(SUBCRITERION_CATALOG.length - 1);
    expect(completude.status).toBe("COMPLETE");
    expect(completude.pendingCodes).toEqual([]);
  });

  it("os pendentes saem na ordem do Método, não na de inserção", () => {
    const completude = priorityMapCompletion([]);
    const primeiro = SUBCRITERION_CATALOG.find((entry) => entry.group === "FORMACAO" && entry.displayOrder === 1)!;
    expect(completude.pendingCodes[0]).toBe(primeiro.code);
  });
});

describe("Leitura agrupada", () => {
  it("devolve os seis grupos, com o que falta como nulo — nunca como zero", () => {
    const grupos = groupPriorityMap([{ subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", importance: "MUITO_IMPORTANTE" }]);

    expect(grupos.map((g) => g.group)).toEqual([...SUBCRITERION_GROUPS]);

    const acesso = grupos.find((g) => g.group === "ACESSO")!;
    const localizacao = acesso.entries.find((e) => e.subcriterion.code === "ACESSO_LOCAL_DE_ATENDIMENTO")!;
    expect(localizacao.importance).toBe("MUITO_IMPORTANTE");

    const outro = acesso.entries.find((e) => e.subcriterion.code !== "ACESSO_LOCAL_DE_ATENDIMENTO")!;
    expect(outro.importance, "não classificado é null, não 0").toBeNull();
  });
});

describe("O que o domínio recusa antes do banco", () => {
  it("aceita uma classificação válida", () => {
    expect(
      validatePriorityMapWrite([{ subcriterionCode: "MODELO_COMUNICACAO", importance: "IMPORTANTE" }]),
    ).toEqual([]);
  });

  it("recusa subcritério inexistente — o Curador não cria critério", () => {
    const [rejeicao] = validatePriorityMapWrite([
      { subcriterionCode: "QUE_O_CURADOR_INVENTOU", importance: "IMPORTANTE" },
    ]);
    expect(rejeicao).toEqual({ reason: "SUBCRITERIO_INEXISTENTE", code: "QUE_O_CURADOR_INVENTOU" });
  });

  it("recusa nível fora da escala", () => {
    const rejeicoes = validatePriorityMapWrite([
      { subcriterionCode: "MODELO_COMUNICACAO", importance: "MUITISSIMO" },
    ]);
    expect(rejeicoes).toContainEqual({ reason: "NIVEL_INVALIDO", value: "MUITISSIMO" });
  });

  it("recusa o mesmo subcritério duas vezes na mesma gravação", () => {
    const rejeicoes = validatePriorityMapWrite([
      { subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", importance: "IMPORTANTE" },
      { subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", importance: "RELEVANTE" },
    ]);
    expect(rejeicoes).toContainEqual({ reason: "SUBCRITERIO_REPETIDO", code: "ACESSO_LOCAL_DE_ATENDIMENTO" });
  });

  it("recusa subcritério fora de circulação", () => {
    const catalogo: Subcriterion[] = SUBCRITERION_CATALOG.map((entry) =>
      entry.code === "ACESSO_LOCAL_DE_ATENDIMENTO" ? { ...entry, active: false } : entry,
    );
    const rejeicoes = validatePriorityMapWrite(
      [{ subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", importance: "IMPORTANTE" }],
      catalogo,
    );
    expect(rejeicoes).toContainEqual({ reason: "SUBCRITERIO_INATIVO", code: "ACESSO_LOCAL_DE_ATENDIMENTO" });
  });
});
