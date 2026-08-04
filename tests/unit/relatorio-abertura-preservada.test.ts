import { describe, expect, it } from "vitest";

import {
  composicaoPendenteDoCurador,
  FRASE_COMPOSICAO_RASCUNHO,
} from "@/modules/curadoria/relatorio-inteligente";
import { saveReport, type ReportOptionInput } from "@/modules/curadoria/report-repository";

/**
 * ONDA 1 · PACOTE 1.3 — A ABERTURA DO CURADOR SOBREVIVE À REGENERAÇÃO (P12).
 *
 * O defeito: `saveReport` reescrevia `composition_rationale` em toda gravação, e
 * o gerador do rascunho passava sempre a frase de trabalho. Um ato que parece
 * inócuo — pedir o rascunho de novo — apagava, sem aviso, a única prosa que a
 * paciente lê antes das cartas: o Curador dizendo por que estes três caminhos,
 * juntos, servem a ela (auditoria P12 · risco RI7 · Arquitetura §4.8).
 *
 * A correção usa o idioma que este repositório já tinha para `favorablePoints` e
 * `relationalReading` (Gate D21a): **`undefined` é "não mexi"**. E o juízo sobre
 * "de quem é o texto gravado" não nasce aqui: é a MESMA função que a guarda de
 * emissão consulta (`composicaoPendenteDoCurador`, ADR-064) — uma fonte só,
 * impossível de divergir.
 *
 * O que estes testes provam: o comportamento do repositório (o patch enviado ao
 * banco) e a regra de decisão. O acoplamento gerador→repositório continua
 * provado pela integração, que exige banco (`relatorio-assistido.integration`).
 */

type Chamada = { tabela: string; operacao: string; carga?: unknown };

/**
 * Cliente falso mínimo: registra as operações e devolve o encadeamento que o
 * repositório usa. Não simula banco — só observa o que seria enviado a ele.
 */
