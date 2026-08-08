import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PainelDeJuizo, type ConceitoDeJuizo } from "@/components/curadoria/mesa/painel-de-juizo";
import type { JulgamentoLido } from "@/modules/curadoria/julgamentos";

/**
 * ITEM 2.3 §16 — A SUPERFÍCIE MÍNIMA DO JUÍZO, SEM PRÉ-JULGAMENTO (G-2.3-5).
 *
 * O que se prova aqui é comportamento renderizado: o campo de conclusão
 * NASCE VAZIO mesmo quando existe juízo anterior superado nas props (o
 * cenário pós-JS3, onde o carry-forward tentaria nascer); o aguardo é
 * NOMEADO; o histórico aparece como histórico, nunca como minuta.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

afterEach(cleanup);

const SUPERADA: JulgamentoLido = {
  id: "j-1",
  subcriterionCode: "FORMACAO",
  natureza: "TECNICO",
  state: "SUPERADO",
  conclusao: "CONCLUSAO ANTERIOR QUE NAO PODE PRE-PREENCHER",
  motivo: null,
  versao: 1,
  versaoAnteriorId: null,
  actorId: "curador-1",
  actedAt: "2026-08-08T10:00:00Z",
  temSucessora: false,
  evidencias: [],
};

const CONCEITO_POS_JS3: ConceitoDeJuizo = {
  code: "FORMACAO",
  label: "Formação Profissional",
  natureza: "TECNICO",
  lacuna: "JUIZO_SUPERADO_POR_EVIDENCIA",
  vigente: null,
  historico: [SUPERADA],
  evidenciasCorrentes: [
    { id: "ev-1", version: 2, subcriterionCode: "FORMACAO_GRADUACAO", status: "verificado", resumo: "FORMACAO_GRADUACAO" },
  ],
  versaoBaseId: "j-1",
};

function montar(conceito: ConceitoDeJuizo) {
  render(
    <PainelDeJuizo
      caseId="case-1"
      profissionais={[
        { professionalProfileId: "prof-1", nome: "Dra. Exemplo", conceitos: [conceito] },
      ]}
    />,
  );
}

describe("G-2.3-5 · a conclusão nasce vazia — inclusive pós-JS3", () => {
  it("com juízo superado nas props, o textarea abre VAZIO — a conclusão anterior não vaza para o campo", () => {
    montar(CONCEITO_POS_JS3);
    const campo = screen.getByLabelText("Conclusão sobre Formação Profissional") as HTMLTextAreaElement;
    expect(campo.value).toBe("");
    expect(campo.placeholder).not.toContain("ANTERIOR");
  });

  it("o aguardo é NOMEADO: a superfície diz que a evidência nova superou o juízo", () => {
    montar(CONCEITO_POS_JS3);
    expect(screen.getByTestId("aguardo-FORMACAO").textContent).toContain(
      "Evidência nova superou o juízo anterior",
    );
  });

  it("a conclusão anterior aparece SÓ no histórico — como registro, nunca como proposta", () => {
    montar(CONCEITO_POS_JS3);
    const historico = screen.getByText(/Histórico \(1\)/);
    expect(historico).toBeTruthy();
    // O texto antigo existe na página (dentro do <details> de histórico)…
    expect(screen.getByText(/CONCLUSAO ANTERIOR/)).toBeTruthy();
    // …e NÃO dentro de nenhum campo editável.
    const campo = screen.getByLabelText("Conclusão sobre Formação Profissional") as HTMLTextAreaElement;
    expect(campo.value).not.toContain("CONCLUSAO ANTERIOR");
  });

  it("o botão só habilita com decisão explícita digitada — sem texto, sem ato", () => {
    montar(CONCEITO_POS_JS3);
    const botao = screen.getByRole("button", { name: "Registrar juízo" }) as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
  });

  it("sem evidência corrente, a incompletude é dita — julgar com ela visível é legítimo", () => {
    montar({ ...CONCEITO_POS_JS3, lacuna: "SEM_JUIZO", historico: [], evidenciasCorrentes: [], versaoBaseId: null });
    expect(screen.getByText(/incompletude visível é legítimo/)).toBeTruthy();
  });

  it("com vigente, a superfície mostra a conclusão como LEITURA e oferece a retirada ao autor", () => {
    montar({
      ...CONCEITO_POS_JS3,
      lacuna: null,
      vigente: { ...SUPERADA, id: "j-2", state: "VIGENTE", versao: 2, conclusao: "Conclusão vigente." },
      historico: [SUPERADA],
      versaoBaseId: "j-2",
    });
    expect(screen.getByText("Conclusão vigente.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retirar (só o autor)" })).toBeTruthy();
  });
});
