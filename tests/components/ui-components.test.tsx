import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Tabs } from "@/components/ui/tabs";

describe("Button", () => {
  it("renderiza e respeita estado disabled", () => {
    render(<Button disabled>Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("mostra estado de loading", () => {
    render(<Button isLoading>Salvar</Button>);
    expect(screen.getByRole("button", { name: /Aguarde/ })).toHaveAttribute("aria-busy", "true");
  });
});

describe("Alert", () => {
  it("renderiza variante de erro com role alert", () => {
    render(<Alert variant="error">Mensagem de erro</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Mensagem de erro");
  });
});

describe("Dialog", () => {
  it("abre e fecha com botão", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Dialog open title="Confirmar" onClose={onClose}>
        Conteúdo
      </Dialog>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Fechar diálogo"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Drawer", () => {
  it("renderiza menu mobile quando aberto", () => {
    render(
      <Drawer open title="Menu" onClose={() => undefined}>
        Navegação
      </Drawer>,
    );

    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByText("Navegação")).toBeInTheDocument();
  });
});

describe("Tabs", () => {
  it("alterna abas selecionadas", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Tabs
        tabs={[
          { id: "a", label: "Aba A" },
          { id: "b", label: "Aba B" },
        ]}
        activeId="a"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Aba B" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
