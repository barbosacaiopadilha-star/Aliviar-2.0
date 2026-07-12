import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StoryDraftProvider, useStoryDraft } from "@/modules/story/use-story-draft";
import type { PatientStory } from "@/modules/story/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/sua-historia/motivo",
}));

const { saveStoryDraftActionMock, submitStoryActionMock } = vi.hoisted(() => ({
  saveStoryDraftActionMock: vi.fn(),
  submitStoryActionMock: vi.fn(),
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
  });

  it("dispara o autosave debounced com a revision atual após digitar", async () => {
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

  it("mostra conflito quando o servidor retorna uma revision mais nova de outra aba", async () => {
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

  it("marca como enviada quando a submissão é bem-sucedida", async () => {
    submitStoryActionMock.mockResolvedValue({
      success: true,
      story: { ...BASE_STORY, status: "enviada", submittedAt: new Date().toISOString() },
    });

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <StoryDraftProvider story={BASE_STORY}>
        <Harness />
      </StoryDraftProvider>,
    );

    await user.click(screen.getByRole("button", { name: "concluir" }));
    expect(await screen.findByText("status:enviada")).toBeInTheDocument();
  });
});
