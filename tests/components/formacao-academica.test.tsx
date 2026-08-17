import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FormacaoAcademicaBloco } from "@/components/patient/formacao-academica-bloco";
import { FormacaoAcademicaPanel } from "@/components/profiles/formacao-academica-panel";
import type { FormacaoEntrada, FormacaoPublica } from "@/modules/profiles/formacao-academica";

// As actions são server-side; aqui o painel só precisa que elas existam.
vi.mock("@/modules/profiles/formacao-academica-actions", () => ({
  lerCurriculoAction: vi.fn(async () => ({ success: true, data: null })),
  salvarFormacaoAction: vi.fn(async () => ({ success: true, data: null })),
  confirmarFormacaoAction: vi.fn(async () => ({ success: true, data: null })),
  excluirFormacaoAction: vi.fn(async () => ({ success: true, data: null })),
  criarFormacaoManualAction: vi.fn(async () => ({ success: true, data: null })),
}));

afterEach(cleanup);

const CONFIRMADAS: FormacaoPublica[] = [
  { kind: "graduacao", title: "Graduação em Medicina", institution: "Universidade Federal de Minas Gerais", city: "Belo Horizonte", country: "Brasil", periodStart: 2004, periodEnd: 2010 },
  { kind: "residencia", title: "Residência em Clínica Médica", institution: "Hospital das Clínicas", city: null, country: null, periodStart: 2010, periodEnd: 2013 },
  { kind: "especializacao", title: "Especialização em Reumatologia", institution: "USP", city: "São Paulo", country: null, periodStart: null, periodEnd: null },
  { kind: "fellowship", title: "Fellowship em Doenças Autoimunes", institution: null, city: null, country: null, periodStart: 2016, periodEnd: 2017 },
];

describe("FormacaoAcademicaBloco — o que o paciente vê", () => {
  it("as quatro formações aparecem com a INSTITUIÇÃO em evidência", () => {
    render(<FormacaoAcademicaBloco formacao={CONFIRMADAS} />);

    expect(screen.getByText("Graduação em Medicina")).toBeInTheDocument();
    expect(screen.getByText("Universidade Federal de Minas Gerais")).toBeInTheDocument();
    expect(screen.getByText("Residência em Clínica Médica")).toBeInTheDocument();
    expect(screen.getByText("Hospital das Clínicas")).toBeInTheDocument();
    expect(screen.getByText("Especialização em Reumatologia")).toBeInTheDocument();
    expect(screen.getByText("Fellowship em Doenças Autoimunes")).toBeInTheDocument();
    // Cidade/país/período quando existem:
    expect(screen.getByText("Belo Horizonte, Brasil")).toBeInTheDocument();
    expect(screen.getByText("2010–2013")).toBeInTheDocument();
    expect(screen.getByText("São Paulo")).toBeInTheDocument();
  });

  it("um selo só — e nenhum vestígio de fonte, documento ou método", () => {
    const { container } = render(<FormacaoAcademicaBloco formacao={CONFIRMADAS} />);
    expect(screen.getAllByText("Formação verificada pela equipe")).toHaveLength(1);

    const texto = container.textContent ?? "";
    for (const proibido of ["não informado", "PDF", "documento", "fonte", "http", "verified_by", "comprovação"]) {
      expect(texto.toLowerCase()).not.toContain(proibido.toLowerCase());
    }
  });

  it("ausência parcial é omissão — nenhum parágrafo vazio no bloco", () => {
    const { container } = render(<FormacaoAcademicaBloco formacao={[CONFIRMADAS[3]]} />);
    for (const p of Array.from(container.querySelectorAll("p"))) {
      expect(p.textContent?.trim()).not.toBe("");
    }
    // Fellowship sem instituição: só tipo, título e período.
    expect(screen.getByText("2016–2017")).toBeInTheDocument();
  });

  it("sem formação confirmada, o bloco NÃO existe — nem selo, nem seção", () => {
    const { container } = render(<FormacaoAcademicaBloco formacao={[]} />);
    expect(container.textContent).toBe("");
  });
});

const ENTRADA: FormacaoEntrada = {
  id: "e1",
  professionalProfileId: "prof-1",
  kind: "residencia",
  title: "Residência em Clínica Médica",
  institution: "Hospital das Clínicas",
  city: null,
  country: null,
  periodStart: 2010,
  periodEnd: 2013,
  notes: null,
  verificationStatus: "nao_verificado",
  verifiedAt: null,
  origem: { documentId: "doc-1", humanEdited: false },
};

describe("FormacaoAcademicaPanel — a mesa de revisão abre PREENCHIDA", () => {
  it("os campos nascem com os dados propostos pela leitura — a equipe confere, não redigita", () => {
    render(
      <FormacaoAcademicaPanel
        professionalProfileId="prof-1"
        entradas={[ENTRADA]}
        curriculos={[{ documentId: "doc-1", fileName: "curriculo.pdf", ultimaLeitura: { status: "concluida", erro: null } }]}
      />,
    );

    expect(screen.getByDisplayValue("Residência em Clínica Médica")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hospital das Clínicas")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2010")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2013")).toBeInTheDocument();
    expect(screen.getByText("Proposta pela leitura do currículo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar esta formação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ler currículo e propor formações" })).toBeInTheDocument();
  });

  it("currículo visual é dito com todas as letras", () => {
    render(
      <FormacaoAcademicaPanel
        professionalProfileId="prof-1"
        entradas={[]}
        curriculos={[{ documentId: "doc-2", fileName: "cv-imagem.pdf", ultimaLeitura: { status: "falha", erro: "requer_pdf_textual" } }]}
      />,
    );
    expect(screen.getByText("Requer currículo em PDF textual ou DOCX")).toBeInTheDocument();
  });

  it("entrada verificada não oferece nova confirmação", () => {
    render(
      <FormacaoAcademicaPanel
        professionalProfileId="prof-1"
        entradas={[{ ...ENTRADA, verificationStatus: "verificado", verifiedAt: "2026-08-17T00:00:00Z" }]}
        curriculos={[]}
      />,
    );
    expect(screen.getByText("Verificada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar esta formação" })).toBeNull();
  });
});
