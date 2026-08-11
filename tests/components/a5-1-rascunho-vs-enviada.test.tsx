import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AutosaveIndicator } from "@/components/story/autosave-indicator";
import {
  STORY_ALREADY_SUBMITTED_ERROR,
  StoryDraftProvider,
  useStoryDraft,
} from "@/modules/story/use-story-draft";
import type { PatientStory } from "@/modules/story/types";

/**
 * A5.1 · RASCUNHO E ENVIADA SÃO ESTADOS DIFERENTES — E A TELA PRECISA SABER.
 *
 * O defeito, encontrado na captura da A5: a recusa do servidor por "história
 * já enviada" chegava ao indicador como `saveError` qualquer e caía no ramo de
 * erro, que a emoldurava com texto de rascunho. A frase renderizada era:
 *
 *   "Sua última resposta ainda não foi salva — o texto está guardado neste
 *    dispositivo. Esta história já foi enviada e não pode mais ser editada."
 *
 * Incompatíveis entre si, e a primeira metade **falsa duas vezes**: não havia
 * gravação pendente, e o cache local tinha acabado de ser limpo pelo próprio
 * `runPersist` nesse exato caso.
 */

const { saveStoryDraftActionMock, submitStoryActionMock, usePathnameMock } = vi.hoisted(() => ({
  saveStoryDraftActionMock: vi.fn(),
  submitStoryActionMock: vi.fn(),
  usePathnameMock: vi.fn(() => "/sua-historia/motivo"),
}));

vi.mock("next/navigation", () => ({ usePathname: () => usePathnameMock() }));
vi.mock("@/modules/story/actions", () => ({
  saveStoryDraftAction: saveStoryDraftActionMock,
  submitStoryAction: submitStoryActionMock,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
});

const RASCUNHO: PatientStory = {
  id: "story-1",
  status: "rascunho",
  currentStep: "motivo",
  data: { motivo: "algo que eu escrevi" },
  revision: 1,
  submittedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const ENVIADA: PatientStory = {
  ...RASCUNHO,
  status: "enviada",
  submittedAt: new Date().toISOString(),
};

/** Um botão que força uma gravação, para exercitar a recusa do servidor. */
function Gatilho() {
  const { update } = useStoryDraft();
  return (
    <button type="button" onClick={() => update({ motivo: "editado depois do envio" })}>
      editar
    </button>
  );
}

function montar(story: PatientStory, comGatilho = false) {
  return render(
    <StoryDraftProvider story={story}>
      {comGatilho ? <Gatilho /> : null}
      <AutosaveIndicator />
    </StoryDraftProvider>,
  );
}

/** As duas famílias de frase, por marca — nunca pela redação exata. */
const RASCUNHO_COPY = /ainda não foi salva|guardado neste dispositivo|Salvando automaticamente|foi salva\./i;
const ENVIADA_COPY = /já está com a Aliviar|não recebe mais edições|já foi enviada/i;

describe("T-A5.1-1 · rascunho fala de rascunho, e só", () => {
  it("mostra a confirmação de gravação e nenhuma frase de história enviada", () => {
    montar(RASCUNHO);
    expect(screen.getByText(/Sua resposta foi salva/i)).toBeVisible();
    expect(document.body.textContent ?? "").not.toMatch(ENVIADA_COPY);
  });
});

describe("T-A5.1-2 · enviada fala de enviada, e só", () => {
  it("mostra a mensagem do estado enviado e nenhuma frase de rascunho", () => {
    montar(ENVIADA);
    const texto = document.body.textContent ?? "";
    expect(texto).toMatch(ENVIADA_COPY);
    expect(texto, "copy de rascunho sobrevivendo à história enviada").not.toMatch(RASCUNHO_COPY);
  });

  it("e não promete um texto guardado no dispositivo — o cache foi limpo", () => {
    montar(ENVIADA);
    expect(document.body.textContent ?? "").not.toContain("guardado neste dispositivo");
  });
});

describe("T-A5.1-3 · nenhum estado renderiza as duas mensagens", () => {
  it("nem quando o servidor recusa a gravação por já ter sido enviada", async () => {
    // O caminho exato do defeito: história que o cliente ainda acha rascunho,
    // servidor recusando com a mensagem de já enviada.
    saveStoryDraftActionMock.mockResolvedValue({
      outcome: "error",
      error: STORY_ALREADY_SUBMITTED_ERROR,
    });

    montar(RASCUNHO, true);
    await userEvent.click(screen.getByRole("button", { name: "editar" }));

    await waitFor(() => {
      expect(document.body.textContent ?? "").toMatch(ENVIADA_COPY);
    });

    const texto = document.body.textContent ?? "";
    expect(texto, "as duas famílias de frase na mesma tela").not.toMatch(
      /ainda não foi salva|guardado neste dispositivo/i,
    );
  });

  it("em nenhum dos estados as duas famílias coexistem", () => {
    for (const story of [RASCUNHO, ENVIADA]) {
      cleanup();
      montar(story);
      const texto = document.body.textContent ?? "";
      const temRascunho = RASCUNHO_COPY.test(texto);
      const temEnviada = ENVIADA_COPY.test(texto);
      expect(temRascunho && temEnviada, `${story.status}: "${texto}"`).toBe(false);
    }
  });
});

describe("T-A5.1-4 · autosave não é submissão", () => {
  it("uma gravação confirmada NÃO faz a história parecer enviada", async () => {
    saveStoryDraftActionMock.mockResolvedValue({
      outcome: "success",
      story: { ...RASCUNHO, revision: 2, data: { motivo: "editado" } },
    });

    montar(RASCUNHO, true);
    await userEvent.click(screen.getByRole("button", { name: "editar" }));

    await waitFor(() => {
      expect(screen.getByText(/Sua resposta foi salva/i)).toBeVisible();
    });
    expect(document.body.textContent ?? "").not.toMatch(ENVIADA_COPY);
  });

  it("a distinção é pelo estado do registro, nunca por substring da mensagem", () => {
    const fonte = readFonte("src/components/story/autosave-indicator.tsx");
    expect(fonte).toContain('status === "enviada"');
    expect(fonte).toContain("STORY_ALREADY_SUBMITTED_ERROR");
    // Comparar contra a constante é o que impede voltar ao `includes("enviada")`.
    expect(fonte).not.toMatch(/saveError\?\.includes|saveError\.includes/);
  });
});

describe("T-A5.1-5 · enviar história não é encontro realizado (D-9)", () => {
  it("nada nesta superfície toca `meetingHeldAt`", () => {
    for (const caminho of [
      "src/components/story/autosave-indicator.tsx",
      "src/modules/story/use-story-draft.tsx",
      "src/modules/story/repository.ts",
    ]) {
      expect(readFonte(caminho), `${caminho} passou a mexer no encontro`).not.toContain(
        "meetingHeldAt",
      );
      expect(readFonte(caminho)).not.toContain("meeting_held_at");
    }
  });
});

function readFonte(caminho: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require("node:fs") as typeof import("node:fs")).readFileSync(caminho, "utf8");
}
