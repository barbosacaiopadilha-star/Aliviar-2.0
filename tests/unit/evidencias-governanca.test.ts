import { describe, expect, it } from "vitest";

import {
  EVIDENCE_VALIDITY_LABELS,
  classifyEvidenceValidity,
  operationalPhrase,
} from "@/modules/curadoria/evidencias-pratica";

/**
 * GOVERNANÇA DA BASE — validade derivada e frases operacionais.
 *
 * O que se pina: validade é cálculo (nunca coluna), "próximo do vencimento"
 * são os últimos 20% da janela do conceito, evidência não verificada fica
 * SEM_DATA (não tem verificação a vencer), e cada frase operacional descreve
 * o estado da informação — nenhuma fala da qualidade do profissional.
 */

const AGORA = "2026-08-01T00:00:00.000Z";

describe("classifyEvidenceValidity — derivada, nunca gravada", () => {
  it("custo (3 meses): válido, próximo do vencimento nos últimos 20%, vencido depois", () => {
    const verificada = "2026-05-01T00:00:00.000Z"; // vence 2026-08-01
    expect(
      classifyEvidenceValidity("VIABILIDADE_CUSTO_E_PAGAMENTO", "verificado", verificada, "2026-06-01T00:00:00.000Z"),
    ).toBe("VALIDO");
    expect(
      classifyEvidenceValidity("VIABILIDADE_CUSTO_E_PAGAMENTO", "verificado", verificada, "2026-07-20T00:00:00.000Z"),
    ).toBe("PROXIMO_DO_VENCIMENTO");
    expect(
      classifyEvidenceValidity("VIABILIDADE_CUSTO_E_PAGAMENTO", "verificado", verificada, AGORA),
    ).toBe("VENCIDO");
  });

  it("graduação (60 meses, estável) permanece válida por anos", () => {
    expect(
      classifyEvidenceValidity("FORMACAO_GRADUACAO", "verificado", "2026-01-01T00:00:00.000Z", "2029-01-01T00:00:00.000Z"),
    ).toBe("VALIDO");
  });

  it("evidência não verificada não tem validade a vencer — SEM_DATA, que é a verdade", () => {
    expect(
      classifyEvidenceValidity("ACESSO_MODALIDADE", "nao_verificado", null, AGORA),
    ).toBe("SEM_DATA");
    expect(
      classifyEvidenceValidity("ACESSO_MODALIDADE", "verificado", null, AGORA),
    ).toBe("SEM_DATA");
    expect(classifyEvidenceValidity("CONCEITO_FANTASMA", "verificado", AGORA, AGORA)).toBe("SEM_DATA");
  });

  it("os quatro estados têm rótulo humano", () => {
    expect(Object.keys(EVIDENCE_VALIDITY_LABELS)).toHaveLength(4);
  });
});

describe("operationalPhrase — estado da informação, nunca qualidade", () => {
  const base = { subcriterionCode: "CONTINUIDADE_RETORNOS" };

  it("cada estado tem sua frase, e a de vencida vem do cálculo", () => {
    expect(operationalPhrase({ ...base, status: "nao_verificado", verifiedAt: null }, AGORA)).toBe(
      "Informação declarada pelo profissional, ainda não verificada pela operação.",
    );
    expect(
      operationalPhrase({ ...base, status: "verificado", verifiedAt: "2026-07-31T12:00:00.000Z" }, AGORA),
    ).toBe("Informação verificada em 2026-07-31, com base em fonte registrada pela operação.");
    expect(
      operationalPhrase(
        { subcriterionCode: "VIABILIDADE_CUSTO_E_PAGAMENTO", status: "verificado", verifiedAt: "2026-04-01T00:00:00.000Z" },
        AGORA,
      ),
    ).toBe("A última verificação desta informação está vencida e precisa ser atualizada.");
    expect(operationalPhrase({ ...base, status: "divergente", verifiedAt: null }, AGORA)).toBe(
      "A informação declarada diverge da fonte consultada. A análise permanece pendente.",
    );
    expect(operationalPhrase({ ...base, status: "desatualizado", verifiedAt: null }, AGORA)).toContain(
      "desatualizada",
    );
    expect(operationalPhrase({ ...base, status: "nao_localizado", verifiedAt: null }, AGORA)).toContain(
      "não foi localizada",
    );
  });

  it("nenhuma frase fala da qualidade do profissional nem de compatibilidade", () => {
    const estados = ["nao_verificado", "verificado", "divergente", "desatualizado", "nao_localizado"];
    for (const status of estados) {
      const frase = operationalPhrase({ ...base, status, verifiedAt: AGORA }, AGORA);
      expect(frase).not.toMatch(/ótimo|excelente|confiável|atualizado que|atende|combina|compatível|%/i);
    }
  });
});
