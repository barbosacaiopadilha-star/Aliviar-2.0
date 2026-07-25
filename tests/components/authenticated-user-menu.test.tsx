import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthenticatedUserMenu } from "@/components/auth/authenticated-user-menu";

// O botão Sair envia a server action; aqui só interessa o CONTRATO do menu —
// a ação em si é coberta por tests/unit/sign-out-action.test.ts.
vi.mock("@/modules/auth/actions", () => ({ signOutAction: vi.fn() }));

afterEach(cleanup);

function renderMenu() {
  return render(<AuthenticatedUserMenu displayName="Helena Souza" roleLabel="Curador Médico" />);
}

describe("AuthenticatedUserMenu — o componente único de usuário autenticado", () => {
  it("mostra nome e papel de quem está logado", () => {
    renderMenu();
    expect(screen.getAllByText("Helena Souza").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Curador Médico").length).toBeGreaterThan(0);
  });

  it("abre como menu acessível, com Alterar senha, separador e Sair", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { expanded: false });
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Alterar senha" })).toHaveAttribute(
      "href",
      "/recuperar-senha",
    );
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  // Quem navega por teclado não pode ficar preso num menu aberto.
  it("Escape fecha o menu e devolve o foco ao gatilho", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { expanded: false });
    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("abre e opera só com teclado", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.tab();
    expect(screen.getByRole("button", { expanded: false })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole("menuitem", { name: "Alterar senha" })).toHaveFocus();
  });
});
