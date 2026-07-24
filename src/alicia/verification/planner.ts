import { VerificationScheduler } from "./scheduler";
import type { VerificationProfile, VerificationQueueItem } from "./types";

function queueId(): string {
  return `vq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type PlannerCriteria = {
  now?: Date;
  sourceChangedProfileIds?: Set<string>;
  newEvidenceProfileIds?: Set<string>;
  recentlyPublishedDays?: number;
};

export class VerificationPlanner {
  private readonly scheduler = new VerificationScheduler();

  plan(
    profiles: VerificationProfile[],
    criteria: PlannerCriteria = {},
  ): VerificationQueueItem[] {
    const now = criteria.now ?? new Date();
    const sourceChanged = criteria.sourceChangedProfileIds ?? new Set<string>();
    const newEvidence = criteria.newEvidenceProfileIds ?? new Set<string>();
    const recentDays = criteria.recentlyPublishedDays ?? 7;
    const recentCutoff = now.getTime() - recentDays * 24 * 60 * 60 * 1000;

    const items: VerificationQueueItem[] = [];

    for (const profile of profiles) {
      const reasons: string[] = [];

      if (profile.neverVerified) {
        reasons.push("perfil nunca revisado");
      }

      if (this.scheduler.isDue(profile, now)) {
        reasons.push("tempo desde última verificação");
      }

      if (sourceChanged.has(profile.profileId) || profile.sourceChanged) {
        reasons.push("mudança em fonte");
      }

      if (newEvidence.has(profile.profileId) || profile.newEvidenceAvailable) {
        reasons.push("nova evidência");
      }

      if (profile.recentlyPublished || new Date(profile.snapshot.publishedAt).getTime() >= recentCutoff) {
        reasons.push("publicação recente");
      }

      if (profile.verificationFrequency === "ON_DEMAND") {
        reasons.push("verificação sob demanda");
      }

      if (reasons.length === 0) {
        continue;
      }

      items.push({
        queueId: queueId(),
        profileId: profile.profileId,
        candidateId: profile.candidateId,
        doctorName: profile.snapshot.doctorName,
        scheduledAt: now.toISOString(),
        reason: reasons.join("; "),
        frequency: profile.verificationFrequency,
      });
    }

    return items.sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt));
  }
}
