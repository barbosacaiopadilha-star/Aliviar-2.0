import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FilaPorAtoDevido } from "@/components/curadoria/fila-por-ato-devido";
import type { FatosDaFila } from "@/modules/curadoria/fila-por-ato-devido";

/**
 * T-12-3 · A COMPOSIÇÃO REAL DA FILA.
 *
 * O derivador puro já prova que a classificação está certa. O que este arquivo
 * prova é a outra metade — que a TELA mostra o que ele decidiu, e só isso.
 * Foi essa metade que faltou em `CuradoriaDecisionPanel`, em `SemCuradoria` e em
 * `mandatory-filters`: lógica correta que ninguém alcançava, ou tela mostrando
 * o que a lógica não autorizava.
 */

afterEach(cleanup);

const QUANDO = "2026-08-12T10:00:00.000Z";

function caso(id: string, nome: string, sobre: Partial<FatosDaFila> = {}): FatosDaFila {
  return {
    caseId: id,
    patientName: nome,
    status: "IN_CURATION",
    closedAt: null,
    understandingConfirmedAt: null,
    priorityProfileId: null,
    meetingHeldAt: null,
    validatedAt: null,
    reportEmittedAt: null,
    reportDeliveredAt: null,
    decisionAt: null,
    legadoSemCuradoria: false,
    ...sobre,
  };
}

const CONFIRMADO = { understandingConfirmedAt: QUANDO, priorityProfileId: "p" };
const RECONHECIDO = { ...CONFIRMADO, meetingHeldAt: QUANDO, validatedAt: QUANDO };

const DEZ: FatosDaFila[] = [
  caso("c1", "Ana Sintética"),
  caso("c2", "Bruna Sintética", CONFIRMADO),
  caso("c3", "Carla Sintética", { ...CONFIRMADO, meetingHeldAt: QUANDO }),
  caso("c4", "Diva Sintética", RECONHECIDO),
  caso("c5", "Elza Sintética", RECONHECIDO),
  caso("c6", "Fabi Sintética", { ...RECONHECIDO, reportEmittedAt: QUANDO }),
  caso("c7", "Gabi Sintética", { ...RECONHECIDO, reportEmittedAt: QUANDO, reportDeliveredAt: QUANDO }),
  caso("c8", "Hilda Sintética", { ...RECONHECIDO, reportEmittedAt: QUANDO, reportDeliveredAt: QUANDO, decisionAt: QUANDO }),
  caso("c9", "Iara Sintética", { ...RECONHECIDO, reportEmittedAt: QUANDO, reportDeliveredAt: QUANDO, decisionAt: QUANDO }),
  caso("c10", "Joana Sintética", { ...RECONHECIDO, reportEmittedAt: QUANDO, reportDeliveredAt: QUANDO, decisionAt: QUANDO }),
];

const TITULOS = [
  "Aguarda Acolhimento",
  "Aguarda o Primeiro Encontro",
  "Aguarda o reconhecimento dela",
  "Curadoria em curso",
  "Aguarda entrega",
  "Aguarda a decisão dela",
  "Com o Concierge",
];

