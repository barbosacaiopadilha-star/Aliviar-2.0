import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { StoryDraftProvider } from "@/modules/story/use-story-draft";
import type { PatientStory } from "@/modules/story/types";

// PRODUTO DO PACIENTE — Fase 2, Parte 3: prova, ao vivo, que as seis
// etapas do wizard continuam renderizando com a mesma copy depois de
// SectionContainer/SectionReveal terem sido movidos de components/landing
// para components/ui — a fronteira mudou, o comportamento não.

vi.mock("next/navigation", () => ({
  usePathname: () => "/sua-historia/motivo",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/modules/story/actions", () => ({
  saveStoryDraftAction: vi.fn().mockResolvedValue({ outcome: "saved" }),
  submitStoryAction: vi.fn(),
}));

vi.mock("@/modules/story/attachment-actions", () => ({
  listStoryAttachmentsAction: vi.fn().mockResolvedValue([]),
  uploadAndAttachStoryDocumentAction: vi.fn(),
  detachStoryDocumentAction: vi.fn(),
}));

class IntersectionObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeAll(() => {
  // @ts-expect-error stub mínimo, só a forma usada por SectionReveal
  window.IntersectionObserver = IntersectionObserverStub;
});

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

function withProvider(
  children: React.ReactNode,
  story: PatientStory = BASE_STORY,
) {
  return <StoryDraftProvider story={story}>{children}</StoryDraftProvider>;
}

describe("As seis etapas do wizard continuam renderizando (copy idêntica)", () => {
  it("para-quem", async () => {
    const { default: ParaQuemPage } =
      await import("@/app/(public)/sua-historia/(wizard)/para-quem/page");
    render(withProvider(<ParaQuemPage />));
    expect(
      screen.getByRole("heading", { name: "Para quem é esta busca?" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Para mim")).toBeInTheDocument();
  });

  // CORTE DE 23/08 · o motivo fundiu-se ao passo para-quem (7 → 5 passos);
  // a pergunta continua existindo — na mesma tela.
  it("motivo (fundido em para-quem)", async () => {
    const { default: ParaQuemPage } =
      await import("@/app/(public)/sua-historia/(wizard)/para-quem/page");
    render(withProvider(<ParaQuemPage />));
    expect(screen.getByText("E o que motivou esta busca?")).toBeInTheDocument();
  });

  it("historia", async () => {
    const { default: HistoriaPage } =
      await import("@/app/(public)/sua-historia/(wizard)/historia/page");
    render(withProvider(<HistoriaPage />));
    expect(screen.getByText("Conte sua história")).toBeInTheDocument();
  });

  it("informacoes", async () => {
    const { default: InformacoesPage } =
      await import("@/app/(public)/sua-historia/(wizard)/informacoes/page");
    render(withProvider(<InformacoesPage />));
    expect(
      screen.getByText("Há algo importante que devêssemos saber?"),
    ).toBeInTheDocument();
  });

  // CORTE DE 23/08 · a preferência fundiu-se ao passo informacoes.
  it("preferencias (fundida em informacoes)", async () => {
    const { default: InformacoesPage } =
      await import("@/app/(public)/sua-historia/(wizard)/informacoes/page");
    render(withProvider(<InformacoesPage />));
    expect(
      screen.getByRole("heading", { name: "Como você prefere se conectar?" }),
    ).toBeInTheDocument();
  });

  it("revisao (etapa de revisão, antes do envio)", async () => {
    const { default: RevisaoPage } =
      await import("@/app/(public)/sua-historia/(wizard)/revisao/page");
    render(withProvider(<RevisaoPage />));
    expect(screen.getByText("Esta é a sua história.")).toBeInTheDocument();
  });

  it("revisao (estado 'enviada' — o branch que monta SectionContainer/SectionReveal diretamente)", async () => {
    const { default: RevisaoPage } =
      await import("@/app/(public)/sua-historia/(wizard)/revisao/page");
    render(
      withProvider(<RevisaoPage />, {
        ...BASE_STORY,
        status: "enviada",
        submittedAt: new Date().toISOString(),
      }),
    );
    expect(screen.getByText("Recebemos sua história")).toBeInTheDocument();
  });
});

describe("Primitivos compartilhados (agora em components/ui) preservam comportamento", () => {
  it("SectionReveal continua um wrapper genérico (children sempre visíveis, mesmo antes do IntersectionObserver disparar)", async () => {
    const { SectionReveal } = await import("@/components/ui/section-reveal");
    render(<SectionReveal>conteúdo revelado</SectionReveal>);
    expect(screen.getByText("conteúdo revelado")).toBeInTheDocument();
  });

  it("SectionContainer continua repassando className e children normalmente", async () => {
    const { SectionContainer } =
      await import("@/components/ui/section-container");
    const { container } = render(
      <SectionContainer className="custom-class">
        <p>dentro do container</p>
      </SectionContainer>,
    );
    expect(screen.getByText("dentro do container")).toBeInTheDocument();
    expect(container.querySelector("section.custom-class")).toBeInTheDocument();
  });
});
