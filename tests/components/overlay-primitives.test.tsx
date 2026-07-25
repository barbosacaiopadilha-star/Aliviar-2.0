import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";

// Os DOIS primitivos de sobreposição da plataforma. Todo modal e todo menu
// lateral passam por aqui — se o contrato deles quebrar, quebra em todas as
// superfícies ao mesmo tempo. Por isso o contrato fica pinado em teste:
// Escape fecha, o foco entra ao abrir e VOLTA ao fechar, e o papel ARIA é o
// de diálogo modal de verdade.

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir diálogo
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Confirmar ação">
        <p>Conteúdo do diálogo</p>
      </Dialog>
    </>
  );
}

function DrawerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir gaveta
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Menu">
        <p>Conteúdo da gaveta</p>
      </Drawer>
    </>
  );
}

afterEach(cleanup);

describe("Dialog — primitivo modal", () => {
  it("abre como diálogo modal com título acessível", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abrir diálogo" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Confirmar ação")).toBeInTheDocument();
  });

  it("move o foco para dentro ao abrir e devolve ao gatilho ao fechar", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole("button", { name: "Abrir diálogo" });
    await user.click(trigger);

    // O foco entra no diálogo (botão de fechar) — leitor de tela anuncia o
    // contexto novo em vez de continuar preso atrás do overlay.
    expect(screen.getByRole("button", { name: "Fechar diálogo" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("fecha pelo botão Fechar", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole("button", { name: "Abrir diálogo" }));
    await user.click(screen.getByRole("button", { name: "Fechar diálogo" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Drawer — primitivo de painel lateral", () => {
  it("abre como diálogo modal e fecha com Escape devolvendo o foco", async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);

    const trigger = screen.getByRole("button", { name: "Abrir gaveta" });
    await user.click(trigger);

    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Conteúdo da gaveta")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("fecha pelo botão Fechar menu", async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    await user.click(screen.getByRole("button", { name: "Abrir gaveta" }));
    await user.click(screen.getByRole("button", { name: "Fechar menu" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
