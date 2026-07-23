import { describe, expect, it } from "vitest";

import type { JourneyCommitment } from "@/modules/journey-commitments/types/commitment";
import {
  addNote,
  appendTimelineEntry,
  buildJourneyMemory,
  createInMemoryJourneyMemoryStack,
  DenyMemoryAccess,
  handleProjectNarrative,
  projectNarrativeForAudience,
  referenceAttachment,
  roleToMemoryAudience,
} from "@/journey-memory";

const JOURNEY_ID = "journey-1";
const ACTOR_CURATOR = "curator-1";
const ACTOR_PATIENT = "patient-1";

function sampleCommitment(overrides: Partial<JourneyCommitment> = {}): JourneyCommitment {
  return {
    id: "c-1",
    journey_id: JOURNEY_ID,
    title: "Agendar retorno",
    assigned_to: "operator-1",
    status: "PENDING",
    due_date: "2026-07-25",
    completed_at: null,
    cancelled_at: null,
    created_by: ACTOR_CURATOR,
    created_at: "2026-07-20T10:00:00.000Z",
    updated_at: "2026-07-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("journey-memory services", () => {
  it("timeline é append-only e ordenada por occurredAt", async () => {
    const stack = createInMemoryJourneyMemoryStack();
    const deps = { ...stack };

    await appendTimelineEntry(deps, {
      journeyId: JOURNEY_ID,
      audience: "CURATORIA",
      actorId: ACTOR_CURATOR,
      kind: "EVENT",
      source: "MANUAL",
      category: "JOURNEY",
      title: "Jornada iniciada",
      occurredAt: "2026-07-21T09:00:00.000Z",
    });

    await appendTimelineEntry(deps, {
      journeyId: JOURNEY_ID,
      audience: "CURATORIA",
      actorId: ACTOR_CURATOR,
      kind: "EVENT",
      source: "MANUAL",
      category: "CONSULTATION",
      title: "Primeira consulta",
      occurredAt: "2026-07-22T14:00:00.000Z",
    });

    const memory = await buildJourneyMemory(deps, {
      journeyId: JOURNEY_ID,
      audience: "CURATORIA",
      actorId: ACTOR_CURATOR,
    });

    expect(memory.ok).toBe(true);
    if (!memory.ok) return;

    expect(memory.value.timeline).toHaveLength(2);
    expect(memory.value.timeline[0]?.title).toBe("Jornada iniciada");
    expect(memory.value.timeline[1]?.title).toBe("Primeira consulta");
    expect(stack.timelineRepository.all()).toHaveLength(2);
  });

  it("nota gera entrada na timeline sem armazenar documento", async () => {
    const stack = createInMemoryJourneyMemoryStack();
    const deps = { ...stack };

    const note = await addNote(deps, {
      journeyId: JOURNEY_ID,
      audience: "CURATORIA",
      createdBy: ACTOR_CURATOR,
      content: "Paciente relatou melhora parcial.",
      visibility: ["CURATORIA", "INTERNAL"],
    });

    expect(note.ok).toBe(true);
    if (!note.ok) return;

    const memory = await buildJourneyMemory(deps, {
      journeyId: JOURNEY_ID,
      audience: "CURATORIA",
      actorId: ACTOR_CURATOR,
    });

    expect(memory.ok).toBe(true);
    if (!memory.ok) return;

    expect(memory.value.notes).toHaveLength(1);
    expect(memory.value.timeline.some((entry) => entry.kind === "NOTE")).toBe(true);
  });

  it("referência de anexo guarda apenas metadados", async () => {
    const stack = createInMemoryJourneyMemoryStack();
    const deps = { ...stack };

    const ref = await referenceAttachment(deps, {
      journeyId: JOURNEY_ID,
      audience: "OPERACAO",
      referencedBy: "operator-1",
      externalRef: "storage://bucket/exame-123.pdf",
      displayName: "Laudo de ressonância",
      mimeType: "application/pdf",
    });

    expect(ref.ok).toBe(true);
    if (!ref.ok) return;

    expect(ref.value.externalRef).toContain("storage://");
    expect(JSON.stringify(ref.value)).not.toMatch(/%PDF|base64/i);
  });

  it("commitments view projeta filas operacionais", async () => {
    const stack = createInMemoryJourneyMemoryStack();
    stack.commitmentSource.seed(JOURNEY_ID, [
      sampleCommitment(),
      sampleCommitment({ id: "c-2", status: "COMPLETED", completed_at: "2026-07-21T12:00:00.000Z" }),
    ]);

    const memory = await buildJourneyMemory({ ...stack }, {
      journeyId: JOURNEY_ID,
      audience: "OPERACAO",
      actorId: "operator-1",
    });

    expect(memory.ok).toBe(true);
    if (!memory.ok) return;

    expect(memory.value.commitments.open).toHaveLength(1);
    expect(memory.value.commitments.completed).toHaveLength(1);
    expect(memory.value.commitments.total).toBe(2);
  });
});

