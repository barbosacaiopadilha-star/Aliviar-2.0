import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { conduct } from "@/modules/curadoria/cos/conduction";
import { COS_PHASE_DEFINITIONS } from "@/modules/curadoria/cos/phases";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";

const base = Object.values(MOCK_RECORDS).find(
  (record) => record.prioridades.mapaPendentes === 0,
)!;

function com(record: CuradoriaRecord, patch: Partial<CuradoriaRecord["prioridades"]>) {
  return { ...record, prioridades: { ...record.prioridades, ...patch } };
}

function criterio(id: string) {
  return COS_PHASE_DEFINITIONS.PRIORIDADES.exitCriteria.find((c) => c.id === id)!;
}

describe("Fase PRIORIDADES — o gate é o Mapa, nunca a soma", () => {
  it("conclui com o Mapa completo", () => {
    expect(criterio("mapa-completo").isMet(com(base, { mapaPendentes: 0 }))).toBe(true);
  });

  it("não conclui com o Mapa incompleto", () => {
    expect(criterio("mapa-completo").isMet(com(base, { mapaPendentes: 1 }))).toBe(false);
    expect(criterio("mapa-completo").isMet(com(base, { mapaPendentes: 26 }))).toBe(false);
  });

  it("o registro nem carrega mais pesos — o gate é só o Mapa (M3)", () => {
    expect("weights" in base.prioridades).toBe(false);
    expect(criterio("mapa-completo").isMet(com(base, { mapaPendentes: 4 }))).toBe(false);
    expect(criterio("mapa-completo").isMet(com(base, { mapaPendentes: 0 }))).toBe(true);
  });

  it("conduct() opera sem nenhum dado de pesos", () => {
    expect(() => conduct(base)).not.toThrow();
    expect(conduct(base).completedPhases).toContain("PRIORIDADES");
  });

  it("nenhuma fase do COS menciona pontos, soma ou peso nos seus critérios", () => {
    for (const definicao of Object.values(COS_PHASE_DEFINITIONS)) {
      for (const criterio of [...definicao.entryCriteria, ...definicao.exitCriteria]) {
        expect(criterio.isMet.toString(), `${definicao.id}/${criterio.id}`).not.toMatch(
          /weights|totalWeight|=== 100/,
        );
      }
    }
  });

  it("as nove fases do COS continuam intactas", () => {
    expect(Object.keys(COS_PHASE_DEFINITIONS)).toHaveLength(9);
  });

  it("o reconhecimento continua exigido onde o Método determina", () => {
    // Invariante do Método: sem o ato dela, não existe Curadoria. O que mudou
    // foi a CONDIÇÃO do ato, nunca a exigência dele.
    const saida = COS_PHASE_DEFINITIONS.VALIDACAO.exitCriteria;
    expect(saida.some((c) => c.isMet({ ...base, validacao: null } as CuradoriaRecord) === false)).toBe(
      true,
    );
  });
});

describe("priority_weights não recebe mais gravação", () => {
  function fontes(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
      const caminho = join(dir, entrada.name);
      if (entrada.isDirectory()) return fontes(caminho);
      return /\.(ts|tsx)$/.test(entrada.name) ? [caminho] : [];
    });
  }

  const codigo = fontes(join(process.cwd(), "src")).map((f) => ({
    arquivo: f,
    texto: readFileSync(f, "utf8"),
  }));

  it("nenhum insert, upsert ou update em priority_weights sobrou em src", () => {
    for (const { arquivo, texto } of codigo) {
      const escreve = /from\("priority_weights"\)\s*\.?\s*(upsert|insert|update|delete)/.test(texto);
      expect(escreve, arquivo).toBe(false);
    }
  });

  it("saveWeight e removeWeight não existem mais no repositório", () => {
    const repo = readFileSync(join(process.cwd(), "src/modules/curadoria/repository.ts"), "utf8");
    expect(repo).not.toMatch(/export async function (saveWeight|removeWeight)\(/);
  });

  it("as actions de peso não existem mais", () => {
    const actions = readFileSync(join(process.cwd(), "src/modules/curadoria/actions.ts"), "utf8");
    expect(actions).not.toMatch(/export async function (saveAllWeightsAction|removeWeightAction)\(/);
  });

  it("nenhuma tela grava pesos — o Builder não existe", () => {
    expect(existsSync(join(process.cwd(), "src/components/curadoria/priority-builder.tsx"))).toBe(
      false,
    );
  });

  it("a leitura histórica foi preservada", () => {
    // Os dados continuam; o que morreu foi a porta de entrada.
    const repo = readFileSync(join(process.cwd(), "src/modules/curadoria/repository.ts"), "utf8");
    expect(repo).toContain('.from("priority_weights")');
  });

  it("nenhuma sincronização entre os dois modelos foi criada", () => {
    for (const { arquivo, texto } of codigo) {
      const converte =
        /priority_weights/.test(texto) && /case_priority_map/.test(texto) && /insert|upsert/.test(texto);
      expect(converte, arquivo).toBe(false);
    }
  });
});
