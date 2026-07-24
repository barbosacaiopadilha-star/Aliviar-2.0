import type { VerificationProfile, PublishedProfileSnapshot } from "./types";
import { VerificationScheduler } from "./scheduler";

export class ProfileRegistry {
  private readonly profiles = new Map<string, VerificationProfile>();

  register(profile: VerificationProfile): void {
    this.profiles.set(profile.profileId, profile);
  }

  get(profileId: string): VerificationProfile | undefined {
    return this.profiles.get(profileId);
  }

  list(): VerificationProfile[] {
    return [...this.profiles.values()];
  }

  updateSnapshot(profileId: string, snapshot: PublishedProfileSnapshot): void {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return;
    }
    this.profiles.set(profileId, {
      ...profile,
      snapshot,
    });
  }

  markVerified(profileId: string, verifiedAt: string): void {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return;
    }
    const scheduler = new VerificationScheduler();
    this.profiles.set(profileId, scheduler.markVerified(profile, verifiedAt));
  }

  size(): number {
    return this.profiles.size;
  }

  reset(): void {
    this.profiles.clear();
  }
}