describe("T-12-3 · a Fila desenha os sete grupos", () => {
  it("os sete cabeçalhos aparecem, na ordem do contrato", () => {
    render(<FilaPorAtoDevido casos={DEZ} />);
    const cabecalhos = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(cabecalhos).toEqual(TITULOS);
  });

  it("cada grupo traz a sua contagem, em texto", () => {
    render(<FilaPorAtoDevido casos={DEZ} />);
    const esperado: Record<string, string> = {
      "Aguarda Acolhimento": "1 Caso",
      "Aguarda o Primeiro Encontro": "1 Caso",
      "Aguarda o reconhecimento dela": "1 Caso",
      "Curadoria em curso": "2 Casos",
      "Aguarda entrega": "1 Caso",
      "Aguarda a decisão dela": "1 Caso",
      "Com o Concierge": "3 Casos",
    };
    for (const [titulo, contagem] of Object.entries(esperado)) {
      const secao = screen.getByRole("heading", { name: titulo }).closest("section")!;
      expect(within(secao).getByText(contagem), `contagem errada em "${titulo}"`).toBeTruthy();
    }
  });

  it("os dez Casos aparecem, cada um uma única vez", () => {
    render(<FilaPorAtoDevido casos={DEZ} />);
    for (const c of DEZ) {
      expect(screen.getAllByRole("heading", { name: c.patientName })).toHaveLength(1);
    }
  });

  it("grupo vazio não some: vira UMA linha, com o zero à vista", () => {
    // 2ª passada de 24/08 · o vazio deixou de gastar três linhas (título +
    // ato + frase) e virou título esmaecido + "0". A doutrina que este
    // oráculo guarda é a MESMA: os sete grupos sempre visíveis.
    render(<FilaPorAtoDevido casos={[caso("c1", "Ana Sintética")]} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(7);
    const vazio = screen.getByRole("heading", { name: "Curadoria em curso" }).closest("section")!;
    expect(within(vazio).getByText("0")).toBeTruthy();
    expect(within(vazio).queryByText(/Nenhuma Curadoria/)).toBeNull();
  });

  it("Fila inteiramente vazia continua com os sete grupos", () => {
    render(<FilaPorAtoDevido casos={[]} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(7);
    expect(screen.getByText("Nenhum Caso ativo.")).toBeTruthy();
  });

  it("Caso encerrado e entrega legada não aparecem em lugar nenhum", () => {
    render(
      <FilaPorAtoDevido
        casos={[
          caso("cr11", "Encerrada Sintética", { status: "CLOSED", closedAt: QUANDO }),
          caso("cr12", "Legada Sintética", { legadoSemCuradoria: true }),
          caso("c1", "Ana Sintética"),
        ]}
      />,
    );
    expect(screen.queryByText("Encerrada Sintética")).toBeNull();
    expect(screen.queryByText("Legada Sintética")).toBeNull();
    expect(screen.getByText("Ana Sintética")).toBeTruthy();
    expect(screen.getByText("1 Caso ativo, agrupado pelo ato devido.")).toBeTruthy();
  });
});

describe("T-12-3 · a Fila não cria autoridade que não existe", () => {
  /** O ato é dela: a tela informa, e não oferece caminho para executá-lo. */
  it("\"Aguarda o reconhecimento dela\" não tem CTA de execução", () => {
    render(<FilaPorAtoDevido casos={DEZ} />);
    const secao = screen.getByRole("heading", { name: "Aguarda o reconhecimento dela" }).closest("section")!;

    expect(within(secao).queryByRole("button")).toBeNull();
    for (const proibido of [/reconhecer/i, /validar/i, /confirmar/i, /aprovar/i, /marcar como/i]) {
      expect(secao.textContent, `a Fila ofereceu ao Curador: ${proibido}`).not.toMatch(proibido);
    }
    // Existe caminho para LER, e ele diz "ver", não "abrir para agir".
    const links = within(secao).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]!.textContent).toBe("Ver o caso");
  });

  it("\"Aguarda a decisão dela\" também não oferece nada a executar", () => {
    render(<FilaPorAtoDevido casos={DEZ} />);
    const secao = screen.getByRole("heading", { name: "Aguarda a decisão dela" }).closest("section")!;
    expect(within(secao).queryByRole("button")).toBeNull();
    expect(within(secao).getAllByRole("link")[0]!.textContent).toBe("Ver o caso");
    expect(secao.textContent).toMatch(/A escolha é dela, no tempo dela\./);
  });

  it("os grupos do Curador oferecem continuar — direto na etapa devida", () => {
    // ADR-086 §5 · "Abrir o caso" virou "Continuar", aterrissando na etapa
    // do ato (Acolhimento, Mesa ou Relatório) em vez do saguão.
    render(<FilaPorAtoDevido casos={DEZ} />);
    const destinos: Record<string, string> = {
      "Aguarda Acolhimento": "/acolhimento",
      "Curadoria em curso": "/mesa",
      "Aguarda entrega": "/relatorio",
    };
    for (const [titulo, destino] of Object.entries(destinos)) {
      const secao = screen.getByRole("heading", { name: titulo }).closest("section")!;
      const link = within(secao).getAllByRole("link")[0]!;
      expect(link.textContent, titulo).toMatch(/Continuar/);
      expect(link.getAttribute("href"), titulo).toContain(destino);
    }
  });
});

describe("T-12-3 · nada de clínico, nada de prazo", () => {
  it("a tela renderizada não contém prazo, SLA nem urgência", () => {
    const { container } = render(<FilaPorAtoDevido casos={DEZ} />);
    const texto = container.textContent ?? "";
    for (const padrao of [/atrasad/i, /\bSLA\b/i, /\bprazo\b/i, /há \d+ dias?/i, /\burgent/i, /\bhoje\b/i, /\d+\s*horas?/i]) {
      expect(texto, `a Fila prometeu tempo: ${padrao}`).not.toMatch(padrao);
    }
  });

  it("nenhum ID interno aparece como texto", () => {
    const { container } = render(<FilaPorAtoDevido casos={DEZ} />);
    const texto = container.textContent ?? "";
    for (const c of DEZ) {
      expect(texto, "o caseId vazou para a tela").not.toContain(c.caseId);
    }
  });

  it("a contagem é legível sem cor — é texto, não só um badge", () => {
    render(<FilaPorAtoDevido casos={DEZ} />);
    const secao = screen.getByRole("heading", { name: "Com o Concierge" }).closest("section")!;
    expect(secao.textContent).toContain("3 Casos");
  });

  it("cada grupo é uma região nomeada pelo próprio título", () => {
    render(<FilaPorAtoDevido casos={DEZ} />);
    for (const titulo of TITULOS) {
      const cabecalho = screen.getByRole("heading", { name: titulo });
      const secao = cabecalho.closest("section")!;
      expect(secao.getAttribute("aria-labelledby")).toBe(cabecalho.id);
    }
  });
});
