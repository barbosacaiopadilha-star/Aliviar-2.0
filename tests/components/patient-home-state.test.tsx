import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PatientHomeState } from "@/components/paciente/patient-home-state";

afterEach(cleanup);

describe("PatientHomeState", () => {
  // G1/suíte-estável: a release certificada aponta o CTA para
  // /sua-historia/continuar (retomada unificada); oráculo estava
  // defasado e vermelho na tag.
  it("no_story: mostra convite para começar e link para /sua-historia/continuar", () => {
    render(<PatientHomeState state={{ kind: "no_story" }} />);

    expect(
      screen.getByRole("heading", { name: "Este espaço começa com a sua história." }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Contar minha história" })).toHaveAttribute(
      "href",
      "/sua-historia/continuar",
    );
  });

  it("draft: mostra continuidade e link para /sua-historia/continuar", () => {
    render(<PatientHomeState state={{ kind: "draft" }} />);

    expect(screen.getByRole("heading", { name: "Sua história continua aqui." })).toBeVisible();
    expect(screen.getByRole("link", { name: "Continuar minha história" })).toHaveAttribute(
      "href",
      "/sua-historia/continuar",
    );
  });

  it("submitted_without_case: mostra confirmação de envio sem nenhuma ação", () => {
    render(<PatientHomeState state={{ kind: "submitted_without_case" }} />);

    expect(screen.getByRole("heading", { name: "Sua história já está conosco." })).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("submitted_without_case: nunca afirma que a curadoria começou ou que houve revisão", () => {
    render(<PatientHomeState state={{ kind: "submitted_without_case" }} />);

    for (const forbidden of ["curadoria começou", "ACE", "revisad", "profissional selecionado"]) {
      expect(screen.queryByText(forbidden, { exact: false })).not.toBeInTheDocument();
    }
  });

  it("case_available: renderiza o statusLabel oficial sem reinterpretar e sem ação principal", () => {
    render(
      <PatientHomeState
        state={{ kind: "case_available", statusLabel: "Sua curadoria está em andamento." }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Seu cuidado está em andamento." })).toBeVisible();
    expect(screen.getByText("Sua curadoria está em andamento.")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("case_available: nunca expõe IDs, enum ou termos técnicos internos", () => {
    render(
      <PatientHomeState
        state={{ kind: "case_available", statusLabel: "Sua curadoria está em andamento." }}
      />,
    );

    for (const forbidden of [
      "caseId",
      "IN_CURATION",
      "P00",
      "protocolo",
      "current_stage",
      "method_version",
      "ACE",
    ]) {
      expect(screen.queryByText(forbidden, { exact: false })).not.toBeInTheDocument();
    }
  });
});
