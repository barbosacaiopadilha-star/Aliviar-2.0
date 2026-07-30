import { describe, expect, it } from "vitest";

import { JORNADA_STAGES, buildJornada } from "@/modules/curadoria/jornada";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";

const marina = MOCK_RECORDS["caso-2041"]!; // em construção do Perfil
const joaquim = MOCK_RECORDS["caso-2038"]!; // validado, comparação feita
const rosa = MOCK_RECORDS["caso-2024"]!; // relatório entregue, aguardando decisão

describe("estrutura da Jornada", () => {
  it("mostra sempre as sete etapas, na mesma ordem", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      const jornada = buildJornada(record);
      expect(jornada.stages.map((stage) => stage.id)).toEqual([...JORNADA_STAGES]);
    }
  });

  it("nenhuma etapa aparece vazia — toda uma tem descrição e responsável", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      for (const stage of buildJornada(record).stages) {
        expect(stage.description.trim().length).toBeGreaterThan(0);
        expect(stage.responsible.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("aponta a etapa atual como a primeira não concluída", () => {
    expect(buildJornada(marina).currentStage).toBe("PERFIL_DE_PRIORIDADES");
    expect(buildJornada(joaquim).currentStage).toBe("CURADORIA");
    expect(buildJornada(rosa).currentStage).toBe("ESCOLHA");
  });
});

describe("de quem é a vez", () => {
  it("distingue o que espera o paciente do que a equipe está fazendo", () => {
    const jornada = buildJornada(rosa);
    const escolha = jornada.stages.find((stage) => stage.id === "ESCOLHA");
    expect(escolha?.status).toBe("AGUARDANDO_VOCE");
    expect(escolha?.nextAction?.owner).toBe("VOCE");
  });

  it("durante a Curadoria, a ação é da equipe — o paciente não é cobrado", () => {
    const curadoria = buildJornada(joaquim).stages.find((stage) => stage.id === "CURADORIA");
    expect(curadoria?.status).toBe("EM_ANDAMENTO");
    expect(curadoria?.nextAction?.owner).toBe("EQUIPE");
  });

  it("a escolha responde ao paciente, nunca ao Curador", () => {
    const escolha = buildJornada(rosa).stages.find((stage) => stage.id === "ESCOLHA");
    expect(escolha?.responsible).toBe(rosa.patientFirstName);
  });
});

describe("o que nunca atravessa a fronteira do paciente", () => {
  const FORBIDDEN = [
    "score",
    "interno",
    "ranking",
    "melhor médico",
    "processando",
    "compatibilidade muito alta",
    "cobertura",
    "eliminado",
    "Motor",
    "protocolo",
  ];

  it("nenhum texto da Jornada expõe nível interno ou mecanismo", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      const jornada = buildJornada(record);
      const text = jornada.stages
        .flatMap((stage) => [stage.description, stage.nextAction?.label ?? ""])
        .join(" ")
        .toLowerCase();

      for (const term of FORBIDDEN) {
        expect(text, `"${term}" vazou para a Jornada`).not.toContain(term.toLowerCase());
      }
    }
  });

  it("nenhum nome de profissional analisado aparece na Jornada", () => {
    const jornada = buildJornada(joaquim);
    const text = jornada.stages.map((stage) => stage.description).join(" ");

    for (const leitura of joaquim.curadoriaTecnica.leituras) {
      expect(text).not.toContain(leitura.professionalName);
    }
  });

  it("a etapa da Curadoria não usa a data do cálculo quando há data humana", () => {
    // O que importa para quem lê é quando uma pessoa trabalhou.
    const curadoria = buildJornada(rosa).stages.find((stage) => stage.id === "CURADORIA");
    expect(curadoria?.updatedAt).toBe(rosa.curadoriaTecnica.selectedAt);
  });
});

describe("honestidade dos estados", () => {
  it("não inventa prazo quando não há", () => {
    expect(buildJornada(rosa).promisedReturn).toBeNull();
    expect(buildJornada(joaquim).promisedReturn).toBe(joaquim.promisedReturn);
  });

  it("etapas futuras dizem o que vai acontecer, nunca ficam mudas", () => {
    const futuras = buildJornada(marina).stages.filter((stage) => stage.status === "A_CAMINHO");
    expect(futuras.length).toBeGreaterThan(0);
    for (const stage of futuras) {
      expect(stage.description.trim().length).toBeGreaterThan(20);
      expect(stage.updatedAt).toBeNull();
    }
  });

  it("'nenhuma das três' é tratada como resposta legítima, nunca como falha", () => {
    const recusou: CuradoriaRecord = {
      ...rosa,
      devolutiva: {
        ...rosa.devolutiva,
        decision: {
          outcome: "NONE_OF_THEM",
          chosenProfessionalId: null,
          justification: null,
          decidedAt: "2026-07-22T10:00:00-03:00",
        },
      },
    };
    const escolha = buildJornada(recusou).stages.find((stage) => stage.id === "ESCOLHA");
    expect(escolha?.status).toBe("CONCLUIDA");
    expect(escolha?.description).toContain("resposta legítima");
    expect(escolha?.description.toLowerCase()).not.toContain("falha");
  });

  it("o acompanhamento só começa quando houve escolha de fato", () => {
    const semEscolha = buildJornada(rosa).stages.find((stage) => stage.id === "ACOMPANHAMENTO");
    expect(semEscolha?.status).toBe("A_CAMINHO");
  });
});

describe("determinismo", () => {
  it("a mesma Memória sempre produz a mesma Jornada", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      expect(JSON.stringify(buildJornada(record))).toBe(JSON.stringify(buildJornada(record)));
    }
  });
});
