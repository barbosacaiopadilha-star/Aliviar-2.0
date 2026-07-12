import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HumanReviewHistory } from "@/components/ace/human-review-history";
import type { HumanReviewResultRecord } from "@/modules/concierge/types";

afterEach(cleanup);

function buildResult(overrides: Partial<HumanReviewResultRecord> = {}): HumanReviewResultRecord {
  return {
    id: "review-1",
    caseId: "case-1",
    executionId: "exec-1",
    reviewerId: "user-1",
    reviewerName: "Dra. Revisora",
    reviewedAt: new Date("2026-07-12T10:00:00Z").toISOString(),
    reviewStatus: "VALIDATED",
    reviewAction: "APPROVE",
    originalShortlistArtifactId: "shortlist-1",
    originalShortlistArtifactVersion: 1,
    compatibilityMatrixArtifactId: "matrix-1",
    compatibilityMatrixArtifactVersion: 1,
    approvedProviderIds: ["provider-a", "provider-b", "provider-c"],
    changes: [],
    reviewRationale: "Composição adequada às necessidades relatadas.",
    evidenceReferences: ["Shortlist.compositionRationale"],
    returnToProtocol: null,
    methodVersion: "ACE-0.1",
    version: 1,
    createdAt: new Date("2026-07-12T10:00:00Z").toISOString(),
    ...overrides,
  };
}

const namesByProviderId = { "provider-a": "Ana Profissional" };

describe("HumanReviewHistory", () => {
  it("mostra estado vazio quando não há decisões", () => {
    render(<HumanReviewHistory results={[]} namesByProviderId={{}} />);
    expect(screen.getByText("Nenhuma decisão de revisão humana registrada ainda para este caso.")).toBeInTheDocument();
  });

  it("mostra reviewer, ação, status, justificativa e composição aprovada", () => {
    render(<HumanReviewHistory results={[buildResult()]} namesByProviderId={namesByProviderId} />);

    expect(screen.getByText("Validada")).toBeInTheDocument();
    expect(screen.getByText("Aprovou integralmente")).toBeInTheDocument();
    expect(screen.getByText(/Dra\. Revisora/)).toBeInTheDocument();
    expect(screen.getByText("Composição adequada às necessidades relatadas.")).toBeInTheDocument();
    expect(screen.getByText("Ana Profissional")).toBeInTheDocument();
  });

  it("mostra alterações registradas (ADJUST) com justificativa individual", () => {
    const result = buildResult({
      reviewAction: "ADJUST",
      changes: [
        { type: "removed", providerId: "provider-a", rationale: "Sem disponibilidade.", evidenceReferences: ["contato"] },
      ],
    });
    render(<HumanReviewHistory results={[result]} namesByProviderId={namesByProviderId} />);

    expect(screen.getByText(/Removeu Ana Profissional/)).toBeInTheDocument();
    expect(screen.getByText(/Sem disponibilidade\./)).toBeInTheDocument();
  });

  it("uma decisão REJECTED nunca desaparece do histórico mesmo após uma VALIDATED posterior", () => {
    const rejected = buildResult({
      id: "review-old",
      reviewStatus: "REJECTED",
      reviewAction: "REJECT",
      approvedProviderIds: [],
      reviewRationale: "Faltava confirmar disponibilidade.",
    });
    const validated = buildResult({ id: "review-new" });

    render(<HumanReviewHistory results={[validated, rejected]} namesByProviderId={namesByProviderId} />);

    expect(screen.getByText("Rejeitada")).toBeInTheDocument();
    expect(screen.getByText("Validada")).toBeInTheDocument();
  });
});
