import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { usePaginatedFilter } from "@/components/admin/use-paginated-filter";

afterEach(cleanup);

type Item = { name: string };

const ITEMS: Item[] = Array.from({ length: 25 }, (_, index) => ({ name: `Pessoa ${index + 1}` }));
ITEMS.push({ name: "Maria Especial" });

function Harness() {
  const { query, setQuery, page, totalPages, pageItems, totalMatches } = usePaginatedFilter(
    ITEMS,
    (item, q) => item.name.toLowerCase().includes(q),
  );

  return (
    <div>
      <input aria-label="busca" value={query} onChange={(event) => setQuery(event.target.value)} />
      <p>
        Página {page} de {totalPages} — {totalMatches} resultados
      </p>
      <ul>
        {pageItems.map((item) => (
          <li key={item.name}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

describe("usePaginatedFilter", () => {
  it("pagina a lista completa em páginas de 10 itens", () => {
    render(<Harness />);
    expect(screen.getByText(/Página 1 de 3/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
  });

  it("filtra por busca e reinicia para a página 1", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("busca"), "especial");

    expect(screen.getByText(/1 resultados/)).toBeInTheDocument();
    expect(screen.getByText("Maria Especial")).toBeInTheDocument();
  });
});
