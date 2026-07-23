import { describe, expect, it } from "vitest";

import {
  createInMemoryJourneyMemoryStack,
  handleAddNote,
  handleAppendTimeline,
  handleBuildMemory,
  handleReferenceAttachment,
} from "@/journey-memory";

describe("journey-memory api handlers", () => {
  it("handleBuildMemory retorna agregado unificado", async () => {
    const stack = createInMemoryJourneyMemoryStack();

    await handleAppendTimeline(stack, {
      journeyId: "j-1",
      audience: "CURATORIA",
      actorId: "curator-1",
      title: "Evento via handler",
      occurredAt: "2026-07-22T08:00:00.000Z",
      category: "JOURNEY",
    });

    const result = await handleBuildMemory(stack, {
      journeyId: "j-1",
      audience: "CURATORIA",
      actorId: "curator-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.memory.timeline).toHaveLength(1);
    expect(result.value.memory.entryCount).toBe(1);
  });

  it("handleAddNote e handleReferenceAttachment retornam ids", async () => {
    const stack = createInMemoryJourneyMemoryStack();

    const note = await handleAddNote(stack, {
      journeyId: "j-2",
      audience: "CURATORIA",
      createdBy: "curator-1",
      content: "Contexto clínico",
      visibility: ["CURATORIA"],
    });

    const attachment = await handleReferenceAttachment(stack, {
      journeyId: "j-2",
      audience: "OPERACAO",
      referencedBy: "operator-1",
      externalRef: "https://files.example/laudo.pdf",
      displayName: "Laudo",
    });

    expect(note.ok).toBe(true);
    expect(attachment.ok).toBe(true);
    if (!note.ok || !attachment.ok) return;

    expect(note.value.noteId).toMatch(/^mem-/);
    expect(attachment.value.referenceId).toMatch(/^mem-/);
  });
});
