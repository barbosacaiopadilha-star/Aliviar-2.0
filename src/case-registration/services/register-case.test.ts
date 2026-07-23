import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { AuthorizationService } from "@/identity/authorization/authorization-service";
import { actorFromIdentity } from "@/identity/model/actor";
import { permissionsForRole } from "@/identity/model/permission";
import { authenticatedSession } from "@/identity/model/session";
import { createStaffUser } from "@/identity/model/user";
import { InMemoryJourneyKernelRepository } from "@/kernel/infrastructure/in-memory-journey-kernel-repository";
import { InMemoryTimelineRepository } from "@/kernel/infrastructure/in-memory-timeline-repository";

import { createCaseContext } from "../model/case-context";
import { CaseAggregate } from "../model/case";
import { createJourneyOwnership } from "../model/journey-ownership";
import { InMemoryCaseRepository, InMemoryPatientRepository } from "../infrastructure/in-memory-repositories";
import { registerCase } from "../services/register-case";
import { handleRegisterCase } from "../api/handlers";

let tick = 0;

function buildDeps(role: "OPERATION" | "AUDITOR" = "OPERATION") {
  const identity = {
    userId: `${role.toLowerCase()}-1`,
    role,
    isActive: true,
    staffProfileId: `${role.toLowerCase()}-1`,
  };

  const context = {
    session: authenticatedSession(createStaffUser(identity.userId, "op@aliviar.health"), null, "supabase"),
    identity,
    actor: actorFromIdentity(identity),
    permissions: permissionsForRole(role),
    journeyScope: { type: "operational_queue" as const },
  };

  return {
    caseRepository: new InMemoryCaseRepository(),
    patientRepository: new InMemoryPatientRepository(),
    journeyRepository: new InMemoryJourneyKernelRepository(),
    timelineRepository: new InMemoryTimelineRepository(),
    authorization: new AuthorizationService(context),
    ids: { nextId: () => `id-${tick += 1}` },
    clock: { now: () => `2026-07-22T13:00:${String(tick).padStart(2, "0")}.000Z` },
    actor: { id: identity.staffProfileId!, role },
  };
}

describe("registerCase", () => {
  it("nasce caso, associa paciente, cria jornada, atribui respons├ível e registra timeline", async () => {
    const deps = buildDeps();
    const managerId = randomUUID();

    const result = await registerCase(deps, {
      actor: deps.actor,
      intake: {
        patient: {
          type: "new",
          data: {
            fullName: "Maria Silva",
            email: "maria@email.com",
          },
        },
        context: createCaseContext({
          title: "Dor lombar persistente",
          objective: "Encontrar especialista",
          source: "INTAKE",
        }),
        ownership: createJourneyOwnership(managerId),
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const savedCase = await deps.caseRepository.findById(result.value.caseId);
    const journey = await deps.journeyRepository.findById(result.value.journeyId);
    const timeline = await deps.timelineRepository.listByJourney(result.value.journeyId);
    const events = (deps.caseRepository as InMemoryCaseRepository).listEvents(result.value.caseId);

    expect(savedCase?.journeyId).toBe(result.value.journeyId);
    expect(savedCase?.ownership.managerId).toBe(managerId);
    expect(journey?.currentStage).toBe("CADASTRO");
    expect(timeline.length).toBeGreaterThanOrEqual(2);
    expect(events.map((e) => e.type)).toEqual([
      "CASE_CREATED",
      "PATIENT_ASSOCIATED",
      "OWNERSHIP_ASSIGNED",
      "JOURNEY_BOOTSTRAPPED",
    ]);
  });

  it("associa paciente existente sem criar duplicata", async () => {
    const deps = buildDeps();
    const existing = await deps.patientRepository.create(
      { fullName: "Jo├úo Santos", cpf: "12345678901" },
      deps.clock.now(),
    );

    const result = await registerCase(deps, {
      actor: deps.actor,
      intake: {
        patient: { type: "existing", patientId: existing.id },
        context: createCaseContext({ title: "Segunda jornada do paciente" }),
        ownership: createJourneyOwnership(randomUUID()),
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.patientId).toBe(existing.id);
    }
  });

  it("rejeita registro sem permiss├úo", async () => {
    const deps = buildDeps("AUDITOR");

    const result = await registerCase(deps, {
      actor: { id: "aud-1", role: "AUDITOR" },
      intake: {
        patient: { type: "new", data: { fullName: "Teste" } },
        context: createCaseContext({ title: "Caso negado" }),
        ownership: createJourneyOwnership(randomUUID()),
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("permite bootstrap delegado com ator MANAGER mesmo quando a sessão é de paciente", async () => {
    const staffDeps = buildDeps("OPERATION");
    const patientIdentity = {
      userId: "patient-auth-1",
      role: "PATIENT" as const,
      isActive: true,
      patientId: "patient-1",
    };
    const patientContext = {
      session: authenticatedSession(
        createStaffUser(patientIdentity.userId, "paciente@aliviar.health"),
        null,
        "supabase" as const,
      ),
      identity: patientIdentity,
      actor: actorFromIdentity(patientIdentity),
      permissions: permissionsForRole("PATIENT"),
      journeyScope: { type: "own" as const, patientId: "patient-1" },
    };

    const deps = {
      ...staffDeps,
      authorization: new AuthorizationService(patientContext),
    };

    const result = await registerCase(deps, {
      actor: { id: "manager-profile-1", role: "MANAGER" },
      intake: {
        patient: { type: "new", data: { fullName: "Maria Bootstrap" } },
        context: createCaseContext({ title: "Jornada do handoff", source: "INTAKE" }),
        ownership: createJourneyOwnership("manager-profile-1"),
      },
    });

    expect(result.ok).toBe(true);
  });

  it("jornada sempre nasce do caso ÔÇö caso sem jornada permanece OPEN", () => {
    const draft = CaseAggregate.createDraft({
      id: "case-x",
      patientId: "p-x",
      context: createCaseContext({ title: "Rascunho" }),
      ownership: createJourneyOwnership("mgr-x"),
      createdBy: "op-1",
      occurredAt: "2026-07-22T12:00:00.000Z",
    });

    expect(draft.hasJourney).toBe(false);
    expect(draft.toRecord().status).toBe("OPEN");
  });
});

describe("handleRegisterCase", () => {
  it("retorna 201 com contrato can├┤nico", async () => {
    const deps = buildDeps();
    const managerId = randomUUID();

    const response = await handleRegisterCase(
      deps,
      deps.actor,
      {
        patient: { type: "new", full_name: "Ana Costa" },
        context: { title: "Investiga├º├úo diagn├│stica", source: "STAFF" },
        ownership: { manager_id: managerId },
      },
    );

    expect(response.status).toBe(201);
    if (response.status === 201) {
      expect(response.body.case_id).toBeTruthy();
      expect(response.body.journey_id).toBeTruthy();
      expect(response.body.journey_stage).toBe("CADASTRO");
      expect(response.body.owner_id).toBe(managerId);
    }
  });
});
