import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DocumentsPanel } from "@/components/profiles/documents-panel";

afterEach(cleanup);

describe("DocumentsPanel", () => {
  it("mostra o estado de acompanhamento (não frio) quando não há documentos", () => {
    render(
      <DocumentsPanel
        initialDocuments={[]}
        uploadAction={vi.fn()}
        onDelete={vi.fn()}
        emptyTitle="Você ainda não enviou nenhum documento."
        emptyDescription="Envie quando quiser, no seu tempo."
      />,
    );

    expect(screen.getByText("Você ainda não enviou nenhum documento.")).toBeInTheDocument();
  });

  it("remove o item da lista quando a remoção é bem-sucedida", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue({ success: true });

    render(
      <DocumentsPanel
        initialDocuments={[{ id: "doc-1", fileName: "exame.pdf", fileSize: 1024 }]}
        uploadAction={vi.fn()}
        onDelete={onDelete}
        emptyTitle="vazio"
        emptyDescription="vazio"
      />,
    );

    expect(screen.getByText("exame.pdf")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover exame.pdf" }));

    expect(onDelete).toHaveBeenCalledWith("doc-1");
  });
});
