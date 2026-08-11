import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CentralDeDocumentos } from "@/components/paciente/documentos/central-de-documentos";
import {
  montarCentralDeDocumentos,
  type CuradoriaDaCentral,
  type EntradaDaCentral,
  type HistoriaDaCentral,
} from "@/modules/paciente/central-de-documentos";

/**
 * A6 · AS GUARDAS DA CENTRAL DE DOCUMENTOS.
 *
 * Os itens **nunca** são escritos à mão nestes testes: eles saem da projeção
 * oficial (`montarCentralDeDocumentos`), a mesma que a página usa. Se a tela e
 * a projeção discordarem um dia, é aqui que aparece — e um teste que montasse
 * `DocumentCenterItem` na mão não teria como perceber.
 *
 * O que estas guardas defendem:
 *
 * - **A tela não classifica.** Ela recebe categoria, classe e capacidade
 *   prontas; o que ela faz é apresentar.
 * - **Artefato não ganha download de arquivo**, e o portão de `deliveredAt`
 *   continua sendo o único caminho para a Curadoria aparecer.
 * - **Recebido não se remove.** A ação de excluir só existe no que é dela.
 * - **Nenhum metadado interno atravessa** — nem no texto, nem em atributo.
 * - **Sua História nunca é chamada de questionário.**
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/modules/profiles/patient-document-actions", () => ({
  uploadPatientDocumentAction: vi.fn(),
  deletePatientDocumentAction: vi.fn(),
  obterLinkDeDocumentoAction: vi.fn(),
}));

afterEach(cleanup);

const PACIENTE = "11111111-1111-1111-1111-111111111111";
const CURADOR = "33333333-3333-3333-3333-333333333333";
const CASE = "44444444-4444-4444-4444-444444444444";

function curadoria(over: Partial<CuradoriaDaCentral["relatorio"]>, presentedAt: string | null = null): CuradoriaDaCentral {
  return {
    relatorio: { emittedAt: null, deliveredAt: null, options: [{ p: 1 }], ...over },
    devolutiva: { presentedAt },
  };
}

const historia = (over: Partial<HistoriaDaCentral> = {}): HistoriaDaCentral => ({
  status: "rascunho",
  submittedAt: null,
  updatedAt: "2026-08-02T09:00:00Z",
  ...over,
});

/** Renderiza a Central a partir da PROJEÇÃO, nunca de itens inventados. */
function renderizar(entrada: Partial<EntradaDaCentral> = {}) {
  const itens = montarCentralDeDocumentos({
    patientProfileId: PACIENTE,
    documentos: [],
    curadoria: null,
    historia: null,
    ...entrada,
  });
  return render(<CentralDeDocumentos itens={itens} />);
}

const enviadoPorEla = {
  id: "doc-dela",
  profileId: PACIENTE,
  uploadedBy: PACIENTE,
  fileName: "ressonancia-lombar.pdf",
  createdAt: "2026-08-01T10:00:00Z",
};

const recebidoDaAliviar = {
  id: "doc-recebido",
  profileId: PACIENTE,
  uploadedBy: CURADOR,
  fileName: "orientacoes.pdf",
  createdAt: "2026-08-03T10:00:00Z",
};

function secao(nome: RegExp) {
  return screen.getByRole("heading", { name: nome, level: 2 }).closest("section") as HTMLElement;
}

