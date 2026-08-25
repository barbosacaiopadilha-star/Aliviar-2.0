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

// ---------------------------------------------------------------------------
// A travessia do Curador de 25/08 — o limite invisível e o beco sem saída
// ---------------------------------------------------------------------------
//
// Dois defeitos encontrados percorrendo uma Curadoria de verdade pela tela:
//
// 1. O `maxLength` de 280 já existia e funcionava — mas a parede era MUDA.
//    Quem escrevia uma conclusão pensada via o campo simplesmente parar de
//    aceitar letra, sem contador e sem explicação. A regra é do Método (a
//    conclusão É o juízo: expressa, curta); uma tela que tem regra e não a
//    conta faz a regra parecer defeito de teclado.
//
// 2. `registrarJulgamentoAction` devolve `detalhe` com a causa técnica
//    sanitizada — e a tela o DESCARTAVA. Toda falha virava "não foi possível
//    concluir o ato agora", sem caminho nenhum. É a família FS-07, que a
//    auditoria de agosto varreu do produto e que sobreviveu aqui.

describe("Travessia de 25/08 · o limite do Método é dito, não adivinhado", () => {
  it("o contador aparece desde o campo vazio — saber quanto cabe muda o que se escreve", () => {
    montar(CONCEITO_POS_JS3);
    expect(screen.getByText("0 de 280")).toBeTruthy();
  });

  it("o campo continua limitado em 280 — o contador não substitui a trava", () => {
    montar(CONCEITO_POS_JS3);
    const campo = screen.getByLabelText("Conclusão sobre Formação Profissional") as HTMLTextAreaElement;
    expect(campo.maxLength).toBe(280);
  });

  it("no limite, a frase explica de quem é a regra — não é o teclado que travou", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const usuario = userEvent.setup();
    montar(CONCEITO_POS_JS3);
    const campo = screen.getByLabelText("Conclusão sobre Formação Profissional");

    await usuario.type(campo, "x".repeat(285));

    expect((campo as HTMLTextAreaElement).value.length).toBe(280);
    expect(screen.getByText(/280 de 280 — o limite do Método/)).toBeTruthy();
  });
});

describe("Travessia de 25/08 · o erro deixa de ser beco sem saída", () => {
  it("com ERRO_TECNICO, o motivo técnico aparece — não só a frase genérica", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const actions = await import("@/modules/curadoria/julgamento-actions");
    const espia = vi.spyOn(actions, "registrarJulgamentoAction").mockResolvedValue({
      desfecho: "ERRO_TECNICO",
      versaoId: null,
      detalhe: "a conclusão excede o limite de 280 caracteres",
    });

    const usuario = userEvent.setup();
    montar(CONCEITO_POS_JS3);

    await usuario.type(screen.getByLabelText("Conclusão sobre Formação Profissional"), "Minha conclusão.");
    await usuario.click(screen.getByRole("button", { name: "Registrar juízo" }));

    expect(await screen.findByText(/Não foi possível concluir o ato agora/)).toBeTruthy();
    // O que faltava: o CAMINHO. Sem isto, o Curador perde o ato sem saber por quê.
    expect(await screen.findByText(/Motivo: a conclusão excede o limite/)).toBeTruthy();

    espia.mockRestore();
  });

  it("num desfecho que NÃO é falha, nenhum detalhe técnico polui a tela", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const actions = await import("@/modules/curadoria/julgamento-actions");
    const espia = vi.spyOn(actions, "registrarJulgamentoAction").mockResolvedValue({
      desfecho: "VERSAO_JA_GRAVADA",
      versaoId: "j-2",
      detalhe: "ruido tecnico que nao deve aparecer",
    });

    const usuario = userEvent.setup();
    montar(CONCEITO_POS_JS3);

    await usuario.type(screen.getByLabelText("Conclusão sobre Formação Profissional"), "Minha conclusão.");
    await usuario.click(screen.getByRole("button", { name: "Registrar juízo" }));

    expect(await screen.findByText(/já estava gravado/)).toBeTruthy();
    expect(screen.queryByText(/ruido tecnico/)).toBeNull();

    espia.mockRestore();
  });
});
