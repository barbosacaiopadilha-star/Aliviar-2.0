import { describe, expect, it } from "vitest";

import { createInitialStudioState } from "./mock-data";
import { checklistProgress } from "./operational-checklist";
import {
  addSource,
  computeDashboardMetrics,
  createCandidate,
  getCandidate,
  removeSource,
  updateCandidateStatus,
  updateChecklistItem,
  updateSource,
} from "./studio-store";

describe("studio-store", () => {
  it("cria candidato com histórico inicial", () => {
    const candidate = createCandidate({
      id: "test-1",
      caseId: "ALC-ES-2026-99999",
      name: "Dr. Teste",
      city: "Vitória",
      specialty: "Ortopedia",
      status: "novo",
    });

    expect(candidate.history).toHaveLength(1);
    expect(candidate.history[0]?.action).toBe("caso_criado");
    expect(candidate.checklist.length).toBeGreaterThan(30);
  });

  it("atualiza status e registra histórico", () => {
    const state = createInitialStudioState();
    const target = state.candidates.find((c) => c.status === "novo");
    expect(target).toBeDefined();

    const next = updateCandidateStatus(state, target!.id, "triagem");
    const updated = getCandidate(next, target!.id);

    expect(updated?.status).toBe("triagem");
    expect(updated?.history.some((h) => h.action === "status_alterado")).toBe(true);
  });

  it("nunca remove entradas do histórico ao editar fontes", () => {
    let state = createInitialStudioState();
    const target = state.candidates.find((c) => c.sources.length > 0);
    expect(target).toBeDefined();

    const historyLength = target!.history.length;
    const source = target!.sources[0]!;

    state = addSource(state, target!.id, {
      name: "Nova fonte",
      type: "Instituição",
      consultedAt: "2026-07-22",
      responsible: "Operador",
    });
    state = updateSource(state, target!.id, source.id, { name: "Fonte editada" });
    state = removeSource(state, target!.id, source.id);

    const updated = getCandidate(state, target!.id)!;
    expect(updated.history.length).toBeGreaterThan(historyLength + 2);
    expect(updated.sources.find((s) => s.id === source.id)).toBeUndefined();
  });

  it("calcula métricas do dashboard", () => {
    const metrics = computeDashboardMetrics(createInitialStudioState());

    expect(metrics.backlog).toBeGreaterThan(0);
    expect(metrics.nivelA).toBeGreaterThanOrEqual(1);
    expect(metrics.nivelB).toBeGreaterThanOrEqual(1);
    expect(metrics.byStatus.publicado).toBeGreaterThanOrEqual(2);
    expect(metrics.averageDaysToPublish).not.toBeNull();
  });

  it("atualiza item do checklist", () => {
    const state = createInitialStudioState();
    const target = state.candidates[0]!;
    const item = target.checklist[0]!;

    const next = updateChecklistItem(state, target.id, item.id, "concluido");
    const updated = getCandidate(next, target.id)!;
    const updatedItem = updated.checklist.find((i) => i.id === item.id);

    expect(updatedItem?.state).toBe("concluido");
  });
});

describe("operational-checklist", () => {
  it("calcula progresso do checklist", () => {
    const candidate = createCandidate({
      id: "progress",
      caseId: "ALC-ES-2026-00001",
      name: "Dr. Progresso",
      city: "Vitória",
      specialty: "Ortopedia",
      status: "coleta",
      checklistStates: { A1: "concluido", A2: "em_andamento" },
    });

    const progress = checklistProgress(candidate.checklist);
    expect(progress.total).toBeGreaterThan(30);
    expect(progress.concluido).toBeGreaterThanOrEqual(1);
  });
});
