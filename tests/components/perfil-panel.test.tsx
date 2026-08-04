import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PerfilPanel } from "@/components/paciente/perfil-panel";
import { montarCadeiaDeProveniencia } from "@/modules/curadoria/cadeia-de-proveniencia";
import { SUBCRITERION_CATALOG } from "@/modules/curadoria/mapa-prioridades";
import { buildPerfilView, violatesPatientVocabulary } from "@/modules/paciente/experiencia";

afterEach(cleanup);

/** O que ela declarou — ADR-042: níveis, nunca pontos. */
// G1/suíte-estável: fixture atualizado para os códigos do Catálogo 1.0.0
// (ADR-046). Três códigos do catálogo anterior foram renomeados
// (EXPERIENCIA_CASOS_SEMELHANTES→EXPERIENCIA_NO_TIPO_DE_CASO,
// ACESSO_LOCALIZACAO→ACESSO_LOCAL_DE_ATENDIMENTO,
// HISTORICO_PRODUCAO_ACADEMICA→HISTORICO_ATIVIDADE_ACADEMICA); com códigos
// mortos, buildPerfilView filtrava os níveis e o teste estava vermelho na tag.
const MAPA = [
  { subcriterionCode: "FORMACAO_RESIDENCIA", importance: "MUITO_IMPORTANTE" as const },
  { subcriterionCode: "EXPERIENCIA_NO_TIPO_DE_CASO", importance: "MUITO_IMPORTANTE" as const },
  { subcriterionCode: "CONTINUIDADE_RETORNOS", importance: "IMPORTANTE" as const },
  { subcriterionCode: "MODELO_COMUNICACAO", importance: "IMPORTANTE" as const },
  { subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", importance: "RELEVANTE" as const },
  { subcriterionCode: "HISTORICO_ATIVIDADE_ACADEMICA", importance: "NAO_INFLUENCIA" as const },
];

/** Mapa completo: os 26 do catálogo ativo classificados. É o único gate do ato. */
const MAPA_COMPLETO = SUBCRITERION_CATALOG.map((sub) => ({
  subcriterionCode: sub.code,
  importance: "IMPORTANTE" as const,
}));

describe("PerfilPanel — o que mais importa, nas palavras dela", () => {
  it("agrupa os fatores pelos níveis que ela declarou", () => {
    render(<PerfilPanel perfil={buildPerfilView(MAPA, true)} />);

    expect(screen.getByText("O que mais importa para o seu caso")).toBeInTheDocument();
    expect(screen.getByText("Muito importante")).toBeInTheDocument();
    expect(screen.getByText("Importante")).toBeInTheDocument();
    expect(screen.getByText("Relevante")).toBeInTheDocument();

    expect(screen.getByText("Residência médica")).toBeInTheDocument();
    expect(screen.getByText("Experiência no tipo de caso")).toBeInTheDocument();
    expect(screen.getByText("Como explica")).toBeInTheDocument();
  });

  it("não esconde o que ela deixou de fora", () => {
    render(<PerfilPanel perfil={buildPerfilView(MAPA, true)} />);
    expect(screen.getByText("Não influencia este caso")).toBeInTheDocument();
    expect(screen.getByText("Atividade acadêmica")).toBeInTheDocument();
  });

  it("nenhum ponto, porcentagem ou barra de progresso sobrou", () => {
    const { container } = render(<PerfilPanel perfil={buildPerfilView(MAPA, true)} />);
    const texto = container.textContent ?? "";

    expect(screen.queryByRole("progressbar")).toBeNull();
    for (const proibido of ["pts", "pontos", "%", "orçamento", "peso"]) {
      expect(texto.toLowerCase(), `mecanismo interno vazou: ${proibido}`).not.toContain(proibido);
    }
    expect(texto, "nenhum número na tela dela").not.toMatch(/\d/);
  });

  it("mapa vazio: diz que está em consolidação, sem simular retrato pronto", () => {
    render(<PerfilPanel perfil={buildPerfilView([], false)} />);
    expect(screen.getByText(/você verá aqui o que foi considerado mais importante/)).toBeInTheDocument();
  });

  it("com o Mapa completo, o ato é dela e está na tela dela — ADR-042", () => {
    // Antes esta tela mandava esperar o Curador registrar por ela. O ato é
    // dela; oferecê-lo aqui é o que torna o consentimento real.
    render(<PerfilPanel perfil={buildPerfilView(MAPA_COMPLETO, false)} caseId="caso-1" />);
    expect(
      screen.getByRole("button", {
        name: /Confirmar que este Perfil representa minhas prioridades/,
      }),
    ).toBeInTheDocument();
  });

  it("sem o Case identificado, nenhum botão aparece — nunca um ato sem destino", () => {
    render(<PerfilPanel perfil={buildPerfilView(MAPA_COMPLETO, false)} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("Mapa incompleto explica o estado em vez de oferecer o ato", () => {
    const parcial = buildPerfilView(MAPA.slice(0, 1), false);
    render(<PerfilPanel perfil={parcial} caseId="caso-1" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(/ainda está sendo construído/)).toBeInTheDocument();
  });

  it("validado, some a pergunta e a frase muda de dono", () => {
    render(<PerfilPanel perfil={buildPerfilView(MAPA, true)} />);
    expect(screen.queryByText(/depois desse seu sim/)).toBeNull();
    expect(screen.getByText(/Este Perfil é seu/)).toBeInTheDocument();
  });

  it("o painel inteiro respeita o vocabulário do paciente", () => {
    const { container } = render(<PerfilPanel perfil={buildPerfilView(MAPA, true)} />);
    expect(violatesPatientVocabulary(container.textContent ?? "")).toBeNull();
  });
});

/**
 * ETAPA 2B — A SUPERFÍCIE VIVA DO RECONHECIMENTO.
 *
 * A superfície antiga é a lista de níveis: ela mostra o que ficou registrado
 * SEM a fala dela ao lado — o achado P8, reconhecer uma tradução sem ver a
 * tradução. Enquanto o ato é dela, a comparação toma o lugar da lista. As duas
 * nunca coexistem: dois retratos do mesmo Perfil na mesma tela seriam dois
 * fluxos concorrentes.
 */
describe("Etapa 2B — a comparação substitui a lista enquanto o ato é dela", () => {
  const CADEIA = montarCadeiaDeProveniencia({
    subcriterionCode: "MODELO_COMUNICACAO",
    pessoa: {
      declaracao: {
        degree: "ESSENCIAL",
        options: ["explicacao_simples"],
        declaredBy: "perfil-paciente",
        declaredAt: "2026-08-01T10:00:00Z",
      },
      importancia: {
        importance: "IMPORTANTE",
        declaredBy: "Dra. Ana",
        registradoEm: "2026-08-02T09:00:00Z",
      },
    },
    profissional: { estado: null },
  });

  const LINHAS = [
    {
      subcriterionCode: "MODELO_COMUNICACAO",
      label: "Como explica",
      declaracao: {
        grau: "É essencial para você",
        opcoes: ["Com palavras simples"],
        em: "2026-08-01T10:00:00Z",
        autor: "perfil-paciente",
      },
      registro: {
        importancia: "Importante",
        autor: "Dra. Ana",
        registradoEm: "2026-08-02T09:00:00Z",
      },
      cadeia: CADEIA,
    },
  ];

  const TECNICOS = [
    {
      subcriterionCode: "FORMACAO_RESIDENCIA",
      label: "Residência médica",
      importancia: "Muito importante",
      autor: "Dra. Ana",
      registradoEm: "2026-08-02T09:00:00Z",
    },
  ];

  it("com o modelo e o ato pendente, ela vê as duas colunas", () => {
    render(
      <PerfilPanel
        perfil={buildPerfilView(MAPA_COMPLETO, false)}
        caseId="c1"
        linhas={LINHAS}
        tecnicos={TECNICOS}
      />,
    );

    expect(screen.getByText("O que você disse")).toBeInTheDocument();
    expect(screen.getByText("O que ficou registrado")).toBeInTheDocument();
  });

  it("o terceiro bloco aparece junto, com a procedência dita por inteiro", () => {
    render(
      <PerfilPanel
        perfil={buildPerfilView(MAPA_COMPLETO, false)}
        caseId="c1"
        linhas={LINHAS}
        tecnicos={TECNICOS}
      />,
    );

    expect(screen.getByText("O que a Curadoria considerou por conta própria")).toBeInTheDocument();
    expect(screen.getByText(/nada aqui veio de você/)).toBeInTheDocument();
  });

  it("a lista antiga sai de cena — nunca os dois retratos ao mesmo tempo", () => {
    const { container } = render(
      <PerfilPanel
        perfil={buildPerfilView(MAPA_COMPLETO, false)}
        caseId="c1"
        linhas={LINHAS}
        tecnicos={TECNICOS}
      />,
    );

    // A lista antiga é a dos cabeçalhos de nível. Se ela ainda estivesse na
    // tela, o mesmo conceito apareceria duas vezes, com duas caras.
    expect(screen.queryByRole("heading", { name: "Muito importante" })).not.toBeInTheDocument();
    expect(container.textContent).not.toContain(
      "Estes níveis representam apenas a importância",
    );
  });

  it("B7 · só confirmar é oferecido — nenhuma ação das etapas futuras aparece", () => {
    const { container } = render(
      <PerfilPanel
        perfil={buildPerfilView(MAPA_COMPLETO, false)}
        caseId="c1"
        linhas={LINHAS}
        tecnicos={TECNICOS}
      />,
    );

    const texto = container.textContent ?? "";
    for (const aindaNao of ["Discordar", "Corrigir", "Deixar pendente", "Não reconheço"]) {
      expect(texto, `"${aindaNao}" ainda não foi implementado (2C/2D)`).not.toContain(aindaNao);
    }
    // O ato que JÁ existe continua na tela dela.
    expect(texto).toContain("Este retrato representa corretamente");
  });

  it("depois do reconhecimento, a lista volta a ser o retrato", () => {
    render(
      <PerfilPanel
        perfil={buildPerfilView(MAPA_COMPLETO, true)}
        caseId="c1"
        linhas={LINHAS}
        tecnicos={TECNICOS}
      />,
    );

    expect(screen.queryByText("O que você disse")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Importante" })).toBeInTheDocument();
  });

  it("sem modelo, o painel segue como antes — rollback é simplesmente não passar linhas", () => {
    render(<PerfilPanel perfil={buildPerfilView(MAPA, false)} caseId="c1" />);

    expect(screen.queryByText("O que você disse")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Muito importante" })).toBeInTheDocument();
  });

  it("o painel inteiro segue respeitando o vocabulário dela", () => {
    const { container } = render(
      <PerfilPanel
        perfil={buildPerfilView(MAPA_COMPLETO, false)}
        caseId="c1"
        linhas={LINHAS}
        tecnicos={TECNICOS}
      />,
    );

    expect(violatesPatientVocabulary(container.textContent ?? "")).toBeNull();
  });
});