describe("A6 · Central de Documentos", () => {
  // -------------------------------------------------------------------------
  describe("T-A6-5 / T-A6-6 · cada documento na sua área", () => {
    // O nome do arquivo aparece DUAS vezes de propósito: visível no título e
    // no rótulo `sr-only` da ação, para o leitor de tela ouvir "Baixar exame"
    // em vez de só "Baixar". Por isso a asserção é sobre o conteúdo da seção,
    // não sobre unicidade do texto.
    it("T-A6-5 · o upload dela aparece em Enviados por você", () => {
      renderizar({ documentos: [enviadoPorEla] });

      expect(secao(/Enviados por você/).textContent).toContain("ressonancia-lombar.pdf");
    });

    it("T-A6-6 · o depósito da Aliviar aparece em Recebidos da Aliviar", () => {
      renderizar({ documentos: [recebidoDaAliviar] });

      const recebidos = secao(/Recebidos da Aliviar/);
      expect(recebidos.textContent).toContain("orientacoes.pdf");
      expect(recebidos.textContent).toContain("Disponibilizado pela Aliviar");
    });

    it("os dois convivem sem se misturar", () => {
      renderizar({ documentos: [enviadoPorEla, recebidoDaAliviar] });

      expect(secao(/Enviados por você/).textContent).not.toContain("orientacoes.pdf");
      expect(secao(/Recebidos da Aliviar/).textContent).not.toContain("ressonancia-lombar.pdf");
    });

    it("§17 · o que ela recebeu vem primeiro; sem recebidos, a área vazia não ocupa o topo", () => {
      const { unmount } = renderizar({ documentos: [recebidoDaAliviar] });
      let titulos = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
      expect(titulos[0]).toMatch(/Recebidos da Aliviar/);
      unmount();

      renderizar({ documentos: [enviadoPorEla] });
      titulos = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
      expect(titulos[0]).toMatch(/Enviados por você/);
    });
  });

  // -------------------------------------------------------------------------
  describe("T-A6-1 / T-A6-2 · arquivo tem ação de arquivo; artefato não", () => {
    it("T-A6-1 · documento recebido oferece baixar, com o nome no rótulo acessível", () => {
      renderizar({ documentos: [recebidoDaAliviar] });

      const acao = within(secao(/Recebidos da Aliviar/)).getByRole("button", { name: /Baixar/ });

      // O leitor de tela ouve o nome do arquivo junto do verbo — "Baixar" sozinho,
      // repetido em cada linha, não diria o que está sendo baixado.
      expect(acao.textContent).toContain("orientacoes.pdf");
    });

    it("T-A6-2 · a Curadoria entregue não oferece download de arquivo", () => {
      renderizar({ curadoria: curadoria({ deliveredAt: "2026-08-05T10:00:00Z" }) });

      const recebidos = secao(/Recebidos da Aliviar/);
      expect(within(recebidos).getByRole("link", { name: /Abrir/ })).toBeInTheDocument();
      // "Levar em PDF" é a tela imprimível que já existe — e é link, não
      // download de objeto do storage.
      expect(within(recebidos).getByRole("link", { name: /Levar em PDF/ })).toBeInTheDocument();
      expect(within(recebidos).queryByRole("button", { name: /Baixar/ })).toBeNull();
    });

    it("Sua História não oferece download enquanto GAP-A6-Q1 estiver aberto", () => {
      renderizar({ historia: historia() });

      const area = secao(/Sua História e formulários/);
      expect(within(area).queryByRole("button", { name: /Baixar/ })).toBeNull();
      expect(within(area).getByText(/sem versão para baixar por enquanto/)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  describe("T-A6-3 / T-A6-4 · o portão da Curadoria", () => {
    it("T-A6-3 · emitida e não entregue não aparece", () => {
      renderizar({ curadoria: curadoria({ emittedAt: "2026-08-04T10:00:00Z" }) });

      expect(screen.queryByText("Sua Curadoria")).toBeNull();
    });

    it("T-A6-4 · apresentada e não entregue não aparece", () => {
      renderizar({
        curadoria: curadoria({ emittedAt: "2026-08-04T10:00:00Z" }, "2026-08-05T10:00:00Z"),
      });

      expect(screen.queryByText("Sua Curadoria")).toBeNull();
    });

    it("entregue com conteúdo real aparece", () => {
      renderizar({ curadoria: curadoria({ deliveredAt: "2026-08-06T10:00:00Z" }) });

      expect(secao(/Recebidos da Aliviar/).textContent).toContain("Sua Curadoria");
    });
  });

  // -------------------------------------------------------------------------
  describe("T-A6-7 / T-A6-8 / T-A6-9 · Sua História", () => {
    it("T-A6-7 · rascunho oferece Continuar", () => {
      renderizar({ historia: historia({ status: "rascunho" }) });

      const area = secao(/Sua História e formulários/);
      expect(within(area).getByRole("link", { name: /Continuar/ })).toHaveAttribute(
        "href",
        "/sua-historia/continuar",
      );
    });

    it("T-A6-8 · enviada oferece Rever", () => {
      renderizar({ historia: historia({ status: "enviada", submittedAt: "2026-08-06T10:00:00Z" }) });

      const area = secao(/Sua História e formulários/);
      expect(within(area).getByRole("link", { name: /Rever/ })).toHaveAttribute(
        "href",
        "/sua-historia/revisao",
      );
    });

    it("T-A6-9 · a palavra questionário não existe em lugar nenhum da tela", () => {
      const { container } = renderizar({
        documentos: [enviadoPorEla, recebidoDaAliviar],
        curadoria: curadoria({ deliveredAt: "2026-08-06T10:00:00Z" }),
        historia: historia({ status: "enviada" }),
      });

      expect(container.textContent?.toLowerCase()).not.toContain("question");
    });

    it("§10 · sem outro formulário real, a área não inventa placeholder", () => {
      renderizar({ historia: historia() });

      const area = secao(/Sua História e formulários/);
      expect(within(area).getAllByRole("listitem")).toHaveLength(1);
      expect(area.textContent).not.toMatch(/em breve/i);
    });
  });

  // -------------------------------------------------------------------------
  describe("T-A6-10 · nada interno atravessa", () => {
    it("nem no texto, nem em atributo do DOM", () => {
      const { container } = renderizar({
        documentos: [enviadoPorEla, recebidoDaAliviar],
        curadoria: curadoria({ deliveredAt: "2026-08-06T10:00:00Z" }),
        historia: historia(),
      });

      const html = container.innerHTML;
      expect(html).not.toContain(CURADOR);
      expect(html).not.toContain(CASE);
      expect(html).not.toContain("patient-documents");
      expect(html).not.toContain("received/");
      expect(html).not.toContain("uploaded_by");
      // Nem o id da paciente: ele é o caminho da pasta dela no storage.
      expect(html).not.toContain(PACIENTE);
    });

    it("nenhuma URL assinada é renderizada — o link nasce no clique", () => {
      const { container } = renderizar({ documentos: [recebidoDaAliviar] });

      expect(container.innerHTML).not.toContain("token=");
      expect(container.innerHTML).not.toContain("/storage/v1/");
    });
  });

  // -------------------------------------------------------------------------
  describe("§14 · remover só o que é dela", () => {
    it("o upload dela pode ser removido", () => {
      renderizar({ documentos: [enviadoPorEla] });

      expect(
        within(secao(/Enviados por você/)).getByRole("button", { name: /Remover/ }),
      ).toBeInTheDocument();
    });

    it("o recebido da Aliviar NÃO oferece remover", () => {
      renderizar({ documentos: [recebidoDaAliviar] });

      expect(within(secao(/Recebidos da Aliviar/)).queryByRole("button", { name: /Remover/ })).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("A6-1 · a Central vazia fala como gente", () => {
    it("cada área diz o que vai acontecer, não que não há registros", () => {
      const { container } = renderizar();

      expect(screen.getByText(/Quando a Aliviar disponibilizar um documento/)).toBeInTheDocument();
      expect(screen.getByText(/Os documentos que você enviar ficam reunidos aqui/)).toBeInTheDocument();

      const texto = container.textContent ?? "";
      for (const proibido of ["No data", "Nenhum registro", "0 arquivos", "0 itens"]) {
        expect(texto).not.toContain(proibido);
      }
    });

    it("a regra de arquivo é dita ANTES de escolher, não depois da recusa", () => {
      renderizar();

      expect(screen.getByText("PDF, JPEG, PNG ou WebP · até 20 MB")).toBeInTheDocument();
      expect(screen.getByLabelText("Escolher arquivo")).toHaveAttribute(
        "accept",
        "application/pdf,image/jpeg,image/png,image/webp",
      );
      // O campo real continua existindo e associado — só a moldura do
      // navegador saiu de cena.
      expect(screen.getByLabelText("Escolher arquivo")).toHaveAttribute("type", "file");
    });
  });

  // -------------------------------------------------------------------------
  describe("acessibilidade", () => {
    it("cada área é um H2 e uma lista semântica", () => {
      renderizar({ documentos: [enviadoPorEla, recebidoDaAliviar], historia: historia() });

      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(3);
      expect(screen.getAllByRole("list").length).toBeGreaterThanOrEqual(3);
    });
  });
});
