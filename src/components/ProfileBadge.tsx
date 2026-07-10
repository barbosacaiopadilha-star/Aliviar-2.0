import type { Profile } from "@/lib/types/database";
import { USER_ROLE_LABELS } from "@/lib/types/database";

export function ProfileBadge({ profile }: { profile: Profile }) {
  return (
    <div className="card inline-flex flex-col gap-1 px-4 py-3">
      <span className="text-sm font-semibold text-ink">{profile.full_name}</span>
      <span className="badge bg-sage-soft text-sage">{USER_ROLE_LABELS[profile.role]}</span>
    </div>
  );
}
