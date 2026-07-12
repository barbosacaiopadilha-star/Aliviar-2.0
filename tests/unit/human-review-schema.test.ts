import { describe, expect, it } from "vitest";

import { submitHumanReviewInputSchema } from "@/modules/concierge/human-review-schema";

const caseId = "11111111-1111-4111-8111-111111111111";
const providerId = "22222222-2222-4222-8222-222222222222";

describe("submitHumanReviewInputSchema (Sprint P009 — Human Review)", () => {
  it("aceita um APPROVE válido com evidência", () => {
    const result = submitHumanReviewInputSchema.safeParse({
      caseId,
      reviewAction: "APPROVE",
      reviewRationale: "Composição adequada às necessidades relatadas.",
      evidenceReferences: ["Shortlist.compositionRationale"],
    });
    expect(result.success).toBe(true);
  });

  it("rejeita APPROVE sem nenhuma evidência", () => {
    const result = submitHumanReviewInputSchema.safeParse({
      caseId,
      reviewAction: "APPROVE",
      reviewRationale: "Composição adequada às necessidades relatadas.",
      evidenceReferences: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejeita justificativa vazia ou muito curta para qualquer ação", () => {
    const result = submitHumanReviewInputSchema.safeParse({
      caseId,
      reviewAction: "REJECT",
      reviewRationale: "não",
      evidenceReferences: [],
    });
    expect(result.success).toBe(false);
  });

  it("aceita ADJUST com ao menos uma alteração fundamentada", () => {
    const result = submitHumanReviewInputSchema.safeParse({
      caseId,
      reviewAction: "ADJUST",
      reviewRationale: "Um dos profissionais propostos não tem disponibilidade imediata.",
      evidenceReferences: ["CompatibilityMatrix.entries[0].rationale"],
      changes: [
        {
          type: "removed",
          providerId,
          rationale: "Sem disponibilidade imediata confirmada pela equipe.",
          evidenceReferences: ["Contato telefônico registrado em 2026-07-12"],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejeita ADJUST sem nenhuma alteração", () => {
    const result = submitHumanReviewInputSchema.safeParse({
      caseId,
      reviewAction: "ADJUST",
      reviewRationale: "Justificativa qualquer com mais de dez caracteres.",
      evidenceReferences: ["algo"],
      changes: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejeita uma alteração sem rationale ou evidenceReferences próprios", () => {
    const result = submitHumanReviewInputSchema.safeParse({
      caseId,
      reviewAction: "ADJUST",
      reviewRationale: "Justificativa qualquer com mais de dez caracteres.",
      evidenceReferences: ["algo"],
      changes: [{ type: "added", providerId, rationale: "", evidenceReferences: [] }],
    });
    expect(result.success).toBe(false);
  });

  it("REJECT e REQUEST_MORE_INFORMATION não exigem evidenceReferences", () => {
    const reject = submitHumanReviewInputSchema.safeParse({
      caseId,
      reviewAction: "REJECT",
      reviewRationale: "Faltam informações essenciais sobre a preferência do paciente.",
    });
    const requestInfo = submitHumanReviewInputSchema.safeParse({
      caseId,
      reviewAction: "REQUEST_MORE_INFORMATION",
      reviewRationale: "Preciso confirmar a disponibilidade de um dos profissionais.",
    });
    expect(reject.success).toBe(true);
    expect(requestInfo.success).toBe(true);
  });

  it("aceita returnToProtocol opcional em REJECT", () => {
    const result = submitHumanReviewInputSchema.safeParse({
      caseId,
      reviewAction: "REJECT",
      reviewRationale: "Faltam informações essenciais sobre a preferência do paciente.",
      returnToProtocol: "P006",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita um reviewAction desconhecido", () => {
    const result = submitHumanReviewInputSchema.safeParse({
      caseId,
      reviewAction: "APPROVE_AUTOMATICALLY",
      reviewRationale: "Justificativa qualquer com mais de dez caracteres.",
    });
    expect(result.success).toBe(false);
  });
});
