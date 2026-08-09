import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MesaSteps } from "@/components/curadoria/mesa/mesa-steps";
import { PainelDeJuizo, type ConceitoDeJuizo } from "@/components/curadoria/mesa/painel-de-juizo";
import {
  MARCA_DA_ETAPA,
  MARCA_DO_AGUARDO,
  MARCA_DO_DESFECHO,
} from "@/components/curadoria/mesa/gramatica-de-estados";
import type { MesaEtapaState } from "@/modules/curadoria/mesa-etapas";

/**
 * ORIENTAÇÃO VISUAL DA MESA — nível ESSENCIAL
 * (`AUDITORIA_UX_MESA_DE_CURADORIA` §13).
 *
 * E-1 · a pendência que só o leitor de tela recebia passa a ser vista.
 * E-2 · a cor ganha gramática: estrutura → atenção → resolução → impedimento.
 * E-3 · evidência não é pintada de verde/vermelho.
 *
 * Nada aqui testa domínio: nenhuma regra, contagem ou estado mudou.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/modules/curadoria/julgamento-actions", () => ({
  registrarJulgamentoAction: async () => ({ desfecho: "JUIZO_REGISTRADO", versaoId: "j-1" }),
  retirarJulgamentoAction: async () => ({ desfecho: "JUIZO_RETIRADO", versaoId: null }),
}));

afterEach(cleanup);

function etapa(
  id: MesaEtapaState["id"],
  status: MesaEtapaState["status"],
  pending: string | null,
  waitingOn: string | null = null,
): MesaEtapaState {
  return { id, label: id, question: `Pergunta de ${id}`, status, pending, waitingOn };
}

const ETAPAS: MesaEtapaState[] = [
  etapa("PERFIL", "PRONTA", null),
  etapa("REDE", "PENDENTE", "Declarar a área de 2 profissionais."),
  etapa("AVALIACAO", "AGUARDA", null, "Depende de haver ao menos um profissional elegível."),
];

function montarTrilha(atual: MesaEtapaState["id"], proxima: MesaEtapaState["id"]) {
  render(<MesaSteps etapas={ETAPAS} atual={atual} proxima={proxima} onSelecionar={vi.fn()} />);
}

describe("E-1 · a trilha mostra a pendência a quem enxerga", () => {
  it("a frase de `pending` da etapa ativa aparece VISUALMENTE, não só em sr-only", () => {
    montarTrilha("REDE", "REDE");
    const visiveis = screen.getAllByText("Declarar a área de 2 profissionais.");
    // Uma no `sr-only` do botão, outra no bloco visual abaixo da trilha.
    expect(visiveis.length).toBeGreaterThanOrEqual(1);
    const bloco = document.querySelector(".mesa-steps__pendencias");
    expect(bloco).toBeTruthy();
    expect(bloco?.textContent).toContain("Declarar a área de 2 profissionais.");
  });

  it("`waitingOn` aparece quando a etapa depende de outra", () => {
    montarTrilha("AVALIACAO", "AVALIACAO");
    const bloco = document.querySelector(".mesa-steps__pendencias");
    expect(bloco?.textContent).toContain("Depende de haver ao menos um profissional elegível.");
  });

  it("a próxima decisão também aparece, quando não é a etapa ativa", () => {
    montarTrilha("PERFIL", "REDE");
    const bloco = document.querySelector(".mesa-steps__pendencias");
    expect(bloco?.textContent).toContain("REDE");
    expect(bloco?.textContent).toContain("Declarar a área de 2 profissionais.");
  });

  it("no máximo DUAS linhas — revelar as seis recriaria o muro de texto", () => {
    montarTrilha("PERFIL", "REDE");
    expect(document.querySelectorAll(".mesa-steps__pendencia").length).toBeLessThanOrEqual(2);
  });

  it("etapa sem pendência não produz ruído — o bloco simplesmente não existe", () => {
    montarTrilha("PERFIL", "PERFIL");
    expect(document.querySelector(".mesa-steps__pendencias")).toBeNull();
  });

  it("nada é duplicado para o leitor de tela: o bloco visual é aria-hidden", () => {
    montarTrilha("REDE", "REDE");
    expect(document.querySelector(".mesa-steps__pendencias")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("o `sr-only` da trilha PERMANECE — E-1 acrescenta ao vidente, não remove do leitor", () => {
    montarTrilha("REDE", "REDE");
    const srOnly = [...document.querySelectorAll(".sr-only")].map((n) => n.textContent ?? "");
    expect(srOnly.some((t) => t.includes("aguarda você"))).toBe(true);
    expect(srOnly.some((t) => t.includes("Declarar a área de 2 profissionais."))).toBe(true);
    expect(srOnly.some((t) => t.includes("depende de outra etapa"))).toBe(true);
  });

  it("o teclado e o foco seguem intactos: cada etapa continua um botão", () => {
    montarTrilha("REDE", "REDE");
    expect(screen.getAllByRole("button")).toHaveLength(ETAPAS.length);
    expect(screen.getByRole("navigation", { name: "Etapas da Curadoria Técnica" })).toBeTruthy();
  });
});

describe("E-2 · a gramática de estados", () => {
  it("cada estado tem cor E sinal — a interface sobrevive em escala de cinza", () => {
    for (const marca of [
      ...Object.values(MARCA_DA_ETAPA),
      ...Object.values(MARCA_DO_AGUARDO),
      ...Object.values(MARCA_DO_DESFECHO),
    ]) {
      expect(marca.sinal.length).toBeGreaterThan(0);
      expect(marca.papel.length).toBeGreaterThan(0);
    }
  });

  it("a trilha deixa de ter uma cor só: respondida é resolvida, pendente é atenção", () => {
    expect(MARCA_DA_ETAPA.PRONTA.papel).toBe("resolvido");
    expect(MARCA_DA_ETAPA.PENDENTE.papel).toBe("atencao");
    // AGUARDA é "ainda não é a vez" — nunca bloqueio, nunca impedimento.
    expect(MARCA_DA_ETAPA.AGUARDA.papel).toBe("neutro");

    montarTrilha("REDE", "REDE");
    const marcas = [...document.querySelectorAll(".mesa-step__marca")].map((n) => n.className);
    expect(marcas[0]).toContain("mesa-estado--resolvido");
    expect(marcas[1]).toContain("mesa-estado--atencao");
    expect(marcas[2]).toContain("mesa-estado--neutro");
  });

  it("`VERSAO_JA_GRAVADA` é SUCESSO idempotente — jamais tratado como erro", () => {
    expect(MARCA_DO_DESFECHO.VERSAO_JA_GRAVADA.papel).not.toBe("impedimento");
    expect(MARCA_DO_DESFECHO.VERSAO_JA_GRAVADA.papel).toBe("neutro");
    expect(MARCA_DO_DESFECHO.VERSAO_JA_GRAVADA.sinal).toBe("=");
  });

  it("`JUIZO_SUPERADO_POR_EVIDENCIA` é atualidade — jamais falha", () => {
    expect(MARCA_DO_AGUARDO.JUIZO_SUPERADO_POR_EVIDENCIA.papel).toBe("atencao");
    expect(MARCA_DO_AGUARDO.JUIZO_SUPERADO_POR_EVIDENCIA.papel).not.toBe("impedimento");
  });

  it("conflito, ausência de autoridade e erro técnico são impedimento", () => {
    expect(MARCA_DO_DESFECHO.CONFLITO_DE_VERSAO.papel).toBe("impedimento");
    expect(MARCA_DO_DESFECHO.SEM_AUTORIDADE.papel).toBe("impedimento");
    expect(MARCA_DO_DESFECHO.ERRO_TECNICO.papel).toBe("impedimento");
  });

  it("sucesso não recebe tratamento de erro", () => {
    expect(MARCA_DO_DESFECHO.JUIZO_REGISTRADO.papel).toBe("resolvido");
    expect(MARCA_DO_DESFECHO.JUIZO_REGISTRADO.papel).not.toBe("impedimento");
  });

  it("retirar um juízo devolve o conceito à atenção — não é perda nem falha", () => {
    expect(MARCA_DO_DESFECHO.JUIZO_RETIRADO.papel).toBe("atencao");
    expect(MARCA_DO_AGUARDO.JUIZO_RETIRADO.papel).toBe("atencao");
  });

  it("o aguardo do conceito recebe âmbar e sinal, sem virar erro", () => {
    const conceito: ConceitoDeJuizo = {
      code: "FORMACAO",
      label: "Formação Profissional",
      natureza: "TECNICO",
      lacuna: "JUIZO_SUPERADO_POR_EVIDENCIA",
      vigente: null,
      historico: [],
      evidenciasCorrentes: [],
      versaoBaseId: null,
    };
    render(
      <PainelDeJuizo
        caseId="case-1"
        profissionais={[
          { professionalProfileId: "prof-1", nome: "Dra. Exemplo", conceitos: [conceito] },
        ]}
      />,
    );
    const aguardo = screen.getByTestId("aguardo-FORMACAO");
    // O texto original de MOTIVO_DO_AGUARDO permanece intacto.
    expect(aguardo.textContent).toContain("Evidência nova superou o juízo anterior");
    expect(aguardo.innerHTML).toContain("mesa-estado--atencao");
    expect(aguardo.innerHTML).not.toContain("mesa-estado--impedimento");
  });
});

describe("E-3 · evidência sem código verde/vermelho", () => {
  const arquivos = [
    "src/components/curadoria/mesa/leitura-relacional-panel.tsx",
    "src/components/curadoria/mesa/evidencia-chips.tsx",
  ];

  it("nenhuma leitura de evidência é pintada de verde ou vermelho", async () => {
    const { readFileSync } = await import("node:fs");
    for (const arquivo of arquivos) {
      const fonte = readFileSync(arquivo, "utf8");
      for (const proibido of [
        "emerald",
        "green",
        "text-red",
        "bg-red",
        "border-red",
        "rose-",
        "color-success",
        "color-error",
      ]) {
        expect(fonte.includes(proibido), `${arquivo} codifica evidência com ${proibido}`).toBe(
          false,
        );
      }
    }
  });

  it("as leituras continuam distintas — por forma, não por cor", async () => {
    const { readFileSync } = await import("node:fs");
    const fonte = readFileSync(arquivos[0], "utf8");
    // Sólida, pontilhada, tracejada, apagada, dupla: cinco formas distintas.
    for (const forma of ["border-dotted", "border-dashed", "border-double"]) {
      expect(fonte.includes(forma), `perdeu a distinção por forma: ${forma}`).toBe(true);
    }
  });

  it("âmbar só onde falta ATO HUMANO — nunca em leitura de evidência", async () => {
    const { readFileSync } = await import("node:fs");
    const fonte = readFileSync(arquivos[0], "utf8");
    const tons = fonte.slice(fonte.indexOf("const TOM_CLASSES"), fonte.indexOf("export function"));
    // `juizo` (aguarda o Curador) é o único com a cor de atenção.
    expect(tons.match(/color-attention/g) ?? []).toHaveLength(1);
    expect(tons.slice(tons.indexOf("juizo:"))).toContain("color-attention");
  });
});
