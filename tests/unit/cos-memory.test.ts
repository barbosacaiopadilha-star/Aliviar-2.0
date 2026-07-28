import { describe, expect, it } from "vitest";

import { buildMemory, runReconstructionTest } from "@/modules/curadoria/cos/memory";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";

const marina = MOCK_RECORDS["caso-2041"]!;
const joaquim = MOCK_RECORDS["caso-2038"]!;
const rosa = MOCK_RECORDS["caso-2024"]!;

describe("Memória da Curadoria", () => {
  it("monta a linha do tempo em ordem cronológica", () => {
    const memory = buildMemory(rosa);
    const timestamps = memory.map((entry) => entry.at);
    expect([...timestamps].sort()).toEqual(timestamps);
  });

  it("toda entrada nomeia quem agiu", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      for (const entry of buildMemory(record)) {
        expect(entry.actor.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("atribui ao paciente os atos que são dele", () => {
    const memory = buildMemory(joaquim);
    const validacao = memory.find((entry) => entry.event === "PERFIL_VALIDADO");
    expect(validacao?.actor).toBe("Joaquim Ribeiro");

    // ADR-042: a distribuição de 100 pontos saiu da linha do tempo. O ato
    // do paciente que a memória registra é o reconhecimento do Perfil.
    expect(memory.some((entry) => entry.event === "PESO_ATRIBUIDO")).toBe(false);
  });

  it("atribui ao Sistema apenas o que o Sistema fez", () => {
    const memory = buildMemory(joaquim);
    const systemEntries = memory.filter((entry) => entry.actor === "Sistema");
    expect(systemEntries.every((entry) => entry.event === "COMPATIBILIDADE_CALCULADA")).toBe(true);
  });

  it("não reencena a distribuição de 100 pontos — ADR-042", () => {
    const memory = buildMemory(joaquim);
    expect(memory.filter((entry) => entry.event === "PESO_ATRIBUIDO")).toHaveLength(0);
    for (const entry of memory) {
      expect(entry.description).not.toMatch(/d+ pontos/);
    }
  });

  it("só registra o que aconteceu — nada é presumido", () => {
    const memory = buildMemory(marina);
    expect(memory.some((entry) => entry.event === "PERFIL_VALIDADO")).toBe(false);
    expect(memory.some((entry) => entry.event === "SELECAO_FECHADA")).toBe(false);
  });
});

describe("teste de reconstrução (Engine §5.6)", () => {
  it("faz sempre as nove perguntas", () => {
    for (const record of Object.values(MOCK_RECORDS)) {
      expect(runReconstructionTest(record)).toHaveLength(9);
    }
  });

  it("uma Curadoria em andamento não responde às perguntas do que ainda não aconteceu", () => {
    const answers = runReconstructionTest(marina);
    const validacao = answers.find((entry) => entry.question.includes("validou"));
    expect(validacao?.answered).toBe(false);
    expect(validacao?.answer).toBe("Não registrado.");
  });

  it("uma Curadoria avançada responde ao que já aconteceu", () => {
    const answers = runReconstructionTest(rosa);
    const mapa = answers.find((entry) => entry.question.includes("subcritério"));
    const selecao = answers.find((entry) => entry.question.includes("escolheu as três"));

    expect(mapa?.answered).toBe(true);
    expect(selecao?.answered).toBe(true);
    expect(selecao?.answer).toContain("Helena Vasconcelos");
  });

  it("declara honestamente a lacuna do estado histórico do Perfil Médico", () => {
    // Divergência 13 registrada na especificação do Motor. O teste existe para
    // que a lacuna continue visível até ser resolvida — nunca esquecida.
    for (const record of Object.values(MOCK_RECORDS)) {
      const answer = runReconstructionTest(record).find((entry) =>
        entry.question.includes("naquele momento"),
      );
      expect(answer?.answered).toBe(false);
      expect(answer?.answer).toContain("não o estado do cadastro");
    }
  });
});
