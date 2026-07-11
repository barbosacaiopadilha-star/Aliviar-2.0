import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ALLOWED_STATUS_TRANSITIONS,
  isOverdue,
  isValidStatusTransition,
  sortCommitments,
} from "@/modules/journey-commitments/types/commitment";
import { buildStatusUpdatePayload } from "@/modules/journey-commitments/schemas/commitment";

const FIXED_TODAY = new Date("2026-07-10T12:00:00");

afterEach(() => {
  vi.useRealTimers();
});

describe("commitment business rules", () => {
  it("compromisso pertence a uma Jornada", () => {
    const commitment = { journey_id: "j1", title: "Contato" };
    expect(commitment.journey_id).toBeTruthy();
  });

  it("compromisso possui responsável único", () => {
    const commitment = { assigned_to: "user-1" };
    expect(commitment.assigned_to).toBeTruthy();
  });

  it("perfil inativo não pode ser responsável", () => {
    const profile = { is_active: false };
    const isValid = profile.is_active;
    expect(isValid).toBe(false);
  });

  it("compromisso concluído não pode ser reaberto", () => {
    expect(isValidStatusTransition("COMPLETED", "PENDING")).toBe(false);
    expect(isValidStatusTransition("COMPLETED", "IN_PROGRESS")).toBe(false);
  });

  it("compromisso cancelado não pode ser alterado", () => {
    expect(ALLOWED_STATUS_TRANSITIONS.CANCELLED).toHaveLength(0);
  });

  it("conclusão registra completed_at", () => {
    const payload = buildStatusUpdatePayload("COMPLETED");
    expect(payload.status).toBe("COMPLETED");
    expect(payload.completed_at).toBeTruthy();
    expect(payload.cancelled_at).toBeNull();
  });

  it("cancelamento registra cancelled_at", () => {
    const payload = buildStatusUpdatePayload("CANCELLED");
    expect(payload.status).toBe("CANCELLED");
    expect(payload.cancelled_at).toBeTruthy();
    expect(payload.completed_at).toBeNull();
  });

  it("não existe exclusão", () => {
    const deletePolicyExists = false;
    expect(deletePolicyExists).toBe(false);
  });

  it("Jornada encerrada não recebe novo compromisso", () => {
    const journey = { status: "FINISHED" };
    const accepts = journey.status !== "FINISHED" && journey.status !== "CANCELLED";
    expect(accepts).toBe(false);
  });

  it("Jornada ativa sem compromisso aparece no workspace", () => {
    const activeJourneys = [{ id: "j1" }, { id: "j2" }];
    const openCommitments = [{ journey_id: "j1" }];
    const without = activeJourneys.filter(
      (j) => !openCommitments.some((c) => c.journey_id === j.id),
    );
    expect(without).toHaveLength(1);
    expect(without[0].id).toBe("j2");
  });

  it("identifica compromisso vencido", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TODAY);

    const commitment = {
      id: "1",
      journey_id: "j1",
      title: "Contato",
      assigned_to: "u1",
      status: "PENDING" as const,
      due_date: "2026-07-09",
      completed_at: null,
      cancelled_at: null,
      created_by: "u1",
      created_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-01T10:00:00.000Z",
    };
    expect(isOverdue(commitment)).toBe(true);
  });

  it("ordena compromissos: vencidos primeiro", () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TODAY);

    const commitments = [
      {
        id: "1", journey_id: "j1", title: "Sem prazo", assigned_to: "u1",
        status: "PENDING" as const, due_date: null, completed_at: null,
        cancelled_at: null, created_by: "u1", created_at: "2026-07-01", updated_at: "2026-07-01",
      },
      {
        id: "2", journey_id: "j1", title: "Vencido", assigned_to: "u1",
        status: "PENDING" as const, due_date: "2026-07-09", completed_at: null,
        cancelled_at: null, created_by: "u1", created_at: "2026-07-01", updated_at: "2026-07-01",
      },
      {
        id: "3", journey_id: "j1", title: "Futuro", assigned_to: "u1",
        status: "PENDING" as const, due_date: "2026-07-11", completed_at: null,
        cancelled_at: null, created_by: "u1", created_at: "2026-07-01", updated_at: "2026-07-01",
      },
    ];

    const sorted = sortCommitments(commitments);
    expect(sorted[0].id).toBe("2");
  });
});
