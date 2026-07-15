import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StoryDraftProvider, useStoryDraft } from "@/modules/story/use-story-draft";
import type { PatientStory } from "@/modules/story/types";

const { saveStoryDraftActionMock, submitStoryActionMock, usePathnameMock } = vi.hoisted(() => ({
  saveStoryDraftActionMock: vi.fn(),
  submitStoryActionMock: vi.fn(),
  usePathnameMock: vi.fn(() => "/sua-historia/motivo"),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("@/modules/story/actions", () => ({
  saveStoryDraftAction: saveStoryDraftActionMock,
  submitStoryAction: submitStoryActionMock,
}));

afterEach(cleanup);

const BASE_STORY: PatientStory = {
  id: "story-1",
  status: "rascunho",
  currentStep: "motivo",
  data: {},
  revision: 1,
  submittedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function cacheKey(storyId: string) {
  return `aliviar:sua-historia:cache:${storyId}`;
}

function readCache(storyId: string): { pending: boolean; revision: number } | null {
  const raw = window.localStorage.getItem(cacheKey(storyId));
  return raw ? JSON.parse(raw) : null;
}

// Promise controlável de fora — usada para provar que uma segunda gravação
// nunca começa antes da primeira terminar (sem isso, o teste só poderia
// observar o resultado final, nunca a sobreposição em si).
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function Harness() {
  const { data, update, status, isSaving, hasConflict, dismissConflict, submit } = useStoryDraft();

  return (
    <div>
      <input
        aria-label="motivo"
        value={data.motivo ?? ""}
        onChange={(event) => update({ motivo: event.target.value })}
      />
      <p>status:{status}</p>
      <p>saving:{String(isSaving)}</p>
      <p>conflict:{String(hasConflict)}</p>
      <button type="button" onClick={dismissConflict}>
        dispensar
      </button>
      <button type="button" onClick={() => void submit()}>
        concluir
      </button>
    </div>
  );
}

describe("StoryDraftProvider (autosave, concorrência, submissão)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    saveStoryDraftActionMock.mockReset();
    submitStoryActionMock.mockReset();
    usePathnameMock.mockReturnValue("/sua-historia/motivo");
    window.localStorage.clear();
  });

  it("1. update() agenda um debounce (nenhuma gravação antes de 600ms)", async () => {
    saveStoryDraftActionMock.mockResolvedValue({
      outcome: "saved",
      story: { ...BASE_STORY, data: { motivo: "ansiedade" }, revision: 2 },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );

    await user.type(screen.getByLabelText("motivo"), "ansiedade");
    expect(saveStoryDraftActionMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(700);

    expect(saveStoryDraftActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ storyId: "story-1", expectedRevision: 1, currentStep: "motivo" }),
    );
  });

  it("2 e 3. navegação antes de 600ms cancela o debounce e gera só uma persistência", async () => {
    saveStoryDraftActionMock.mockResolvedValue({
      outcome: "saved",
      story: { ...BASE_STORY, data: { motivo: "ans" }, currentStep: "historia", revision: 2 },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );

    await user.type(screen.getByLabelText("motivo"), "ans");
    await vi.advanceTimersByTimeAsync(200); // bem antes dos 600ms do debounce

    usePathnameMock.mockReturnValue("/sua-historia/historia");
    rerender(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );
    await vi.advanceTimersByTimeAsync(0);

    // A gravação disparada pela navegação já deve ter acontecido.
    expect(saveStoryDraftActionMock).toHaveBeenCalledTimes(1);
    expect(saveStoryDraftActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ currentStep: "historia" }),
    );

    // O debounce da digitação (que dispararia aos 600ms) não pode gerar uma
    // segunda chamada depois de cancelado pela navegação.
    await vi.advanceTimersByTimeAsync(700);
    expect(saveStoryDraftActionMock).toHaveBeenCalledTimes(1);
  });

  it("4 e 5. submit cancela o debounce pendente e nenhum persist ocorre depois do sucesso", async () => {
    saveStoryDraftActionMock.mockResolvedValue({
      outcome: "saved",
      story: { ...BASE_STORY, data: { motivo: "x" }, revision: 2 },
    });
    submitStoryActionMock.mockResolvedValue({
      success: true,
      story: { ...BASE_STORY, status: "enviada", revision: 3, submittedAt: new Date().toISOString() },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );

    await user.type(screen.getByLabelText("motivo"), "x");
    // Nem chega a esperar 600ms — clica em concluir com o debounce ainda vivo.
    await user.click(screen.getByRole("button", { name: "concluir" }));

    expect(await screen.findByText("status:enviada")).toBeInTheDocument();
    expect(saveStoryDraftActionMock).toHaveBeenCalledTimes(1); // o flush do submit, não o debounce
    expect(submitStoryActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ expectedRevision: 2 }), // revision devolvida pelo flush, não a original
    );

    saveStoryDraftActionMock.mockClear();
    await vi.advanceTimersByTimeAsync(1000);
    expect(saveStoryDraftActionMock).not.toHaveBeenCalled();
  });

  it("6 e 7. duas gravações nunca ficam em voo ao mesmo tempo — a segunda roda só depois da primeira", async () => {
    const first = deferred<{ outcome: "saved"; story: PatientStory }>();
    const second = deferred<{ outcome: "saved"; story: PatientStory }>();
    saveStoryDraftActionMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );

    await user.type(screen.getByLabelText("motivo"), "a");
    await vi.advanceTimersByTimeAsync(700); // dispara a 1a gravação (ainda pendente, "first" não resolveu)

    expect(saveStoryDraftActionMock).toHaveBeenCalledTimes(1);

    // Segunda edição enquanto a primeira gravação ainda está em voo.
    await user.type(screen.getByLabelText("motivo"), "b");
    await vi.advanceTimersByTimeAsync(700);

    // A segunda gravação NÃO pode ter começado ainda — a primeira nunca resolveu.
    expect(saveStoryDraftActionMock).toHaveBeenCalledTimes(1);

    first.resolve({ outcome: "saved", story: { ...BASE_STORY, data: { motivo: "a" }, revision: 2 } });
    await vi.waitFor(() => expect(saveStoryDraftActionMock).toHaveBeenCalledTimes(2));

    // A segunda gravação usa a revision devolvida pela primeira (2), não a original (1).
    expect(saveStoryDraftActionMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ expectedRevision: 2, patch: expect.objectContaining({ motivo: "ab" }) }),
    );

    second.resolve({ outcome: "saved", story: { ...BASE_STORY, data: { motivo: "ab" }, revision: 3 } });
  });

  it("8. o payload da gravação atrasada usa o currentStep mais recente, nunca o capturado na digitação", async () => {
    saveStoryDraftActionMock.mockResolvedValue({
      outcome: "saved",
      story: { ...BASE_STORY, data: { motivo: "tarde" }, currentStep: "historia", revision: 2 },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );

    await user.type(screen.getByLabelText("motivo"), "tarde");
    usePathnameMock.mockReturnValue("/sua-historia/historia");
    rerender(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );
    await vi.advanceTimersByTimeAsync(0);

    expect(saveStoryDraftActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ currentStep: "historia" }),
    );
  });

  it("9. submit usa a revision retornada pela última gravação (flush), não uma revision antiga", async () => {
    saveStoryDraftActionMock.mockResolvedValue({
      outcome: "saved",
      story: { ...BASE_STORY, data: { motivo: "y" }, revision: 7 },
    });
    submitStoryActionMock.mockResolvedValue({
      success: true,
      story: { ...BASE_STORY, status: "enviada", revision: 8 },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );

    await user.type(screen.getByLabelText("motivo"), "y");
    await user.click(screen.getByRole("button", { name: "concluir" }));

    await screen.findByText("status:enviada");
    expect(submitStoryActionMock).toHaveBeenCalledWith(expect.objectContaining({ expectedRevision: 7 }));
  });

  it("10. erro de persistência não trava a fila — a próxima gravação roda normalmente", async () => {
    saveStoryDraftActionMock
      .mockResolvedValueOnce({ outcome: "error", error: "Não foi possível salvar agora." })
      .mockResolvedValueOnce({
        outcome: "saved",
        story: { ...BASE_STORY, data: { motivo: "ab" }, revision: 2 },
      });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );

    await user.type(screen.getByLabelText("motivo"), "a");
    await vi.advanceTimersByTimeAsync(700);
    expect(saveStoryDraftActionMock).toHaveBeenCalledTimes(1);

    await user.type(screen.getByLabelText("motivo"), "b");
    await vi.advanceTimersByTimeAsync(700);

    expect(saveStoryDraftActionMock).toHaveBeenCalledTimes(2);
  });

  it("11. conflito real (outra aba/dispositivo) continua sendo tratado", async () => {
    saveStoryDraftActionMock.mockResolvedValue({
      outcome: "conflict",
      story: { ...BASE_STORY, data: { motivo: "outro dispositivo" }, revision: 5 },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );

    await user.type(screen.getByLabelText("motivo"), "x");
    await vi.advanceTimersByTimeAsync(700);

    expect(await screen.findByText("conflict:true")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "dispensar" }));
    expect(screen.getByText("conflict:false")).toBeInTheDocument();
  });

  it("12. cache local: erro comum preserva pending:true (recuperação); já-enviada e sucesso finalizam o cache", async () => {
    saveStoryDraftActionMock.mockResolvedValueOnce({
      outcome: "error",
      error: "Não foi possível salvar agora.",
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );

    await user.type(screen.getByLabelText("motivo"), "a");
    await vi.advanceTimersByTimeAsync(700);

    expect(readCache("story-1")?.pending).toBe(true);
    unmount();

    // Já enviada: o cache não deve sobreviver, não há retomada possível.
    saveStoryDraftActionMock.mockReset();
    saveStoryDraftActionMock.mockResolvedValue({
      outcome: "error",
      error: "Esta história já foi enviada e não pode mais ser editada.",
    });
    window.localStorage.clear();

    const { unmount: unmount2 } = render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );
    await user.type(screen.getByLabelText("motivo"), "b");
    await vi.advanceTimersByTimeAsync(700);
    expect(readCache("story-1")).toBeNull();
    unmount2();

    // Sucesso: cache finalizado com pending:false.
    saveStoryDraftActionMock.mockReset();
    saveStoryDraftActionMock.mockResolvedValue({
      outcome: "saved",
      story: { ...BASE_STORY, data: { motivo: "c" }, revision: 2 },
    });
    window.localStorage.clear();

    render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );
    await user.type(screen.getByLabelText("motivo"), "c");
    await vi.advanceTimersByTimeAsync(700);
    expect(readCache("story-1")?.pending).toBe(false);
  });
});
