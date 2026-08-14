import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProfessionalsTable } from "@/components/profiles/professionals-table";
import type { CicloDoProfissional } from "@/modules/profiles/ciclo-do-profissional";
import type { ProfessionalProfile } from "@/modules/profiles/types";

/**
 * OPS-G5 · CORTE 7 — o selo de elegibilidade efetiva.
 *
 * "Ativo" e "Publicado" são dois eixos que, somados, ainda deixavam a pergunta
 * sem resposta: esta pessoa pode ser apresentada a uma paciente AGORA? Um perfil
 * de demonstração podia aparecer "Ativo · Publicado" e passar por elegível.
 *
 * O que se mede aqui é o que a pessoa LÊ na linha — não o que o módulo calcula.
 */

afterEach(cleanup);

let contador = 0;
function profissional(sobre: Partial<ProfessionalProfile>): ProfessionalProfile {
  contador += 1;
  return {
    id: `id-${contador}`,
    profileId: null,
    status: "ativo",
    publicationStatus: "publicado",
    ciclo: "PUBLICADO_ATIVO" as CicloDoProfissional,
    isDemo: false,
    isTestFixture: false,
    displayName: `Profissional ${contador}`,
    professionalIdentifier: `ID-${contador}`,
    crm: null,
    crmUf: null,
    registrationStatus: null,
    registrationSource: null,
    registrationVerifiedAt: null,
    registrationVerifiedBy: null,
    professionalSummary: null,
    institutionName: null,
    experienceLevel: null,
    intakeApproach: null,
    offersContinuousCare: false,
    availabilityWindow: null,
    createdBy: null,
    updatedBy: null,
    createdAt: null,
    updatedAt: null,
    ...sobre,
  } as ProfessionalProfile;
}

describe("C7 · a linha diz se a pessoa pode ser apresentada agora", () => {
  it("publicado e ativo, sem marca de teste: elegível", () => {
    render(<ProfessionalsTable professionals={[profissional({})]} />);
    expect(screen.getByText("Elegível")).toBeInTheDocument();
  });

  it.each([
    ["PREPARACAO", "Em preparação"],
    ["PAUSADO", "Pausado"],
    ["RETIRADO_ARQUIVADO", "Retirado"],
  ] as const)("em %s, não é elegível e o motivo aparece", (ciclo, rotulo) => {
    render(<ProfessionalsTable professionals={[profissional({ ciclo })]} />);
    const selo = screen.getByText(/Não elegível/);
    expect(selo.textContent).toContain(rotulo);
  });

  it("perfil de demonstração não é elegível, mesmo publicado e ativo", () => {
    // Este é o caso que os dois eixos antigos deixavam passar: a linha dizia
    // "Ativo · Publicado" e nada avisava que era uma demonstração.
    render(<ProfessionalsTable professionals={[profissional({ isDemo: true })]} />);
    expect(screen.getByText("Publicado")).toBeInTheDocument();
    expect(screen.getByText(/Não elegível/).textContent).toContain("demonstração");
  });

  it("fixture de teste não é elegível", () => {
    render(<ProfessionalsTable professionals={[profissional({ isTestFixture: true })]} />);
    expect(screen.getByText(/Não elegível/).textContent).toContain("teste");
  });

  it("legado sem ciclo classificado é dito pendente de revisão, não elegível por omissão", () => {
    render(<ProfessionalsTable professionals={[profissional({ ciclo: null })]} />);
    expect(screen.getByText(/Não elegível/).textContent).toContain("revisão");
  });
});

describe("C7 · a coluna existe e não substitui as outras", () => {
  it("os três eixos convivem: status, publicação e elegibilidade", () => {
    render(<ProfessionalsTable professionals={[profissional({ ciclo: "PAUSADO" })]} />);
    expect(screen.getByRole("columnheader", { name: "Elegibilidade" })).toBeInTheDocument();
    // O histórico não é apagado: quem estava publicado continua marcado como
    // publicado, mesmo pausado. A elegibilidade é que carrega o veredito.
    expect(screen.getByText("Publicado")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText(/Não elegível/)).toBeInTheDocument();
  });
});
