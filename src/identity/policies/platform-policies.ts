import type { OperationalStage } from "@/kernel/jornada/operational-stage";
import { canAdvanceStage } from "@/kernel/rbac/permissions";

import type { AuthorizationService } from "../authorization/authorization-service";
import type { JourneyRecord } from "../projection/journey-scope";

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

export interface Policy<TInput> {
  readonly name: string;
  evaluate(auth: AuthorizationService, input: TInput): PolicyResult;
}

export interface CanAdvanceStageInput {
  journey: JourneyRecord;
  currentStage: OperationalStage;
}

export const CanAdvanceStage: Policy<CanAdvanceStageInput> = {
  name: "CanAdvanceStage",
  evaluate(auth, input) {
    const access = auth.canMutateJourney(input.journey);
    if (!access.ok) {
      return { allowed: false, reason: access.message };
    }

    const advance = auth.authorize("journey.advance");
    if (!advance.ok) {
      return { allowed: false, reason: advance.message };
    }

    if (!canAdvanceStage(advance.context.actor.role, input.currentStage)) {
      return {
        allowed: false,
        reason: `Papel ${advance.context.actor.role} n├úo avan├ºa etapa ${input.currentStage}.`,
      };
    }

    return { allowed: true };
  },
};

export const CanReadJourney: Policy<{ journey: JourneyRecord }> = {
  name: "CanReadJourney",
  evaluate(auth, input) {
    const access = auth.canAccessJourney(input.journey);
    return access.ok ? { allowed: true } : { allowed: false, reason: access.message };
  },
};

export const CanPublishDelivery: Policy<{ journey: JourneyRecord }> = {
  name: "CanPublishDelivery",
  evaluate(auth, input) {
    const access = auth.canMutateJourney(input.journey);
    if (!access.ok) {
      return { allowed: false, reason: access.message };
    }

    const permission = auth.authorize("delivery.publish");
    return permission.ok ? { allowed: true } : { allowed: false, reason: permission.message };
  },
};

export const CanAssignCurator: Policy<{ journey: JourneyRecord }> = {
  name: "CanAssignCurator",
  evaluate(auth, input) {
    const access = auth.canMutateJourney(input.journey);
    if (!access.ok) {
      return { allowed: false, reason: access.message };
    }

    const permission = auth.authorize("curator.assign");
    return permission.ok ? { allowed: true } : { allowed: false, reason: permission.message };
  },
};

export const CanReadDocuments: Policy<{ journey: JourneyRecord }> = {
  name: "CanReadDocuments",
  evaluate(auth, input) {
    const access = auth.canAccessJourney(input.journey);
    if (!access.ok) {
      return { allowed: false, reason: access.message };
    }

    const permission = auth.authorize("documents.read");
    return permission.ok ? { allowed: true } : { allowed: false, reason: permission.message };
  },
};

export const PLATFORM_POLICIES = [
  CanAdvanceStage,
  CanReadJourney,
  CanPublishDelivery,
  CanAssignCurator,
  CanReadDocuments,
] as const;

export function evaluatePolicy<TInput>(
  auth: AuthorizationService,
  policy: Policy<TInput>,
  input: TInput,
): PolicyResult {
  return policy.evaluate(auth, input);
}