describe("narrative projection por audiência", () => {
  it("portal reconstrói história sem notas internas", async () => {
    const stack = createInMemoryJourneyMemoryStack();
    const deps = { ...stack };

    await appendTimelineEntry(deps, {
      journeyId: JOURNEY_ID,
      audience: "CURATORIA",
      actorId: ACTOR_CURATOR,
      kind: "EVENT",
      source: "MANUAL",
      category: "JOURNEY",
      title: "Bem-vindo à jornada",
      occurredAt: "2026-07-21T09:00:00.000Z",
    });

    await appendTimelineEntry(deps, {
      journeyId: JOURNEY_ID,
      audience: "CURATORIA",
      actorId: ACTOR_CURATOR,
      kind: "EVENT",
      source: "MANUAL",
      category: "OPERATIONAL",
      title: "Fila interna atualizada",
      occurredAt: "2026-07-21T10:00:00.000Z",
    });

    await addNote(deps, {
      journeyId: JOURNEY_ID,
      audience: "CURATORIA",
      createdBy: ACTOR_CURATOR,
      content: "Nota interna de curadoria",
      visibility: ["INTERNAL", "CURATORIA"],
    });

    const memory = await buildJourneyMemory(deps, {
      journeyId: JOURNEY_ID,
      audience: "PORTAL",
      actorId: ACTOR_PATIENT,
    });
    expect(memory.ok).toBe(true);
    if (!memory.ok) return;

    const narrative = await projectNarrativeForAudience(deps, {
      memory: memory.value,
      audience: "PORTAL",
      actorId: ACTOR_PATIENT,
    });

    expect(narrative.ok).toBe(true);
    if (!narrative.ok) return;

    expect(narrative.value.segments.some((s) => s.headline === "Bem-vindo à jornada")).toBe(true);
    expect(narrative.value.segments.some((s) => s.headline === "Fila interna atualizada")).toBe(false);
    expect(narrative.value.segments.some((s) => s.provenance === "note")).toBe(false);
  });

  it("governança audita com proveniência completa", async () => {
    const stack = createInMemoryJourneyMemoryStack();
    const deps = { ...stack };

    await referenceAttachment(deps, {
      journeyId: JOURNEY_ID,
      audience: "GOVERNANCA",
      referencedBy: "auditor-1",
      externalRef: "s3://audit-bucket/doc-9",
      displayName: "Termo assinado",
    });

    const handlerResult = await handleProjectNarrative(deps, {
      journeyId: JOURNEY_ID,
      audience: "GOVERNANCA",
      actorId: "auditor-1",
    });

    expect(handlerResult.ok).toBe(true);
    if (!handlerResult.ok) return;

    const attachmentSegment = handlerResult.value.narrative.segments.find(
      (segment) => segment.provenance === "attachment",
    );
    expect(attachmentSegment?.body).toContain("s3://audit-bucket/doc-9");
    expect(attachmentSegment?.actorId).toBe("auditor-1");
  });

  it("mapeia papéis de consumidor para audiências da memória", () => {
    expect(roleToMemoryAudience("PATIENT")).toBe("PORTAL");
    expect(roleToMemoryAudience("CURATOR")).toBe("CURATORIA");
    expect(roleToMemoryAudience("OPERATOR")).toBe("OPERACAO");
    expect(roleToMemoryAudience("AUDITOR")).toBe("GOVERNANCA");
  });
});

describe("access control", () => {
  it("nega leitura quando access port bloqueia", async () => {
    const stack = createInMemoryJourneyMemoryStack();
    const result = await buildJourneyMemory(
      { ...stack, access: new DenyMemoryAccess() },
      { journeyId: JOURNEY_ID, audience: "CURATORIA", actorId: ACTOR_CURATOR },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("FORBIDDEN");
  });
});
