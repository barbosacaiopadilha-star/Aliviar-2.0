import { describe, expect, it } from "vitest";

import {
  advanceHandoffCheckpoint,
  bootstrapJourneyFromHandoff,
  completeHandoff,
  createInMemoryHandoffStack,
  handleBootstrapJourney,
  handleProjectContinuation,
  handleStartHandoff,
  mapIntentionToEtapa,
  mapPublicChapterToEtapa,
  narrativeMappingIsConsistent,
  projectPortalContinuationFromHandoff,
  resolveOperationalState,
  startHandoff,
} from "@/journey-handoff";

const SESSION = "visitor-session-1";

describe("journey-handoff services", () => {
  it("inicia handoff com intenção e checkpoint", async () => {
    const stack = createInMemoryHandoffStack();
    const result = await startHandoff(stack, {
      sessionId: SESSION,
      intention: "INICIAR_CONVERSA",
      publicChapter: "LIMIAR_INVITE",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.status).toBe("STARTED");
    expect(result.value.intention).toBe("INICIAR_CONVERSA");
    expect(result.value.checkpoint.publicChapter).toBe("LIMIAR_INVITE");
  });

  it("avança checkpoint sem retroceder capítulo", async () => {
    const stack = createInMemoryHandoffStack();
    const started = await startHandoff(stack, {
      sessionId: SESSION,
      intention: "CONTAR_HISTORIA",
      publicChapter: "CONVERSA_GREETING",
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const advanced = await advanceHandoffCheckpoint(stack, {
      handoffId: started.value.id,
      publicChapter: "CONVERSA_ASK_STORY",
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;

    expect(advanced.value.checkpoint.publicChapter).toBe("CONVERSA_ASK_STORY");

    const noRegression = await advanceHandoffCheckpoint(stack, {
      handoffId: started.value.id,
      publicChapter: "LIMIAR_INVITE",
    });
    expect(noRegression.ok).toBe(true);
    if (!noRegression.ok) return;
    expect(noRegression.value.checkpoint.publicChapter).toBe("CONVERSA_ASK_STORY");
  });

  it("completa handoff antes do bootstrap", async () => {
    const stack = createInMemoryHandoffStack();
    const started = await startHandoff(stack, {
      sessionId: SESSION,
      intention: "ACEITAR_ACOMPANHAMENTO",
      publicChapter: "CONVERSA_CLOSING",
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const completed = await completeHandoff(stack, {
      handoffId: started.value.id,
      publicChapter: "CONVERSA_CLOSING",
    });

    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    expect(completed.value.status).toBe("COMPLETED");
    expect(completed.value.completedAt).toBeTruthy();
  });

  it("bootstrap cria Case, Patient, Journey e Ownership", async () => {
    const stack = createInMemoryHandoffStack();
    const started = await startHandoff(stack, {
      sessionId: SESSION,
      intention: "ACEITAR_ACOMPANHAMENTO",
      publicChapter: "CONVERSA_CLOSING",
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const bootstrapped = await bootstrapJourneyFromHandoff(stack, {
      handoffId: started.value.id,
      intention: "ACEITAR_ACOMPANHAMENTO",
      patient: { fullName: "Maria Silva", preferredName: "Maria" },
      journeyTitle: "Jornada de Maria",
      managerId: "manager-1",
    });

    expect(bootstrapped.ok).toBe(true);
    if (!bootstrapped.ok) return;

    expect(bootstrapped.value.status).toBe("BOOTSTRAPPED");
    expect(bootstrapped.value.bootstrap?.caseId).toBeTruthy();
    expect(bootstrapped.value.bootstrap?.patientId).toBeTruthy();
    expect(bootstrapped.value.bootstrap?.journeyId).toBeTruthy();
    expect(bootstrapped.value.bootstrap?.ownership.managerId).toBe("manager-1");
  });

  it("impede bootstrap duplicado", async () => {
    const stack = createInMemoryHandoffStack();
    const started = await startHandoff(stack, {
      sessionId: "session-dup",
      intention: "INICIAR_CONVERSA",
      publicChapter: "LIMIAR_INVITE",
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const first = await bootstrapJourneyFromHandoff(stack, {
      handoffId: started.value.id,
      intention: "INICIAR_CONVERSA",
      patient: { fullName: "João" },
      journeyTitle: "Jornada",
    });
    expect(first.ok).toBe(true);

    const second = await bootstrapJourneyFromHandoff(stack, {
      handoffId: started.value.id,
      intention: "INICIAR_CONVERSA",
      patient: { fullName: "João" },
      journeyTitle: "Jornada",
    });
    expect(second.ok).toBe(false);
  });
});

describe("portal continuation projection", () => {
  it("portal abre do ponto onde a narrativa terminou", async () => {
    const stack = createInMemoryHandoffStack();
    const started = await handleStartHandoff(stack, {
      sessionId: SESSION,
      intention: "CONTAR_HISTORIA",
      publicChapter: "CONVERSA_ASK_STORY",
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    await handleBootstrapJourney(stack, {
      handoffId: started.value.handoff.id,
      intention: "CONTAR_HISTORIA",
      patient: { fullName: "Ana Costa", preferredName: "Ana" },
      journeyTitle: "Jornada de Ana",
    });

    const projection = await handleProjectContinuation(stack, {
      handoffId: started.value.handoff.id,
    });

    expect(projection.ok).toBe(true);
    if (!projection.ok) return;

    expect(projection.value.continuation.shouldRestartExperience).toBe(false);
    expect(projection.value.continuation.resumeAt.publicChapter).toBe("CONVERSA_ASK_STORY");
    expect(projection.value.continuation.resumeAt.etapaAtual).toBe("HISTORIA");
    expect(projection.value.continuation.resumeAt.portalSurface).toBe("onboarding");
    expect(projection.value.continuation.journeyId).toBeTruthy();
  });

  it("projeta continuação mesmo antes do bootstrap", async () => {
    const stack = createInMemoryHandoffStack();
    const started = await startHandoff(stack, {
      sessionId: "pre-bootstrap",
      intention: "INICIAR_CONVERSA",
      publicChapter: "LIMIAR_INVITE",
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const projection = await projectPortalContinuationFromHandoff(stack, {
      handoffId: started.value.id,
    });

    expect(projection.ok).toBe(true);
    if (!projection.ok) return;

    expect(projection.value.journeyId).toBeNull();
    expect(projection.value.shouldRestartExperience).toBe(false);
    expect(projection.value.resumeAt.etapaAtual).toBe("PRIMEIRO_CONTATO");
  });
});

describe("narrative mapping", () => {
  it("mapeia capítulos públicos para etapas de domínio sem duplicação", () => {
    expect(narrativeMappingIsConsistent()).toBe(true);
    expect(mapPublicChapterToEtapa("LIMIAR_INVITE")).toBe("CONFIANCA");
    expect(mapPublicChapterToEtapa("CONVERSA_ASK_STORY")).toBe("HISTORIA");
  });

  it("intenção reforça etapa operacional", () => {
    expect(mapIntentionToEtapa("ACEITAR_ACOMPANHAMENTO")).toBe("CADASTRO");
    expect(mapIntentionToEtapa("CONTAR_HISTORIA")).toBe("HISTORIA");
  });

  it("resolve estado operacional alinhado ao experience-flow", () => {
    const state = resolveOperationalState("CONVERSA_CLOSING", "ACEITAR_ACOMPANHAMENTO");
    expect(state.etapa).toBe("CADASTRO");
    expect(state.estadoFluxo).toBe("CADASTRO");
  });
});