function clienteFalso(reportExistente: { id: string; delivered_at: string | null } | null) {
  const chamadas: Chamada[] = [];

  const encadeamento = (tabela: string, operacao: string, carga?: unknown) => {
    chamadas.push({ tabela, operacao, carga });
    const resultado: Record<string, unknown> = {
      eq: () => resultado,
      in: () => resultado,
      order: () => resultado,
      maybeSingle: async () =>
        tabela === "curadoria_reports" && operacao === "select"
          ? { data: reportExistente, error: null }
          : { data: null, error: null },
      single: async () => ({ data: { id: reportExistente?.id ?? "report-novo" }, error: null }),
      select: () => resultado,
      then: (resolver: (valor: { data: unknown[]; error: null }) => unknown) =>
        resolver({ data: [], error: null }),
    };
    return resultado;
  };

  return {
    chamadas,
    cliente: {
      from: (tabela: string) => ({
        select: (...args: unknown[]) => encadeamento(tabela, "select", args[0]),
        update: (carga: unknown) => encadeamento(tabela, "update", carga),
        insert: (carga: unknown) => encadeamento(tabela, "insert", carga),
        delete: () => encadeamento(tabela, "delete"),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
}

const OPCAO: ReportOptionInput = {
  professionalProfileId: "prof-1",
  justification: "Justificativa.",
  relationToWeights: "Relação com as prioridades.",
  // Definidos para que o repositório não precise ler as opções anteriores:
  // este teste é sobre a abertura, não sobre a preservação já existente.
  relationalReading: null,
  attentionPoints: ["Um ponto de atenção."],
  favorablePoints: [],
  suggestedQuestions: [],
  curatorObservations: null,
};

function patchDoRelatorio(chamadas: Chamada[]): Record<string, unknown> | undefined {
  return chamadas.find((c) => c.tabela === "curadoria_reports" && c.operacao === "update")
    ?.carga as Record<string, unknown> | undefined;
}

function insercaoDoRelatorio(chamadas: Chamada[]): Record<string, unknown> | undefined {
  return chamadas.find((c) => c.tabela === "curadoria_reports" && c.operacao === "insert")
    ?.carga as Record<string, unknown> | undefined;
}

describe("1.3 · A abertura do Curador sobrevive à regeneração (P12)", () => {
  it("`undefined` não toca a coluna: o texto do Curador permanece no banco", async () => {
    const { cliente, chamadas } = clienteFalso({ id: "report-1", delivered_at: null });

    await saveReport(cliente, "case-1", "selecao-1", undefined, [OPCAO]);

    const patch = patchDoRelatorio(chamadas);
    expect(patch).toBeDefined();
    expect(
      Object.keys(patch!),
      "Com 'não mexi', `composition_rationale` não pode sequer aparecer no patch — " +
        "aparecer com qualquer valor já seria sobrescrever.",
    ).not.toContain("composition_rationale");
    expect(Object.keys(patch!)).toContain("updated_at");
  });

  it("texto explícito continua sendo gravado: salvar é revisar", async () => {
    const { cliente, chamadas } = clienteFalso({ id: "report-1", delivered_at: null });

    await saveReport(cliente, "case-1", "selecao-1", "Estes três caminhos, juntos, porque…", [
      OPCAO,
    ]);

    expect(patchDoRelatorio(chamadas)?.composition_rationale).toBe(
      "Estes três caminhos, juntos, porque…",
    );
  });

  it("a frase do rascunho continua sendo gravada quando é ela que deve valer", async () => {
    const { cliente, chamadas } = clienteFalso({ id: "report-1", delivered_at: null });

    await saveReport(cliente, "case-1", "selecao-1", FRASE_COMPOSICAO_RASCUNHO, [OPCAO]);

    expect(patchDoRelatorio(chamadas)?.composition_rationale).toBe(FRASE_COMPOSICAO_RASCUNHO);
  });

  it("Relatório nascendo: não há o que preservar, e `undefined` vira ausência declarada", async () => {
    const { cliente, chamadas } = clienteFalso(null);

    await saveReport(cliente, "case-1", "selecao-1", undefined, [OPCAO]);

    expect(
      insercaoDoRelatorio(chamadas)?.composition_rationale,
      "Sem abertura anterior, `undefined` grava `null` — e a guarda de emissão lê isso como AUSENTE.",
    ).toBeNull();
  });

  it("Relatório entregue não é alterado por regeneração nenhuma", async () => {
    const { cliente } = clienteFalso({ id: "report-1", delivered_at: "2026-08-01T10:00:00Z" });

    await expect(saveReport(cliente, "case-1", "selecao-1", undefined, [OPCAO])).rejects.toThrow(
      /já foi entregue/i,
    );
  });
});

describe("1.3 · A regra de decisão é a mesma da guarda de emissão (ADR-064)", () => {
  /**
   * O gerador do rascunho decide entre "escrever a frase de trabalho" e "não
   * mexer" **exatamente** por este predicado. Se ele passar a usar outro
   * critério, a guarda de emissão e o gerador divergem — e a divergência é
   * invisível até alguém perder o texto.
   */
  const preservaria = (gravado: string | null) => composicaoPendenteDoCurador(gravado) === null;

  it("texto do Curador é preservado", () => {
    expect(preservaria("Escolhi estes três porque a senhora precisa de continuidade.")).toBe(true);
  });

  it("frase do rascunho pode ser reescrita — é texto do sistema", () => {
    expect(preservaria(FRASE_COMPOSICAO_RASCUNHO)).toBe(false);
  });

  it("espaço em volta não transforma texto do sistema em texto humano", () => {
    expect(preservaria(`  ${FRASE_COMPOSICAO_RASCUNHO}  `)).toBe(false);
  });

  it("ausente e vazio podem ser reescritos", () => {
    expect(preservaria(null)).toBe(false);
    expect(preservaria("   ")).toBe(false);
  });
});
