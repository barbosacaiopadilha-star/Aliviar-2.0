import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AcolhimentoWorkspace } from "@/components/curadoria/acolhimento-workspace";

/**
 * ITEM 1.5 — os dois checkboxes saíram (P13).
 *
 * A tela deixou de pedir que o Curador AFIRMASSE ter lido e passou a receber o
 * que ele extraiu do material (M-001 §1.1, M-003 §4 e §5). Este arquivo foi
 * reescrito porque testava exatamente a cerimônia removida.
 */

const action = vi.hoisted(() => vi.fn(async () => ({ success: true as const })));
vi.mock("@/modules/curadoria/actions", () => ({ registerAcolhimentoAction: action }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(() => {
  cleanup();
  action.mockClear();
});

const CASE_ID = "11111111-1111-1111-1111-111111111111";
const HREF = "/coa/curadoria/casos/x/historia";

function renderWs(
  props: Partial<React.ComponentProps<typeof AcolhimentoWorkspace>> = {},
) {
  return render(
    <AcolhimentoWorkspace
      caseId={CASE_ID}
      meetingHeldAt={null}
      knownFacts={[]}
      openPendencies={[]}
      hasSubmittedStory
      hasLinkedDocument={false}
      preparado={false}
      nextPhaseHref={HREF}
      {...props}
    />,
  );
}

describe("Ramo A — há material: registrar o que se extraiu", () => {
  it("nenhum checkbox de revisão sobrevive na tela", () => {
    renderWs();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText(/Revisei/i)).toBeNull();
  });

  it("registrar fica indisponível enquanto não houver nenhum item", async () => {
    const user = userEvent.setup();
    renderWs();

    const registrar = screen.getByRole("button", { name: "Registrar preparação" });
    expect(registrar).toBeDisabled();

    await user.type(screen.getByLabelText(/O que já se sabe/), "Mora em outra cidade.");
    expect(registrar).toBeEnabled();
  });

  it("envia uma lista por linha, descartando linhas em branco", async () => {
    const user = userEvent.setup();
    renderWs();

    await user.type(
      screen.getByLabelText(/O que já se sabe/),
      "Acompanha o pai.{enter}   {enter}Mora em outra cidade.",
    );
    await user.type(screen.getByLabelText(/O que ficou em aberto/), "Falta o exame citado.");
    await user.click(screen.getByRole("button", { name: "Registrar preparação" }));

    expect(action).toHaveBeenCalledWith({
      caseId: CASE_ID,
      knownFacts: ["Acompanha o pai.", "Mora em outra cidade."],
      openPendencies: ["Falta o exame citado."],
    });
  });

  it("só pendência já basta — a disjunção do M-001 §2.1 vale na tela", async () => {
    const user = userEvent.setup();
    renderWs();

    await user.type(screen.getByLabelText(/O que ficou em aberto/), "Exame não veio anexado.");
    await user.click(screen.getByRole("button", { name: "Registrar preparação" }));

    expect(action).toHaveBeenCalledWith({
      caseId: CASE_ID,
      knownFacts: [],
      openPendencies: ["Exame não veio anexado."],
    });
  });

  it("o registro já feito volta para os campos, e prosseguir aparece quando preparado", () => {
    renderWs({ knownFacts: ["Acompanha o pai."], preparado: true });

    expect(screen.getByLabelText(/O que já se sabe/)).toHaveValue("Acompanha o pai.");
    expect(screen.getByRole("link", { name: /Prosseguir para a História/ })).toHaveAttribute(
      "href",
      HREF,
    );
  });
});

describe("Ramo B — não há material: nenhuma cerimônia", () => {
  it("não pede nada e deixa prosseguir — corrige o P-3", () => {
    renderWs({ hasSubmittedStory: false, hasLinkedDocument: false, preparado: true });

    expect(screen.queryByRole("button", { name: /Registrar/ })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("link", { name: /Prosseguir para a História/ })).toHaveAttribute(
      "href",
      HREF,
    );
  });

  it("diz que não há material — nunca que não foi revisado (I-8)", () => {
    renderWs({ hasSubmittedStory: false, hasLinkedDocument: false, preparado: true });

    expect(screen.getByText(/Ainda não há material desta pessoa para revisar/)).toBeInTheDocument();
    expect(screen.queryByText(/não foi revisad/i)).toBeNull();
  });

  it("avisa que material posterior reabre a etapa (M-001 §6.3)", () => {
    renderWs({ hasSubmittedStory: false, hasLinkedDocument: false, preparado: true });
    expect(screen.getByText(/volta a pedir o registro/)).toBeInTheDocument();
  });

  it("documento vinculado sozinho já é material — o formulário aparece", () => {
    renderWs({ hasSubmittedStory: false, hasLinkedDocument: true });
    expect(screen.getByRole("button", { name: "Registrar preparação" })).toBeInTheDocument();
  });
});
