import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { rotaEhMedida } from "@/components/landing/analytics-gate";

/**
 * ADR-056 (D-10) item 2 · O ANALYTICS NÃO ENTRA NA CASA.
 *
 * A decisão é de 2026-08-02: *"o analytics deverá ser removido das rotas
 * autenticadas — permanecerá apenas na landing pública, preservando a métrica
 * de aquisição sem tocar dado de quem já é paciente."* A implementação estava
 * endereçada ao Bloco H, que não aconteceu, e até esta rodada o
 * `<Analytics/>` seguia no layout raiz — isto é, em toda rota do produto.
 *
 * A URL visitada por quem já é paciente é indício de condição de saúde. Este
 * arquivo é a trava: se alguém devolver o componente ao layout raiz, ou
 * incluir uma rota clínica na lista de permissão, um destes casos morde.
 */

const RAIZ = process.cwd();

function ler(arquivo: string): string {
  return readFileSync(path.join(RAIZ, arquivo), "utf-8");
}

describe("ADR-056 · o analytics vive na Fachada, nunca na casa", () => {
  it("o layout raiz não carrega analytics — é ele que alcança toda rota", () => {
    const raiz = ler("src/app/layout.tsx");

    expect(raiz).not.toContain("@vercel/analytics");
    expect(raiz).not.toContain("<Analytics");
  });

  it("o único ponto de montagem do analytics é o gate da Fachada", () => {
    const gate = ler("src/components/landing/analytics-gate.tsx");
    const layoutPublico = ler("src/app/(public)/layout.tsx");

    expect(gate).toContain("@vercel/analytics");
    expect(layoutPublico).toContain("<AnalyticsGate />");
  });

  it("mede a Fachada: a Landing, o pedido e o portal legal", () => {
    expect(rotaEhMedida("/")).toBe(true);
    expect(rotaEhMedida("/solicitar-atendimento")).toBe(true);
    expect(rotaEhMedida("/privacidade")).toBe(true);
    expect(rotaEhMedida("/termos")).toBe(true);
    expect(rotaEhMedida("/termos/profissional")).toBe(true);
    expect(rotaEhMedida("/legal/privacidade/v/1")).toBe(true);
  });

  it("não mede a conversa: `/sua-historia` é onde a pessoa conta o que vive", () => {
    expect(rotaEhMedida("/sua-historia")).toBe(false);
    expect(rotaEhMedida("/sua-historia/historia")).toBe(false);
    expect(rotaEhMedida("/sua-historia/motivo")).toBe(false);
  });

  it("não mede nenhuma superfície autenticada", () => {
    for (const rota of [
      "/paciente",
      "/paciente/relatorio",
      "/portal-curador/casos/abc",
      "/coa/curadoria",
      "/admin/profissionais",
      "/acompanhamento",
      "/profissional",
    ]) {
      expect(rotaEhMedida(rota), `${rota} não pode ser medida`).toBe(false);
    }
  });

  it("o padrão é não medir: rota desconhecida fica de fora", () => {
    expect(rotaEhMedida("/rota-que-alguem-vai-criar-amanha")).toBe(false);
  });

  it("`/` não vaza por prefixo — senão a lista mediria o produto inteiro", () => {
    expect(rotaEhMedida("/paciente/documentos")).toBe(false);
  });
});
