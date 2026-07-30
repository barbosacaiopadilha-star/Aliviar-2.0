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

describe("interação completa do menu (Polimento 2026-07-24)", () => {
  it("clicar fora fecha o menu", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <AuthenticatedUserMenu displayName="Helena Souza" roleLabel="Curador Médico" />
        <button type="button">Fora</button>
      </div>,
    );
    await user.click(screen.getByRole("button", { expanded: false }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fora" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Sair recebe foco e dispara o envio do logout — e o menu não fecha antes", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { expanded: false }));

    const sair = screen.getByRole("button", { name: "Sair" });
    sair.focus();
    expect(sair).toHaveFocus();

    // O clique DENTRO do menu não pode fechá-lo antes do handler: o form de
    // logout precisa continuar montado no momento do submit.
    const form = sair.closest("form");
    expect(form).not.toBeNull();
    let submissoes = 0;
    form!.addEventListener("submit", (e) => {
      e.preventDefault();
      submissoes += 1;
    });

    await user.click(sair);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(submissoes).toBe(1);
  });

  it("não existe nesting inválido de elementos interativos", async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole("button", { expanded: false }));
    // O menu vive em PORTAL no body — a varredura precisa olhar o documento
    // inteiro, não o container do render.
    expect(document.body.querySelectorAll("button button, button a, a button, a a").length).toBe(0);
  });

  it("o gatilho tem nome acessível mesmo quando o texto some no mobile", () => {
    renderMenu();
    expect(
      screen.getByRole("button", { name: /Menu do usuário — Helena Souza, Curador Médico/ }),
    ).toBeInTheDocument();
  });
});

// Regressão do bug de produção (clique morto nos itens): o menu DEVE render
// em portal como filho direto do body. Dentro de um header com stacking
// context (backdrop-filter sem z-index), o dropdown era pintado atrás do
// conteúdo da página e o mouse não o alcançava.
it("o menu renderiza em portal, fora de qualquer stacking context de header", async () => {
  const user = userEvent.setup();
  renderMenu();
  await user.click(screen.getByRole("button", { expanded: false }));
  const menu = screen.getByRole("menu");
  expect(menu.parentElement).toBe(document.body);
});
