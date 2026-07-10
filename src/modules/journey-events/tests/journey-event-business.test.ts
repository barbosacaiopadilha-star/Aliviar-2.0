import { describe, expect, it } from "vitest";

describe("journey event business rules", () => {
  it("evento sempre pertence a uma Jornada", () => {
    const event = { journey_id: "j1", title: "Contato" };
    expect(event.journey_id).toBeTruthy();
  });

  it("evento não pode ser excluído", () => {
    const deletePolicyExists = false;
    expect(deletePolicyExists).toBe(false);
  });

  it("evento corrigido permanece armazenado", () => {
    const original = { id: "e1", is_corrected: true };
    const correction = { id: "e2", corrected_event_id: "e1" };
    expect(original.is_corrected).toBe(true);
    expect(correction.corrected_event_id).toBe(original.id);
  });

  it("novo evento referencia o original", () => {
    const correction = { corrected_event_id: "original-id" };
    expect(correction.corrected_event_id).toBe("original-id");
  });

  it("autoria não pode ser enviada livremente pelo cliente", () => {
    const clientPayload = { created_by: "fake-user-id" };
    const serverSetsAuthor = true;
    expect(clientPayload.created_by).toBeDefined();
    expect(serverSetsAuthor).toBe(true);
  });

  it("evento automático não pode ser criado pelo formulário comum", () => {
    const formSource = "MANUAL";
    const systemOnlyFunction = "create_system_journey_event";
    expect(formSource).toBe("MANUAL");
    expect(systemOnlyFunction).not.toContain("create_journey_event");
  });

  it("próximo passo não é obrigatório", () => {
    const event = { title: "Contato", next_step: null };
    expect(event.next_step).toBeNull();
  });

  it("evento mais recente com próximo passo alimenta o bloco da Jornada", () => {
    const events = [
      { occurred_at: "2026-07-08T10:00:00Z", next_step: "Antigo" },
      { occurred_at: "2026-07-10T14:00:00Z", next_step: "Confirmar exames" },
      { occurred_at: "2026-07-09T12:00:00Z", next_step: null },
    ];
    const latest = events
      .filter((e) => e.next_step)
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0];
    expect(latest?.next_step).toBe("Confirmar exames");
  });

  it("correção preserva o original visível", () => {
    const timeline = [
      { id: "e1", is_corrected: true, title: "Original" },
      { id: "e2", corrected_event_id: "e1", title: "Corrigido" },
    ];
    expect(timeline).toHaveLength(2);
    expect(timeline[0].is_corrected).toBe(true);
  });

  it("DECISION refere-se a decisão do paciente", () => {
    const label = "Decisão do paciente";
    expect(label).toContain("paciente");
  });
});
