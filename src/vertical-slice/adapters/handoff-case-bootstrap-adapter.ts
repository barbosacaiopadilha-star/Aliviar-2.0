import type { BootstrapJourneyInput, JourneyBootstrapResult } from "@/journey-handoff/model/bootstrap-result";
import type { JourneyBootstrapPort } from "@/journey-handoff/ports/handoff-ports";
import { registerCase } from "@/case-registration";
import type { RegisterCaseDependencies } from "@/case-registration";
import type { KernelActor } from "@/kernel/rbac/authorization";
import { createCaseContext } from "@/case-registration/model/case-context";
import { createJourneyOwnership } from "@/case-registration/model/journey-ownership";

export interface HandoffCaseBootstrapAdapterDeps extends RegisterCaseDependencies {
  systemActor: KernelActor;
  defaultManagerId: string;
}

/** Conecta Journey Handoff ao Case Registration + Kernel. */
export class HandoffCaseBootstrapAdapter implements JourneyBootstrapPort {
  constructor(private readonly deps: HandoffCaseBootstrapAdapterDeps) {}

  async bootstrap(input: BootstrapJourneyInput): Promise<JourneyBootstrapResult> {
    const result = await registerCase(this.deps, {
      actor: this.deps.systemActor,
      intake: {
        patient: {
          type: "new",
          data: {
            fullName: input.patient.fullName,
            preferredName: input.patient.preferredName,
            email: input.patient.email,
            phone: input.patient.phone,
          },
        },
        context: createCaseContext({
          title: input.journeyTitle,
          objective: input.journeyObjective ?? null,
          source: "INTAKE",
        }),
        ownership: createJourneyOwnership(input.managerId ?? this.deps.defaultManagerId),
      },
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return {
      caseId: result.value.caseId,
      patientId: result.value.patientId,
      journeyId: result.value.journeyId,
      ownership: {
        managerId: input.managerId ?? this.deps.defaultManagerId,
        assignedCuratorId: null,
      },
      bootstrappedAt: this.deps.clock.now(),
    };
  }
}
