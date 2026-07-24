import { FREQUENCY_MS } from "./constants";
import type { VerificationFrequency, VerificationProfile } from "./types";

export class VerificationScheduler {
  computeNextVerificationAt(
    frequency: VerificationFrequency,
    from: Date = new Date(),
  ): string {
    const offset = FREQUENCY_MS[frequency] ?? FREQUENCY_MS.WEEKLY;
    if (frequency === "ON_DEMAND") {
      return from.toISOString();
    }
    return new Date(from.getTime() + offset).toISOString();
  }

  isDue(profile: VerificationProfile, now: Date = new Date()): boolean {
    if (profile.neverVerified) {
      return true;
    }
    return new Date(profile.nextVerificationAt).getTime() <= now.getTime();
  }

  reschedule(
    profile: VerificationProfile,
    frequency?: VerificationFrequency,
  ): VerificationProfile {
    const nextFrequency = frequency ?? profile.verificationFrequency;
    const now = new Date();
    return {
      ...profile,
      verificationFrequency: nextFrequency,
      nextVerificationAt: this.computeNextVerificationAt(nextFrequency, now),
    };
  }

  markVerified(profile: VerificationProfile, verifiedAt: string): VerificationProfile {
    return {
      ...profile,
      lastVerifiedAt: verifiedAt,
      neverVerified: false,
      nextVerificationAt: this.computeNextVerificationAt(
        profile.verificationFrequency,
        new Date(verifiedAt),
      ),
    };
  }
}
